export type GameId = 'breath' | 'bubble' | 'rhythm' | 'quest';
export type Condition = { sleepiness: number; fatigue: number; mood: number; stress: number };
export const GAMES: { id: GameId; name: string; description: string; duration: number }[] = [
  { id: 'breath', name: 'ブレスガーデン', description: 'ゆっくり呼吸して庭を育てる', duration: 120 },
  { id: 'bubble', name: 'バブルポップ', description: '泡をタップして気分転換', duration: 120 },
  { id: 'rhythm', name: 'リズムリセット', description: 'リズムに合わせてタップ', duration: 120 },
  { id: 'quest', name: 'スモールクエスト', description: '小さな現実の行動を達成', duration: 120 }
];
export function recommend(c: Condition): GameId | 'rest' {
  if (c.sleepiness >= 8 || c.fatigue >= 8) return 'rest';
  if (c.stress >= 7) return 'breath';
  if (c.mood <= 4) return 'bubble';
  return 'quest';
}
export function delta(before: Condition, after: Condition) {
  return { sleepiness: before.sleepiness - after.sleepiness, fatigue: before.fatigue - after.fatigue, mood: after.mood - before.mood, stress: before.stress - after.stress };
}
export function levelFromXp(xp: number) { return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 100)); }
