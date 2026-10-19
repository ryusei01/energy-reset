import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { breathPhase, formatClock, GAME_VISUAL, type BreathPhase } from '../../lib/play';
import { playTone } from '../../lib/audio';
import { useReduceMotion } from '../useReduceMotion';
import { GameFrame, type GamePlayProps } from './GameFrame';

function MiniPlant({ index }: { index: number }) {
  const height = 16 + (index % 3) * 8;
  return (
    <View style={{ alignItems: 'center', width: 24 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: index % 2 === 0 ? '#F4D35E' : '#F4A5C1', marginBottom: -2 }} />
      <View style={{ width: 3, height, borderRadius: 2, backgroundColor: '#8FE3B0' }} />
    </View>
  );
}

export function BreathGarden({ sound, haptic, seconds, score, onScore, onEnd }: GamePlayProps) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(0.75)).current;
  const [phase, setPhase] = useState<BreathPhase>(breathPhase(0));
  const onScoreRef = useRef(onScore);
  const soundRef = useRef(sound);
  const hapticRef = useRef(haptic);
  const reduceRef = useRef(reduceMotion);
  onScoreRef.current = onScore;
  soundRef.current = sound;
  hapticRef.current = haptic;
  reduceRef.current = reduceMotion;

  useEffect(() => {
    let frame = 0;
    let alive = true;
    const start = Date.now();
    let previousName: BreathPhase['name'] | null = null;
    let previousCycle = 0;
    const loop = () => {
      const next = breathPhase(Date.now() - start);
      const grown = next.name === 'inhale' ? 0.72 + next.progress * 0.5 : 1.22 - next.progress * 0.5;
      scale.setValue(reduceRef.current ? (next.name === 'inhale' ? 1.02 : 0.86) : grown);
      if (previousName && previousName !== next.name) {
        if (soundRef.current) void playTone(next.name);
        if (hapticRef.current) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (next.cycle !== previousCycle) onScoreRef.current(next.cycle);
      if (alive && (previousName !== next.name || previousCycle !== next.cycle)) setPhase(next);
      previousName = next.name;
      previousCycle = next.cycle;
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, [scale]);

  const plants = Math.min(phase.cycle, 10);
  return (
    <GameFrame colors={GAME_VISUAL.breath.colors} title="ブレスガーデン" meta={`${formatClock(seconds)}  周回 ${score}`} onEnd={onEnd}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ width: 230, height: 230, borderRadius: 115, transform: [{ scale }], overflow: 'hidden' }}>
          <LinearGradient colors={['#E7FFF2', '#3EBE7A']} style={{ flex: 1 }} />
          <View pointerEvents="none" style={{ position: 'absolute', top: 36, left: 48, width: 70, height: 28, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.35)' }} />
        </Animated.View>
        <Text style={{ color: 'white', fontSize: 36, fontWeight: '800', marginTop: 28 }}>{phase.name === 'inhale' ? '吸う' : '吐く'}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 8 }}>{phase.name === 'inhale' ? '約4秒' : '約6秒'}　苦しくない速さで</Text>
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 6 }}>息を止める必要はありません</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 10 }}>{plants === 0 ? '呼吸のたびに庭が増えます' : `庭が ${plants} 本育ちました`}</Text>
      </View>
      <View style={{ minHeight: 72, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6 }}>
        {Array.from({ length: plants }, (_, index) => <MiniPlant key={index} index={index} />)}
      </View>
    </GameFrame>
  );
}
