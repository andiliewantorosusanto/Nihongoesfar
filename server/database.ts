import {addGrammarAnnotations} from '../app/lib/grammar-annotations.ts';
import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { entries as seed, mergeEntry, type Entry } from '../app/lib/content.ts';

export const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://notebook:notebook@127.0.0.1:5433/notebook',
  connectionTimeoutMillis: 5000,
});
db.on('error', error => console.error('Database connection error:', error.message));

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
    if (!(await client.query("SELECT 1 FROM schema_migrations WHERE name='001-library'")).rowCount) {
      for (const [position, entry] of seed.entries()) {
        await client.query('INSERT INTO entries(id,data,position) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING', [entry.id, entry, position]);
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('001-library')");
    }
    const source = process.env.SQLITE_IMPORT_PATH || resolve(process.env.DATA_DIR || './data', 'notebook.sqlite');
    if (existsSync(source) && !(await client.query("SELECT 1 FROM schema_migrations WHERE name='002-sqlite-import'")).rowCount) {
      const sqlite = new DatabaseSync(source, { readOnly: true });
      try {
        const rows = sqlite.prepare('SELECT id,data FROM content WHERE user_id=?').all('personal-notebook');
        const nextPosition = Number((await client.query('SELECT COALESCE(MAX(position),-1)+1 AS next FROM entries')).rows[0].next);
        for (const [index, row] of rows.entries()) {
          const saved = JSON.parse(String(row.data)) as Entry;
          const original = seed.find(entry => entry.id === row.id);
          const entry = original ? mergeEntry(original, saved) : saved;
          await client.query('INSERT INTO entries(id,data,position) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET data=excluded.data', [entry.id, entry, nextPosition + index]);
        }
        const prefs = sqlite.prepare('SELECT data FROM preferences WHERE user_id=?').get('personal-notebook');
        if (prefs) await client.query('INSERT INTO preferences(user_id,data) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING', ['personal-notebook', JSON.parse(String(prefs.data))]);
        await client.query("INSERT INTO schema_migrations(name) VALUES('002-sqlite-import')");
        console.log(`Imported ${rows.length} saved entries from SQLite; the original file is unchanged.`);
      } finally { sqlite.close(); }
    }
    if (!(await client.query("SELECT 1 FROM schema_migrations WHERE name='003-guided-grammar'")).rowCount) {
      for(const entry of seed.filter(e=>e.kind==='grammar'&&e.lesson&&e.exercises)){
        await client.query(`UPDATE entries SET data =
          CASE WHEN data ? 'lesson' THEN data ELSE data || jsonb_build_object('lesson',$2::jsonb) END
          || CASE WHEN data ? 'exercises' THEN '{}'::jsonb ELSE jsonb_build_object('exercises',$3::jsonb) END
          WHERE id=$1`,[entry.id,JSON.stringify(entry.lesson),JSON.stringify(entry.exercises)]);
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('003-guided-grammar')");
    }
    if (!(await client.query("SELECT 1 FROM schema_migrations WHERE name='004-grammar-colors'")).rowCount) {
      for(const source of seed.filter(e=>e.kind==='grammar'&&e.lesson)){
        const row=(await client.query('SELECT data FROM entries WHERE id=$1',[source.id])).rows[0];
        if(row)await client.query('UPDATE entries SET data=$2 WHERE id=$1',[source.id,addGrammarAnnotations(row.data,source)]);
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('004-grammar-colors')");
    }
    if (!(await client.query("SELECT 1 FROM schema_migrations WHERE name='005-class-topics'")).rowCount) {
      let position=Number((await client.query('SELECT COALESCE(MAX(position),-1)+1 AS next FROM entries')).rows[0].next);
      for(const entry of seed.filter(e=>e.tags.includes('Class topics'))){
        await client.query('INSERT INTO entries(id,data,position) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING',[entry.id,entry,position++]);
      }
      await client.query("INSERT INTO schema_migrations(name) VALUES('005-class-topics')");
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
