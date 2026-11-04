import pg from 'pg';
import { writeFile, rename } from 'node:fs/promises';

// Export saved content, not fresh seeds: owner edits and annotations must survive publishing.
const db = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://notebook:notebook@127.0.0.1:5433/notebook',
  connectionTimeoutMillis: 5000,
});
try {
  const { rows } = await db.query('SELECT data FROM entries ORDER BY position,id');
  if (!rows.length) throw new Error('The database library is empty; the previous export was kept.');
  const kinds = ['kana', 'kanji', 'grammar', 'vocabulary', 'numbers', 'adjectives'];
  if (rows.some(({ data }) => !kinds.includes(data.kind)))
    throw new Error('Unknown entry kind; previous export was kept.');
  for (const kind of kinds) {
    const content = rows
      .filter(({ data }) => data.kind === kind)
      .map(({ data }) => ({
        ...data,
        level: /^n5 starter$/i.test(data.level) ? 'N5' : data.level,
      }));
    await writeFile(`public/${kind}.json.tmp`, JSON.stringify(content, null, 2) + '\n');
  }
  for (const kind of kinds) await rename(`public/${kind}.json.tmp`, `public/${kind}.json`);
  const snapshot = {
    version: 4,
    exportedAt: new Date().toISOString(),
    files: kinds.map((kind) => `/${kind}.json`),
    preferences: { furigana: true, romaji: false },
  };
  await writeFile('public/notebook.json.tmp', JSON.stringify(snapshot, null, 2) + '\n');
  await rename('public/notebook.json.tmp', 'public/notebook.json');
  console.log(`Exported ${rows.length} saved entries to public/notebook.json.`);
} finally {
  await db.end();
}
