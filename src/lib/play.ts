import type { Condition, GameId } from './games';

export const BREATH_INHALE_MS = 4000;
export const BREATH_EXHALE_MS = 6000;
export const BREATH_CYCLE_MS = BREATH_INHALE_MS + BREATH_EXHALE_MS;

export type BreathPhaseName = 'inhale' | 'exhale';
export type BreathPhase = {
  name: BreathPhaseName;
  progress: number;
  cycle: number;
};

export function breathPhase(elapsedMs: number): BreathPhase {
  const elapsed = Math.max(0, elapsedMs);
  const cycle = Math.floor(elapsed / BREATH_CYCLE_MS);
  const into = elapsed % BREATH_CYCLE_MS;
  if (into < BREATH_INHALE_MS) {
    return { name: 'inhale', progress: into / BREATH_INHALE_MS, cycle };
  }
  return { name: 'exhale', progress: (into - BREATH_INHALE_MS) / BREATH_EXHALE_MS, cycle };
}

export const RHYTHM_BPM = 72;
export const RHYTHM_BEAT_MS = 60000 / RHYTHM_BPM;
export const PERFECT_WINDOW_MS = 80;
export const GOOD_WINDOW_MS = 160;
export const ATTEMPT_WINDOW_MS = 400;

export type Judgment = 'perfect' | 'good' | 'miss';

export function nearestBeat(elapsedMs: number, beatMs = RHYTHM_BEAT_MS) {
  const elapsed = Math.max(0, elapsedMs);
  const index = Math.max(1, Math.round(elapsed / beatMs));
  return { index, deltaMs: elapsed - index * beatMs };
}

export function judgeTap(deltaMs: number): Judgment | null {
  const distance = Math.abs(deltaMs);
  if (distance <= PERFECT_WINDOW_MS) return 'perfect';
  if (distance <= GOOD_WINDOW_MS) return 'good';
  if (distance <= ATTEMPT_WINDOW_MS) return 'miss';
  return null;
}

export function rhythmScore(perfect: number, good: number) {
  return perfect * 3 + good;
}

export function isSpecialBubble(id: number) {
  return id > 0 && id % 8 === 0;
}

export function bubblePoints(combo: number, special = false) {
  const streak = Math.max(1, Math.floor(combo));
  const base = 1 + Math.min(4, streak - 1);
  return special ? base * 3 : base;
}

export function bubbleSpawnInterval(elapsedMs: number) {
  const t = Math.min(1, Math.max(0, elapsedMs) / 90000);
  return Math.round(900 - t * 480);
}

export function bubbleTop(elapsedMs: number, durationMs: number, fieldHeight: number, size: number) {
  const progress = Math.min(1, Math.max(0, elapsedMs) / Math.max(1, durationMs));
  return fieldHeight - progress * (fieldHeight + size);
}

export function bubbleContains(x: number, y: number, bubbleX: number, bubbleY: number, size: number, slop = 14) {
  return x >= bubbleX - slop && x <= bubbleX + size + slop && y >= bubbleY - slop && y <= bubbleY + size + slop;
}

export type CompanionStage = 'seed' | 'sprout' | 'bud' | 'bloom' | 'garden';

export const STAGE_LABEL: Record<CompanionStage, string> = {
  seed: '種',
  sprout: '芽',
  bud: 'つぼみ',
  bloom: '花',
  garden: '庭',
};

export function companionStage(level: number): CompanionStage {
  if (level <= 1) return 'seed';
  if (level === 2) return 'sprout';
  if (level === 3) return 'bud';
  if (level === 4) return 'bloom';
  return 'garden';
}

export type CompanionKind = 'flower' | 'cat' | 'bird' | 'fox';

export const COMPANIONS: readonly { id: CompanionKind; name: string; blurb: string }[] = [
  { id: 'flower', name: '花', blurb: '庭でゆっくり育つ' },
  { id: 'cat', name: 'ねこ', blurb: 'そばでくつろぐ' },
  { id: 'bird', name: 'とり', blurb: 'リズムに合わせて羽ばたく' },
  { id: 'fox', name: 'きつね', blurb: '静かに見守る' },
];

export const COMPANION_STAGES: CompanionStage[] = ['seed', 'sprout', 'bud', 'bloom', 'garden'];

const KIND_STAGE_LABEL: Record<CompanionKind, Record<CompanionStage, string>> = {
  flower: STAGE_LABEL,
  cat: { seed: 'まる', sprout: 'こねこ', bud: 'ねこ', bloom: 'のんびりねこ', garden: 'お庭のねこ' },
  bird: { seed: 'たまご', sprout: 'ひよこ', bud: 'ことり', bloom: 'とり', garden: '巣' },
  fox: { seed: 'けだま', sprout: 'こぎつね', bud: 'きつね', bloom: 'おおきなきつね', garden: 'すみか' },
};

export function isCompanionKind(value: string | null | undefined): value is CompanionKind {
  return value === 'flower' || value === 'cat' || value === 'bird' || value === 'fox';
}

export function parseCompanionKind(value: string | null | undefined): CompanionKind {
  return isCompanionKind(value) ? value : 'flower';
}

export function companionStageLabel(kind: CompanionKind, stage: CompanionStage) {
  return KIND_STAGE_LABEL[kind][stage];
}

export function nextCompanionStage(level: number): CompanionStage | null {
  const stage = companionStage(level);
  if (stage === 'garden') return null;
  return companionStage(level + 1);
}

export function companionHint(kind: CompanionKind, level: number, remainingXp: number) {
  const next = nextCompanionStage(level);
  if (!next) return 'お庭は、休む日もそのまま残ります';
  return `あと ${remainingXp} XP で ${companionStageLabel(kind, next)}`;
}

export function checkInStreak(dates: string[], today: string) {
  const recorded = new Set(dates);
  let cursor = today;
  if (!recorded.has(cursor)) {
    cursor = shiftDate(today, -1);
    if (!recorded.has(cursor)) return 0;
  }
  let streak = 0;
  while (recorded.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

export function companionLine(kind: CompanionKind, condition: Condition | null, streak: number) {
  const name = COMPANIONS.find(item => item.id === kind)?.name ?? '仲間';
  if (!condition) return `${name}は、今日の体調が残るのを待っています`;
  if (streak >= 3) return `${name}と${streak}日続いています。ペースはそのままで大丈夫です`;
  if (condition.sleepiness >= 8 || condition.fatigue >= 8) return `${name}も、今日は静かにそばにいます`;
  if (condition.stress >= 7) return `${name}と、ゆっくり呼吸してみましょう`;
  if (condition.mood <= 4) return `${name}は、小さな遊びからでいいよ、と待っています`;
  return `${name}は、今日の庭を見守っています`;
}

export function sleepMinutes(bedHour: number, bedMinute: number, wakeHour: number, wakeMinute: number) {
  const bed = bedHour * 60 + bedMinute;
  let wake = wakeHour * 60 + wakeMinute;
  if (wake < bed) wake += 24 * 60;
  return wake - bed;
}

export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function formatDuration(minutes: number) {
  const safe = Math.max(0, Math.floor(minutes));
  return `${Math.floor(safe / 60)}時間${safe % 60}分`;
}

export function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatShortDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[2])}/${Number(match[3])}`;
}

export function shiftDate(iso: string, days: number) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export const QUEST_PRESETS = [
  { id: 'water', title: '水を一杯飲む' },
  { id: 'stretch', title: 'その場で伸びをする' },
  { id: 'desk', title: '机の一角を片付ける' },
  { id: 'editor', title: 'エディタを開く' },
] as const;

export const GAME_VISUAL: Record<GameId, { colors: readonly [string, string]; accent: string; cue: string }> = {
  breath: { colors: ['#10281F', '#1F6A4A'], accent: '#9BE7C4', cue: '吸う4秒、吐く6秒' },
  bubble: { colors: ['#10283F', '#2E6F9A'], accent: '#9AD7FF', cue: '浮かぶ泡を割る' },
  rhythm: { colors: ['#1B1433', '#4C3480'], accent: '#D4C4FF', cue: '72 BPMで拍を踏む' },
  quest: { colors: ['#2C2116', '#7A5730'], accent: '#F0C27A', cue: '2分で一つの行動' },
};
