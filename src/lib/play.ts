import type { GameId } from './games';

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

export function bubblePoints(combo: number) {
  const streak = Math.max(1, Math.floor(combo));
  return 1 + Math.min(4, streak - 1);
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
