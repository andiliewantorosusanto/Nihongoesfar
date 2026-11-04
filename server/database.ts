import { addGrammarAnnotations } from '../app/lib/grammar-annotations.ts';
import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { entries as seed, mergeEntry, type Entry } from '../app/lib/content.ts';

export const db = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://notebook:notebook@127.0.0.1:5433/notebook',
  connectionTimeoutMillis: 5000,
});
db.on('error', (error) => console.error('Database connection error:', error.message));

// One transaction and a database lock make startup safe to retry or run concurrently.
export async function initializeDatabase() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(734921)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE IF NOT EXISTS entries (id text PRIMARY KEY, data jsonb NOT NULL, position integer NOT NULL);
      CREATE TABLE IF NOT EXISTS preferences (user_id text PRIMARY KEY, data jsonb NOT NULL);
    `);
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='001-library'")).rowCount
    ) {
      for (const [position, entry] of seed.entries()) {
        await client.query(
          'INSERT INTO entries(id,data,position) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',
          [entry.id, entry, position],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('001-library')");
    }
    const source =
      process.env.SQLITE_IMPORT_PATH ||
      resolve(process.env.DATA_DIR || './data', 'notebook.sqlite');
    if (
      existsSync(source) &&
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='002-sqlite-import'"))
        .rowCount
    ) {
      const sqlite = new DatabaseSync(source, { readOnly: true });
      try {
        const rows = sqlite
          .prepare('SELECT id,data FROM content WHERE user_id=?')
          .all('personal-notebook');
        const nextPosition = Number(
          (await client.query('SELECT COALESCE(MAX(position),-1)+1 AS next FROM entries')).rows[0]
            .next,
        );
        for (const [index, row] of rows.entries()) {
          const saved = JSON.parse(String(row.data)) as Entry;
          const original = seed.find((entry) => entry.id === row.id);
          const entry = original ? mergeEntry(original, saved) : saved;
          await client.query(
            'INSERT INTO entries(id,data,position) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
            [entry.id, entry, nextPosition + index],
          );
        }
        const prefs = sqlite
          .prepare('SELECT data FROM preferences WHERE user_id=?')
          .get('personal-notebook');
        if (prefs)
          await client.query(
            'INSERT INTO preferences(user_id,data) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING',
            ['personal-notebook', JSON.parse(String(prefs.data))],
          );
        await client.query("INSERT INTO schema_migrations(name) VALUES('002-sqlite-import')");
        console.log(
          `Imported ${rows.length} saved entries from SQLite; the original file is unchanged.`,
        );
      } finally {
        sqlite.close();
      }
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='003-guided-grammar'"))
        .rowCount
    ) {
      for (const entry of seed.filter((e) => e.kind === 'grammar' && e.lesson && e.exercises)) {
        await client.query(
          `UPDATE entries SET data =
          CASE WHEN data ? 'lesson' THEN data ELSE data || jsonb_build_object('lesson',$2::jsonb) END
          || CASE WHEN data ? 'exercises' THEN '{}'::jsonb ELSE jsonb_build_object('exercises',$3::jsonb) END
          WHERE id=$1`,
          [entry.id, JSON.stringify(entry.lesson), JSON.stringify(entry.exercises)],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('003-guided-grammar')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='004-grammar-colors'"))
        .rowCount
    ) {
      for (const source of seed.filter((e) => e.kind === 'grammar' && e.lesson)) {
        const row = (await client.query('SELECT data FROM entries WHERE id=$1', [source.id]))
          .rows[0];
        if (row)
          await client.query('UPDATE entries SET data=$2 WHERE id=$1', [
            source.id,
            addGrammarAnnotations(row.data, source),
          ]);
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('004-grammar-colors')");
    }
    if (
      !(
        await client.query(
          "SELECT 1 FROM schema_migrations WHERE name='012-expanded-grammar-practice'",
        )
      ).rowCount
    ) {
      for (const source of seed.filter((e) => e.lesson && e.exercises)) {
        const row = (await client.query('SELECT data FROM entries WHERE id=$1', [source.id]))
          .rows[0];
        if (!row) continue;
        const saved = row.data;
        const ids = new Set((saved.exercises || []).map((e: { id: string }) => e.id));
        const added = source.exercises!.filter((e) => e.id.startsWith('extra-') && !ids.has(e.id));
        await client.query('UPDATE entries SET data=$2 WHERE id=$1', [
          source.id,
          { ...saved, exercises: [...(saved.exercises || []), ...added] },
        ]);
      }
      await client.query(
        "INSERT INTO schema_migrations(name) VALUES('012-expanded-grammar-practice')",
      );
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='005-class-topics'"))
        .rowCount
    ) {
      let position = Number(
        (await client.query('SELECT COALESCE(MAX(position),-1)+1 AS next FROM entries')).rows[0]
          .next,
      );
      for (const entry of seed.filter((e) => e.tags.includes('Study guide'))) {
        await client.query(
          'INSERT INTO entries(id,data,position) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',
          [entry.id, entry, position++],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('005-class-topics')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='006-daily-routine'"))
        .rowCount
    ) {
      const entry = seed.find((e) => e.id === 'study-daily-routine');
      if (!entry) throw new Error('Daily routine starter content is missing');
      await client.query(
        'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
        [entry.id, entry],
      );
      await client.query("INSERT INTO schema_migrations(name) VALUES('006-daily-routine')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='007-verb-particle-pairs'"))
        .rowCount
    ) {
      const entry = seed.find((entry) => entry.id === 'study-verb-particle-pairs');
      if (!entry) throw new Error('Verb–particle starter content is missing');
      await client.query(
        'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
        [entry.id, entry],
      );
      await client.query("INSERT INTO schema_migrations(name) VALUES('007-verb-particle-pairs')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='008-desire-movement-kara'"))
        .rowCount
    ) {
      for (const id of ['grammar-tai', 'grammar-destination', 'study-particle-kara']) {
        const source = seed.find((entry) => entry.id === id);
        if (!source) throw new Error('Grammar starter content is missing: ' + id);
        const saved: Entry | undefined = (
          await client.query('SELECT data FROM entries WHERE id=$1', [id])
        ).rows[0]?.data;
        if (!saved) {
          await client.query(
            'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries',
            [id, source],
          );
          continue;
        }
        // Add reference material without replacing saved lessons, exercises, or personal notes.
        const references = [...(saved.references || [])];
        for (const reference of source.references || []) {
          if (!references.some((existing) => existing.heading === reference.heading)) {
            references.push(reference);
          }
        }
        const addition = source.note.split('\n').at(-1)!;
        await client.query('UPDATE entries SET data=$2 WHERE id=$1', [
          id,
          {
            ...saved,
            references,
            note: saved.note.includes(addition) ? saved.note : saved.note + '\n' + addition,
          },
        ]);
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('008-desire-movement-kara')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='009-travel-class-notes'"))
        .rowCount
    ) {
      for (const id of ['study-travel-when-how', 'study-embassy']) {
        const entry = seed.find((entry) => entry.id === id);
        if (!entry) continue;
        await client.query(
          'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
          [id, entry],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('009-travel-class-notes')");
    }
    if (
      !(
        await client.query("SELECT 1 FROM schema_migrations WHERE name='010-adjective-class-notes'")
      ).rowCount
    ) {
      for (const id of [
        'study-adjective-forms',
        'study-adjective-joining',
        'study-noun-descriptions',
      ]) {
        const entry = seed.find((entry) => entry.id === id);
        if (!entry) throw new Error('Adjective starter content is missing: ' + id);
        await client.query(
          'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
          [id, entry],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('010-adjective-class-notes')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='011-noun-sentence-notes'"))
        .rowCount
    ) {
      const entry = seed.find((entry) => entry.id === 'study-noun-sentences');
      if (!entry) throw new Error('Noun sentence starter content is missing');
      await client.query(
        'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
        [entry.id, entry],
      );
      await client.query("INSERT INTO schema_migrations(name) VALUES('011-noun-sentence-notes')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='012-clean-study-labels'"))
        .rowCount
    ) {
      const { rows } = await client.query('SELECT id,data FROM entries');
      for (const row of rows) {
        const cleaned = JSON.parse(
          JSON.stringify(row.data, (_key, value) => {
            if (typeof value !== 'string') return value;
            if (value === 'Class topics') return 'Study guide';
            if (value === 'Class grammar') return 'Grammar basics';
            if (value === 'Class vocabulary') return 'Vocabulary';
            if (value === 'Places from class') return 'Places';
            return value
              .replace(/\nClass assignment:[^\n]*/g, '')
              .replace(' These examples are based on your class board.', '');
          }),
        );
        if (JSON.stringify(cleaned) !== JSON.stringify(row.data)) {
          await client.query('UPDATE entries SET data=$2 WHERE id=$1', [row.id, cleaned]);
        }
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('012-clean-study-labels')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='013-tense-topics'"))
        .rowCount
    ) {
      for (const id of ['study-present-tense', 'study-past-tense']) {
        const entry = seed.find((entry) => entry.id === id);
        if (!entry) throw new Error('Tense starter content is missing: ' + id);
        await client.query(
          'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
          [id, entry],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('013-tense-topics')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='014-vehicles-appliances'"))
        .rowCount
    ) {
      const entry = seed.find((entry) => entry.id === 'study-vehicles-appliances');
      if (!entry) throw new Error('Vehicle and appliance starter content is missing');
      await client.query(
        'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
        [entry.id, entry],
      );
      await client.query("INSERT INTO schema_migrations(name) VALUES('014-vehicles-appliances')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='015-photo-vocabulary'"))
        .rowCount
    ) {
      for (const entry of seed.filter((entry) => entry.kind === 'vocabulary')) {
        await client.query(
          `INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries
           WHERE NOT EXISTS (SELECT 1 FROM entries WHERE data->>'kind'='vocabulary' AND data->>'japanese'=$3 AND data->>'reading'=$4)
           ON CONFLICT(id) DO NOTHING`,
          [entry.id, entry, entry.japanese, entry.reading],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('015-photo-vocabulary')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='016-routine-verbs'"))
        .rowCount
    ) {
      for (const entry of seed.filter(
        (e) => e.id.startsWith('routine-') || ['study-masu-groups', 'study-ni-vs-e'].includes(e.id),
      )) {
        await client.query(
          'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
          [entry.id, entry],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('016-routine-verbs')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='017-movement-expressions'"))
        .rowCount
    ) {
      for (const entry of seed.filter(
        (e) =>
          e.id.startsWith('movement-') ||
          ['study-some-any-none', 'study-movement-routes', 'study-becoming-narimasu'].includes(
            e.id,
          ),
      )) {
        await client.query(
          'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
          [entry.id, entry],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('017-movement-expressions')");
    }
    if (!(await client.query("SELECT 1 FROM schema_migrations WHERE name='018-nagara'")).rowCount) {
      const entry = seed.find((e) => e.id === 'study-nagara');
      if (!entry) throw new Error('Nagara guide is missing');
      await client.query(
        'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
        [entry.id, entry],
      );
      await client.query("INSERT INTO schema_migrations(name) VALUES('018-nagara')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='020-tense-feedback'"))
        .rowCount
    ) {
      for (const source of seed.filter((e) =>
        ['study-present-tense', 'study-past-tense'].includes(e.id),
      )) {
        const row = (await client.query('SELECT data FROM entries WHERE id=$1', [source.id]))
          .rows[0];
        if (!row) continue;
        const exercises = (row.data.exercises || []).map(
          (saved: { id: string; prompt: string }) => {
            const updated = source.exercises?.find(
              (e) => e.id === saved.id && e.prompt === saved.prompt,
            );
            return updated
              ? {
                  ...saved,
                  choices: updated.choices,
                  explanation: updated.explanation,
                  hint: updated.hint,
                }
              : saved;
          },
        );
        await client.query('UPDATE entries SET data=$2 WHERE id=$1', [
          source.id,
          { ...row.data, exercises },
        ]);
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('020-tense-feedback')");
    }
    if (
      !(await client.query("SELECT 1 FROM schema_migrations WHERE name='019-basic-adjectives'"))
        .rowCount
    ) {
      for (const entry of seed.filter((e) => e.kind === 'adjectives')) {
        await client.query(
          'INSERT INTO entries(id,data,position) SELECT $1,$2,COALESCE(MAX(position),-1)+1 FROM entries ON CONFLICT(id) DO NOTHING',
          [entry.id, entry],
        );
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('019-basic-adjectives')");
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
