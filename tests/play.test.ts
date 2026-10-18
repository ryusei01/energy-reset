import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBackup } from '../src/lib/backup.ts';
import {
  breathPhase,
  bubbleContains,
  bubblePoints,
  bubbleSpawnInterval,
  bubbleTop,
  companionStage,
  judgeTap,
  nearestBeat,
  RHYTHM_BEAT_MS,
  rhythmScore,
  shiftDate,
  sleepMinutes,
} from '../src/lib/play.ts';
import { sineWav } from '../src/lib/tones.ts';

test('breath alternates inhale and exhale without a hold', () => {
  assert.equal(breathPhase(0).name, 'inhale');
  assert.equal(breathPhase(3999).name, 'inhale');
  assert.equal(breathPhase(4000).name, 'exhale');
  assert.equal(breathPhase(9999).cycle, 0);
  assert.equal(breathPhase(10000).cycle, 1);
  assert.equal(breathPhase(10000).name, 'inhale');
});

test('rhythm judges the nearest beat and ignores taps far from it', () => {
  const onBeat = nearestBeat(RHYTHM_BEAT_MS);
  assert.equal(onBeat.index, 1);
  assert.ok(Math.abs(onBeat.deltaMs) < 0.001);
  assert.equal(judgeTap(0), 'perfect');
  assert.equal(judgeTap(80), 'perfect');
  assert.equal(judgeTap(81), 'good');
  assert.equal(judgeTap(-160), 'good');
  assert.equal(judgeTap(161), 'miss');
  assert.equal(judgeTap(400), 'miss');
  assert.equal(judgeTap(401), null);
  assert.equal(rhythmScore(2, 3), 9);
});

test('bubble combo and spawn pace stay bounded', () => {
  assert.equal(bubblePoints(1), 1);
  assert.equal(bubblePoints(3), 3);
  assert.equal(bubblePoints(9), 5);
  assert.equal(bubbleSpawnInterval(0), 900);
  assert.equal(bubbleSpawnInterval(90000), 420);
  assert.equal(bubbleSpawnInterval(200000), 420);
  assert.equal(bubbleTop(0, 1000, 400, 50), 400);
  assert.equal(bubbleTop(1000, 1000, 400, 50), -50);
  assert.equal(bubbleContains(10, 10, 0, 0, 40), true);
  assert.equal(bubbleContains(80, 10, 0, 0, 40), false);
});

test('companion stages follow level', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 8].map(companionStage), ['seed', 'sprout', 'bud', 'bloom', 'garden', 'garden']);
});

test('sleep minutes cross midnight and reject a zero-length night', () => {
  assert.equal(sleepMinutes(23, 0, 7, 0), 480);
  assert.equal(sleepMinutes(7, 0, 7, 0), 0);
  assert.equal(shiftDate('2026-10-31', 1), '2026-11-01');
});

test('backup parser accepts a complete file and rejects a broken one', () => {
  const payload = {
    version: 1,
    exportedAt: '2026-10-18T00:00:00.000Z',
    tables: {
      condition_logs: [{ id: 1, sleepiness: 4, fatigue: 5, mood: 6, stress: 3, recorded_at: '2026-10-18T00:00:00.000Z' }],
      game_sessions: [{ id: 1, game_id: 'breath', before_id: 1, after_id: 1, started_at: '2026-10-18T00:00:00.000Z', ended_at: '2026-10-18T00:02:00.000Z', score: 4 }],
      tasks: [{ id: 1, title: '水を一杯飲む', done: 1, created_at: '2026-10-18T00:00:00.000Z' }],
      xp_events: [{ id: 1, source: 'session:1', points: 15, created_at: '2026-10-18T00:00:00.000Z' }],
      sleep_logs: [{ id: 1, date: '2026-10-18', minutes: 420, early_awake: 0 }],
      settings: [{ key: 'sound', value: '1' }],
    },
  };
  assert.equal(parseBackup(JSON.stringify(payload))?.tables.tasks[0]?.title, '水を一杯飲む');
  assert.equal(parseBackup('not json'), null);
  assert.equal(parseBackup(JSON.stringify({ ...payload, tables: { ...payload.tables, game_sessions: [{ ...payload.tables.game_sessions[0], before_id: 9 }] } })), null);
});

test('generated tones are wav files', () => {
  const wav = sineWav(440, 50);
  assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF');
  assert.ok(wav.length > 44);
});
