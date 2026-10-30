import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const file=resolve(process.env.DATA_DIR||'./data','notebook.sqlite');
mkdirSync(dirname(file),{recursive:true});
export const sqlite=new DatabaseSync(file);
sqlite.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS content(user_id TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(user_id,id));
CREATE TABLE IF NOT EXISTS preferences(user_id TEXT PRIMARY KEY,data TEXT NOT NULL);
PRAGMA user_version=1;`);
// Small SQLite adapter keeps route queries parameterized; all statements are prepared.
export const db={prepare(sql:string){return {bind(...args:any[]){const stmt=sqlite.prepare(sql);return {async all<T>(){return {results:stmt.all(...args) as T[]}},async first<T>(){return stmt.get(...args) as T|undefined},async run(){return stmt.run(...args)}}}}}};
