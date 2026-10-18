export const BACKUP_VERSION = 1;
const GAME_IDS = new Set(['breath', 'bubble', 'rhythm', 'quest']);

export type ConditionRow = {
  id: number;
  sleepiness: number;
  fatigue: number;
  mood: number;
  stress: number;
  recorded_at: string;
};
export type SessionRow = {
  id: number;
  game_id: string;
  before_id: number;
  after_id: number | null;
  started_at: string;
  ended_at: string | null;
  score: number;
};
export type TaskRow = { id: number; title: string; done: number; created_at: string };
export type XpRow = { id: number; source: string; points: number; created_at: string };
export type SleepRow = { id: number; date: string; minutes: number | null; early_awake: number };
export type SettingRow = { key: string; value: string };

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  tables: {
    condition_logs: ConditionRow[];
    game_sessions: SessionRow[];
    tasks: TaskRow[];
    xp_events: XpRow[];
    sleep_logs: SleepRow[];
    settings: SettingRow[];
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInt(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function unique(values: number[]) {
  return new Set(values).size === values.length;
}

function rows(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return Array.isArray(value) ? value : null;
}

export function parseBackup(text: string): BackupPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || parsed.version !== BACKUP_VERSION || !isText(parsed.exportedAt) || !isRecord(parsed.tables)) {
    return null;
  }
  const tables = parsed.tables;
  const conditionSource = rows(tables, 'condition_logs');
  const sessionSource = rows(tables, 'game_sessions');
  const taskSource = rows(tables, 'tasks');
  const xpSource = rows(tables, 'xp_events');
  const sleepSource = rows(tables, 'sleep_logs');
  const settingSource = rows(tables, 'settings');
  if (!conditionSource || !sessionSource || !taskSource || !xpSource || !sleepSource || !settingSource) return null;

  const condition_logs: ConditionRow[] = [];
  for (const row of conditionSource) {
    if (!isRecord(row) || !isInt(row.id, 1, 1_000_000_000) || !isInt(row.sleepiness, 0, 10) || !isInt(row.fatigue, 0, 10) || !isInt(row.mood, 0, 10) || !isInt(row.stress, 0, 10) || !isText(row.recorded_at)) return null;
    condition_logs.push({ id: row.id, sleepiness: row.sleepiness, fatigue: row.fatigue, mood: row.mood, stress: row.stress, recorded_at: row.recorded_at });
  }
  if (!unique(condition_logs.map(row => row.id))) return null;
  const conditionIds = new Set(condition_logs.map(row => row.id));

  const game_sessions: SessionRow[] = [];
  for (const row of sessionSource) {
    if (!isRecord(row) || !isInt(row.id, 1, 1_000_000_000) || !isText(row.game_id) || !GAME_IDS.has(row.game_id) || !isInt(row.before_id, 1, 1_000_000_000) || !isText(row.started_at) || !isInt(row.score, 0, 1_000_000)) return null;
    if (!conditionIds.has(row.before_id)) return null;
    const after_id = row.after_id === null ? null : row.after_id;
    if (after_id !== null && !isInt(after_id, 1, 1_000_000_000)) return null;
    if (after_id !== null && !conditionIds.has(after_id)) return null;
    const ended_at = row.ended_at === null ? null : row.ended_at;
    if (ended_at !== null && !isText(ended_at)) return null;
    game_sessions.push({ id: row.id, game_id: row.game_id, before_id: row.before_id, after_id, started_at: row.started_at, ended_at, score: row.score });
  }
  if (!unique(game_sessions.map(row => row.id))) return null;

  const tasks: TaskRow[] = [];
  for (const row of taskSource) {
    if (!isRecord(row) || !isInt(row.id, 1, 1_000_000_000) || !isText(row.title) || (row.done !== 0 && row.done !== 1) || !isText(row.created_at)) return null;
    tasks.push({ id: row.id, title: row.title, done: row.done, created_at: row.created_at });
  }
  if (!unique(tasks.map(row => row.id))) return null;

  const xp_events: XpRow[] = [];
  const sources = new Set<string>();
  for (const row of xpSource) {
    if (!isRecord(row) || !isInt(row.id, 1, 1_000_000_000) || !isText(row.source) || !isInt(row.points, 0, 100_000) || !isText(row.created_at)) return null;
    if (sources.has(row.source)) return null;
    sources.add(row.source);
    xp_events.push({ id: row.id, source: row.source, points: row.points, created_at: row.created_at });
  }
  if (!unique(xp_events.map(row => row.id))) return null;

  const sleep_logs: SleepRow[] = [];
  const dates = new Set<string>();
  for (const row of sleepSource) {
    if (!isRecord(row) || !isInt(row.id, 1, 1_000_000_000) || !isText(row.date) || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || (row.early_awake !== 0 && row.early_awake !== 1)) return null;
    const minutes = row.minutes === null ? null : row.minutes;
    if (minutes !== null && !isInt(minutes, 0, 24 * 60)) return null;
    if (dates.has(row.date)) return null;
    dates.add(row.date);
    sleep_logs.push({ id: row.id, date: row.date, minutes, early_awake: row.early_awake });
  }
  if (!unique(sleep_logs.map(row => row.id))) return null;

  const settings: SettingRow[] = [];
  const keys = new Set<string>();
  for (const row of settingSource) {
    if (!isRecord(row) || !isText(row.key) || typeof row.value !== 'string') return null;
    if (keys.has(row.key)) return null;
    keys.add(row.key);
    settings.push({ key: row.key, value: row.value });
  }

  return {
    version: 1,
    exportedAt: parsed.exportedAt,
    tables: { condition_logs, game_sessions, tasks, xp_events, sleep_logs, settings },
  };
}
