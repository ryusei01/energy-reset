import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { formatClock, GAME_VISUAL, judgeTap, nearestBeat, RHYTHM_BEAT_MS, rhythmScore, type Judgment } from '../../lib/play';
import { playTone } from '../../lib/audio';
import { useReduceMotion } from '../useReduceMotion';
import { GameFrame, type GamePlayProps } from './GameFrame';

const LABEL: Record<Judgment, string> = { perfect: 'ぴったり', good: 'よい', miss: 'はずれた' };

export function RhythmReset({ sound, haptic, seconds, score, onScore, onEnd }: GamePlayProps) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1.4)).current;
  const startRef = useRef(Date.now());
  const onScoreRef = useRef(onScore);
  const soundRef = useRef(sound);
  const hapticRef = useRef(haptic);
  const reduceRef = useRef(reduceMotion);
  const judged = useRef(new Set<number>());
  const [counts, setCounts] = useState({ perfect: 0, good: 0, miss: 0 });
  const [judgment, setJudgment] = useState<Judgment | null>(null);
  const [beat, setBeat] = useState(1);
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  onScoreRef.current = onScore;
  soundRef.current = sound;
  hapticRef.current = haptic;
  reduceRef.current = reduceMotion;

  useEffect(() => {
    const start = Date.now();
    startRef.current = start;
    let nextBeat = 1;
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    const arm = () => {
      const target = start + nextBeat * RHYTHM_BEAT_MS;
      timer = setTimeout(() => {
        if (soundRef.current) void playTone('click');
        setBeat(nextBeat);
        nextBeat += 1;
        arm();
      }, Math.max(0, target - Date.now()));
    };
    const loop = () => {
      const elapsed = Date.now() - start;
      const progress = (elapsed % RHYTHM_BEAT_MS) / RHYTHM_BEAT_MS;
      scale.setValue(reduceRef.current ? 1 : 1.55 - progress * 0.55);
      frame = requestAnimationFrame(loop);
    };
    arm();
    frame = requestAnimationFrame(loop);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [scale]);

  const tap = () => {
    const { index, deltaMs } = nearestBeat(Date.now() - startRef.current);
    const result = judgeTap(deltaMs);
    if (!result || judged.current.has(index)) return;
    judged.current.add(index);
    comboRef.current = result === 'miss' ? 0 : comboRef.current + 1;
    setCombo(comboRef.current);
    setCounts(current => {
      const next = { ...current, [result]: current[result] + 1 };
      onScoreRef.current(rhythmScore(next.perfect, next.good) + Math.max(0, comboRef.current - 1));
      return next;
    });
    setJudgment(result);
    if (!hapticRef.current || result === 'miss') return;
    if (result === 'perfect') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <GameFrame colors={GAME_VISUAL.rhythm.colors} title="リズムリセット" meta={`${formatClock(seconds)}  ${score}点`} onEnd={onEnd}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 18 }}>リングが真ん中に重なったらタップ　拍 {beat}{combo > 1 ? `　${combo}連続` : ''}</Text>
        <View style={{ width: 230, height: 230, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View pointerEvents="none" style={{ position: 'absolute', width: 150, height: 150, left: 40, top: 40, borderRadius: 75, borderWidth: 4, borderColor: 'rgba(212,196,255,0.95)', transform: [{ scale }] }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="拍に合わせてタップ"
            onPress={tap}
            style={{ width: 148, height: 148, borderRadius: 74, backgroundColor: judgment === 'perfect' ? '#C4B5FD' : judgment === 'good' ? '#A78BFA' : '#6D5BD0', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>{judgment ? LABEL[judgment] : 'タップ'}</Text>
          </Pressable>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 22, fontSize: 14 }}>ぴったり {counts.perfect}　よい {counts.good}　はずれ {counts.miss}</Text>
      </View>
    </GameFrame>
  );
}
