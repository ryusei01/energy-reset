import * as SQLite from 'expo-sqlite';
import type { Condition, GameId } from '../lib/games';
let database: SQLite.SQLiteDatabase | null = null;
export async function db() {
  if (database) return database;
  const conn = await SQLite.openDatabaseAsync('energy-reset.db');
  await conn.execAsync(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS condition_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, sleepiness INTEGER NOT NULL, fatigue INTEGER NOT NULL, mood INTEGER NOT NULL, stress INTEGER NOT NULL, recorded_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS game_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, game_id TEXT NOT NULL, before_id INTEGER NOT NULL, after_id INTEGER, started_at TEXT NOT NULL, ended_at TEXT, score INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(before_id) REFERENCES condition_logs(id), FOREIGN KEY(after_id) REFERENCES condition_logs(id));
    CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS xp_events (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL UNIQUE, points INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sleep_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE, minutes INTEGER, early_awake INTEGER NOT NULL DEFAULT 0);`);
  database = conn;
  return conn;
}
export async function logCondition(c: Condition) {
  const conn = await db();
  const r = await conn.runAsync('INSERT INTO condition_logs(sleepiness,fatigue,mood,stress,recorded_at) VALUES(?,?,?,?,?)', c.sleepiness,c.fatigue,c.mood,c.stress,new Date().toISOString());
  return r.lastInsertRowId;
}
export async function startSession(game: GameId, before: Condition) {
  const conn = await db();
  const id = await logCondition(before);
  const r = await conn.runAsync('INSERT INTO game_sessions(game_id,before_id,started_at) VALUES(?,?,?)',game,id,new Date().toISOString());
  return r.lastInsertRowId;
}
export async function endSession(id: number, after: Condition, score: number) {
  const conn = await db();
  const afterId = await logCondition(after);
  await conn.runAsync('UPDATE game_sessions SET after_id=?,ended_at=?,score=? WHERE id=? AND ended_at IS NULL',afterId,new Date().toISOString(),score,id);
  await addXp(`session:${id}`,15);
}
export async function addXp(source: string, points: number) {
  const conn = await db();
  await conn.runAsync('INSERT OR IGNORE INTO xp_events(source,points,created_at) VALUES(?,?,?)',source,points,new Date().toISOString());
}
export async function getXp() {
  const conn = await db();
  const row = await conn.getFirstAsync<{total:number}>('SELECT COALESCE(SUM(points),0) AS total FROM xp_events');
  return row?.total ?? 0;
}
export async function getLatestCondition() {
  const conn = await db();
  return conn.getFirstAsync<Condition>('SELECT sleepiness,fatigue,mood,stress FROM condition_logs ORDER BY id DESC LIMIT 1');
}
export async function getInsights() {
  const conn = await db();
  return conn.getAllAsync<{game_id:string;plays:number;fatigue_delta:number;mood_delta:number}>(`SELECT s.game_id,COUNT(*) AS plays,ROUND(AVG(b.fatigue-a.fatigue),2) AS fatigue_delta,ROUND(AVG(a.mood-b.mood),2) AS mood_delta FROM game_sessions s JOIN condition_logs b ON b.id=s.before_id JOIN condition_logs a ON a.id=s.after_id GROUP BY s.game_id ORDER BY plays DESC`);
}
