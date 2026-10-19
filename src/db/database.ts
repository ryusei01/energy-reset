import * as SQLite from 'expo-sqlite';
import type { Condition, GameId } from '../lib/games';
import type { BackupPayload, ConditionRow, DailyConditionRow, SessionRow, SettingRow, SleepRow, TaskRow, XpRow } from '../lib/backup';
import { checkInStreak, formatDate, parseCompanionKind, type CompanionKind } from '../lib/play';

let database: SQLite.SQLiteDatabase | null = null;
let dbInit: Promise<SQLite.SQLiteDatabase> | null = null;

export type ConditionLog = Condition & { id: number; recorded_at: string };
export type PlayPrefs = {
  sound: boolean;
  haptic: boolean;
  reminder: boolean;
  reminderHour: number;
  reminderMinute: number;
};
export type Insight = {
  game_id: string;
  plays: number;
  sleepiness_delta: number;
  fatigue_delta: number;
  mood_delta: number;
  stress_delta: number;
};
export type RecentPlay = {
  game_id: string;
  score: number;
  mood_delta: number;
  fatigue_delta: number;
  ended_at: string;
};
export type SleepLog = { id: number; date: string; minutes: number | null; early_awake: number };
export type DailyCondition = Condition & { id: number; date: string; recorded_at: string };
export type TodayActivity = { checkedIn: boolean; playedGame: boolean; didTask: boolean; streak: number };
export type OpenTask = { id: number; title: string };

async function openDb() {
  const conn = await SQLite.openDatabaseAsync('energy-reset.db');
  await conn.execAsync(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS condition_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, sleepiness INTEGER NOT NULL, fatigue INTEGER NOT NULL, mood INTEGER NOT NULL, stress INTEGER NOT NULL, recorded_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS game_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, game_id TEXT NOT NULL, before_id INTEGER NOT NULL, after_id INTEGER, started_at TEXT NOT NULL, ended_at TEXT, score INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(before_id) REFERENCES condition_logs(id), FOREIGN KEY(after_id) REFERENCES condition_logs(id));
    CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS xp_events (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL UNIQUE, points INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sleep_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE, minutes INTEGER, early_awake INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS daily_conditions (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE, sleepiness INTEGER NOT NULL, fatigue INTEGER NOT NULL, mood INTEGER NOT NULL, stress INTEGER NOT NULL, recorded_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  database = conn;
  return conn;
}

export async function db() {
  if (database) return database;
  if (!dbInit) dbInit = openDb();
  return dbInit;
}

function clockPart(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > max) return fallback;
  return parsed;
}

export async function getSetting(key: string) {
  const conn = await db();
  const row = await conn.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key=?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const conn = await db();
  await conn.runAsync('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, value);
}

export async function getPlayPrefs(): Promise<PlayPrefs> {
  const [sound, haptic, reminder, hour, minute] = await Promise.all([
    getSetting('sound'),
    getSetting('haptic'),
    getSetting('reminder'),
    getSetting('reminderHour'),
    getSetting('reminderMinute'),
  ]);
  return {
    sound: sound !== '0',
    haptic: haptic !== '0',
    reminder: reminder === '1',
    reminderHour: clockPart(hour, 21, 23),
    reminderMinute: clockPart(minute, 0, 59),
  };
}

export async function logCondition(c: Condition) {
  const conn = await db();
  const r = await conn.runAsync('INSERT INTO condition_logs(sleepiness,fatigue,mood,stress,recorded_at) VALUES(?,?,?,?,?)', c.sleepiness, c.fatigue, c.mood, c.stress, new Date().toISOString());
  const id = Number(r.lastInsertRowId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('condition log insert failed');
  return id;
}

export async function startSession(game: GameId, before: Condition, opts?: { beforeLogId?: number }) {
  const conn = await db();
  let beforeId = opts?.beforeLogId;
  if (beforeId == null) beforeId = await logCondition(before);
  beforeId = Number(beforeId);
  if (!Number.isFinite(beforeId) || beforeId <= 0) throw new Error('invalid before condition id');
  const r = await conn.runAsync('INSERT INTO game_sessions(game_id,before_id,started_at,score) VALUES(?,?,?,?)', game, beforeId, new Date().toISOString(), 0);
  const sessionId = Number(r.lastInsertRowId);
  if (!Number.isFinite(sessionId) || sessionId <= 0) throw new Error('game session insert failed');
  return sessionId;
}

export async function endSession(id: number, after: Condition, score: number) {
  const conn = await db();
  const afterId = await logCondition(after);
  await conn.runAsync('UPDATE game_sessions SET after_id=?,ended_at=?,score=? WHERE id=? AND ended_at IS NULL', afterId, new Date().toISOString(), score, id);
  await addXp(`session:${id}`, 15);
  await addXp(`daily-play:${formatDate(new Date())}`, 5);
}

export async function addXp(source: string, points: number) {
  const conn = await db();
  await conn.runAsync('INSERT OR IGNORE INTO xp_events(source,points,created_at) VALUES(?,?,?)', source, points, new Date().toISOString());
}

export async function getXp() {
  const conn = await db();
  const row = await conn.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(points),0) AS total FROM xp_events');
  return row?.total ?? 0;
}

export async function getLatestConditionLog() {
  const conn = await db();
  return conn.getFirstAsync<ConditionLog>('SELECT id,sleepiness,fatigue,mood,stress,recorded_at FROM condition_logs ORDER BY id DESC LIMIT 1');
}

export async function getLatestCondition() {
  const log = await getLatestConditionLog();
  if (!log) return null;
  return { sleepiness: log.sleepiness, fatigue: log.fatigue, mood: log.mood, stress: log.stress };
}

export async function getInsights() {
  const conn = await db();
  return conn.getAllAsync<Insight>(`SELECT s.game_id, COUNT(*) AS plays,
    ROUND(AVG(b.sleepiness - a.sleepiness), 2) AS sleepiness_delta,
    ROUND(AVG(b.fatigue - a.fatigue), 2) AS fatigue_delta,
    ROUND(AVG(a.mood - b.mood), 2) AS mood_delta,
    ROUND(AVG(b.stress - a.stress), 2) AS stress_delta
    FROM game_sessions s
    JOIN condition_logs b ON b.id = s.before_id
    JOIN condition_logs a ON a.id = s.after_id
    GROUP BY s.game_id
    ORDER BY plays DESC`);
}

export async function getRecentPlays() {
  const conn = await db();
  const rows = await conn.getAllAsync<RecentPlay>(`SELECT s.game_id, s.score,
    ROUND(a.mood - b.mood, 2) AS mood_delta,
    ROUND(b.fatigue - a.fatigue, 2) AS fatigue_delta,
    s.ended_at AS ended_at
    FROM game_sessions s
    JOIN condition_logs b ON b.id = s.before_id
    JOIN condition_logs a ON a.id = s.after_id
    WHERE s.ended_at IS NOT NULL
    ORDER BY s.id DESC
    LIMIT 8`);
  return rows.reverse();
}

export async function listOpenTasks() {
  const conn = await db();
  return conn.getAllAsync<OpenTask>('SELECT id, title FROM tasks WHERE done=0 ORDER BY id DESC');
}

export async function completeTaskById(id: number) {
  const conn = await db();
  const row = await conn.getFirstAsync<{ done: number }>('SELECT done FROM tasks WHERE id=?', id);
  if (!row || row.done) return false;
  await conn.runAsync('UPDATE tasks SET done=1 WHERE id=?', id);
  await addXp(`task-done:${id}`, 20);
  return true;
}

export async function completePresetQuest(title: string) {
  const conn = await db();
  const r = await conn.runAsync('INSERT INTO tasks(title, done, created_at) VALUES(?,1,?)', title, new Date().toISOString());
  const id = Number(r.lastInsertRowId);
  if (!Number.isFinite(id) || id <= 0) throw new Error('task insert failed');
  await addXp(`task-done:${id}`, 20);
  return id;
}

export async function saveSleep(entry: { date: string; minutes: number; earlyAwake: boolean }) {
  const conn = await db();
  await conn.runAsync(
    `INSERT INTO sleep_logs(date, minutes, early_awake) VALUES(?,?,?)
     ON CONFLICT(date) DO UPDATE SET minutes=excluded.minutes, early_awake=excluded.early_awake`,
    entry.date,
    entry.minutes,
    entry.earlyAwake ? 1 : 0,
  );
}

export async function getSleep(date: string) {
  const conn = await db();
  return conn.getFirstAsync<SleepLog>('SELECT id, date, minutes, early_awake FROM sleep_logs WHERE date=?', date);
}

export async function saveDailyCondition(entry: { date: string } & Condition) {
  const conn = await db();
  await conn.runAsync(
    `INSERT INTO daily_conditions(date, sleepiness, fatigue, mood, stress, recorded_at) VALUES(?,?,?,?,?,?)
     ON CONFLICT(date) DO UPDATE SET sleepiness=excluded.sleepiness, fatigue=excluded.fatigue, mood=excluded.mood, stress=excluded.stress, recorded_at=excluded.recorded_at`,
    entry.date,
    entry.sleepiness,
    entry.fatigue,
    entry.mood,
    entry.stress,
    new Date().toISOString(),
  );
  await addXp(`daily-checkin:${entry.date}`, 10);
}

export async function getDailyCondition(date: string) {
  const conn = await db();
  return conn.getFirstAsync<DailyCondition>('SELECT id, date, sleepiness, fatigue, mood, stress, recorded_at FROM daily_conditions WHERE date=?', date);
}

export async function getRecentDailyConditions(limit = 14) {
  const conn = await db();
  return conn.getAllAsync<DailyCondition>('SELECT id, date, sleepiness, fatigue, mood, stress, recorded_at FROM daily_conditions ORDER BY date DESC LIMIT ?', limit);
}

export async function getCompanionKind() {
  return parseCompanionKind(await getSetting('companionKind'));
}

export async function setCompanionKind(kind: CompanionKind) {
  await setSetting('companionKind', kind);
}

export async function getTodayActivity(date: string): Promise<TodayActivity> {
  const conn = await db();
  const [daily, game, task, dates] = await Promise.all([
    conn.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM daily_conditions WHERE date=?', date),
    conn.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM game_sessions WHERE date(started_at, \'localtime\')=?', date),
    conn.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM xp_events WHERE source LIKE \'task-done:%\' AND date(created_at, \'localtime\')=?', date),
    conn.getAllAsync<{ date: string }>('SELECT date FROM daily_conditions ORDER BY date DESC LIMIT 60'),
  ]);
  return {
    checkedIn: (daily?.n ?? 0) > 0,
    playedGame: (game?.n ?? 0) > 0,
    didTask: (task?.n ?? 0) > 0,
    streak: checkInStreak(dates.map(row => row.date), date),
  };
}

export async function getRecentSleep() {
  const conn = await db();
  return conn.getAllAsync<SleepLog>('SELECT id, date, minutes, early_awake FROM sleep_logs ORDER BY date DESC LIMIT 7');
}

export async function exportSnapshot(): Promise<BackupPayload> {
  const conn = await db();
  const [condition_logs, game_sessions, tasks, xp_events, sleep_logs, daily_conditions, settings] = await Promise.all([
    conn.getAllAsync<ConditionRow>('SELECT id, sleepiness, fatigue, mood, stress, recorded_at FROM condition_logs ORDER BY id'),
    conn.getAllAsync<SessionRow>('SELECT id, game_id, before_id, after_id, started_at, ended_at, score FROM game_sessions ORDER BY id'),
    conn.getAllAsync<TaskRow>('SELECT id, title, done, created_at FROM tasks ORDER BY id'),
    conn.getAllAsync<XpRow>('SELECT id, source, points, created_at FROM xp_events ORDER BY id'),
    conn.getAllAsync<SleepRow>('SELECT id, date, minutes, early_awake FROM sleep_logs ORDER BY id'),
    conn.getAllAsync<DailyConditionRow>('SELECT id, date, sleepiness, fatigue, mood, stress, recorded_at FROM daily_conditions ORDER BY id'),
    conn.getAllAsync<SettingRow>('SELECT key, value FROM settings ORDER BY key'),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: { condition_logs, game_sessions, tasks, xp_events, sleep_logs, daily_conditions, settings },
  };
}

export async function replaceFromBackup(payload: BackupPayload) {
  const conn = await db();
  const { tables } = payload;
  await conn.withTransactionAsync(async () => {
    await conn.execAsync('DELETE FROM game_sessions; DELETE FROM condition_logs; DELETE FROM tasks; DELETE FROM xp_events; DELETE FROM sleep_logs; DELETE FROM daily_conditions; DELETE FROM settings;');
    for (const row of tables.condition_logs) {
      await conn.runAsync('INSERT INTO condition_logs(id, sleepiness, fatigue, mood, stress, recorded_at) VALUES(?,?,?,?,?,?)', row.id, row.sleepiness, row.fatigue, row.mood, row.stress, row.recorded_at);
    }
    for (const row of tables.game_sessions) {
      await conn.runAsync('INSERT INTO game_sessions(id, game_id, before_id, after_id, started_at, ended_at, score) VALUES(?,?,?,?,?,?,?)', row.id, row.game_id, row.before_id, row.after_id, row.started_at, row.ended_at, row.score);
    }
    for (const row of tables.tasks) {
      await conn.runAsync('INSERT INTO tasks(id, title, done, created_at) VALUES(?,?,?,?)', row.id, row.title, row.done, row.created_at);
    }
    for (const row of tables.xp_events) {
      await conn.runAsync('INSERT INTO xp_events(id, source, points, created_at) VALUES(?,?,?,?)', row.id, row.source, row.points, row.created_at);
    }
    for (const row of tables.sleep_logs) {
      await conn.runAsync('INSERT INTO sleep_logs(id, date, minutes, early_awake) VALUES(?,?,?,?)', row.id, row.date, row.minutes, row.early_awake);
    }
    for (const row of tables.daily_conditions ?? []) {
      await conn.runAsync('INSERT INTO daily_conditions(id, date, sleepiness, fatigue, mood, stress, recorded_at) VALUES(?,?,?,?,?,?,?)', row.id, row.date, row.sleepiness, row.fatigue, row.mood, row.stress, row.recorded_at);
    }
    for (const row of tables.settings) {
      await conn.runAsync('INSERT INTO settings(key, value) VALUES(?,?)', row.key, row.value);
    }
  });
}
