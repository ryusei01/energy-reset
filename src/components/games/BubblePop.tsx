import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { bubbleContains, bubblePoints, bubbleSpawnInterval, bubbleTop, formatClock, GAME_VISUAL, isSpecialBubble } from '../../lib/play';
import { GameFrame, type GamePlayProps } from './GameFrame';

const COLORS = ['rgba(147,197,253,0.95)', 'rgba(196,181,253,0.95)', 'rgba(249,168,212,0.95)', 'rgba(153,246,228,0.95)', 'rgba(253,224,71,0.92)'];

type Bubble = {
  id: number;
  x: number;
  size: number;
  color: string;
  duration: number;
  born: number;
  popped: boolean;
  frozenTop: number | null;
  special: boolean;
};

function BubbleFace({ bubble, top }: { bubble: Bubble; top: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!bubble.popped) return;
    const shrink = Animated.timing(scale, { toValue: 0, duration: 120, useNativeDriver: true });
    shrink.start();
    return () => shrink.stop();
  }, [bubble.popped, scale]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: bubble.x, top, width: bubble.size, height: bubble.size, borderRadius: bubble.size / 2, backgroundColor: bubble.color, transform: [{ scale }] }}>
      <View style={{ marginTop: bubble.size * 0.18, marginLeft: bubble.size * 0.2, width: bubble.size * 0.24, height: bubble.size * 0.14, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.75)' }} />
    </Animated.View>
  );
}

export function BubblePop({ haptic, seconds, score, onScore, onEnd }: GamePlayProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [combo, setCombo] = useState(0);
  const [fieldHeight, setFieldHeight] = useState(420);
  const onScoreRef = useRef(onScore);
  const hapticRef = useRef(haptic);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const lastPop = useRef(0);
  const widthRef = useRef(320);
  const heightRef = useRef(420);
  const bubblesRef = useRef<Bubble[]>([]);
  onScoreRef.current = onScore;
  hapticRef.current = haptic;

  useEffect(() => {
    let frame = 0;
    let alive = true;
    const loop = () => {
      if (!alive) return;
      const time = Date.now();
      const height = heightRef.current;
      const staying = bubblesRef.current.filter(bubble => bubble.popped || bubbleTop(time - bubble.born, bubble.duration, height, bubble.size) + bubble.size > 0);
      if (staying.length !== bubblesRef.current.length) {
        bubblesRef.current = staying;
        setBubbles(staying);
      }
      setNow(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let nextId = 1;
    const start = Date.now();
    const spawn = () => {
      if (!alive) return;
      if (bubblesRef.current.length < 7 && widthRef.current > 0) {
        const size = 64 + Math.floor(Math.random() * 36);
        const span = Math.max(40, widthRef.current - size);
        const special = isSpecialBubble(nextId);
        const bubble: Bubble = {
          id: nextId,
          x: Math.random() * span,
          size: special ? size + 10 : size,
          color: special ? 'rgba(251,191,36,0.96)' : COLORS[nextId % COLORS.length],
          duration: 3400 + Math.floor(Math.random() * 2200),
          born: Date.now(),
          popped: false,
          frozenTop: null,
          special,
        };
        nextId += 1;
        bubblesRef.current = [...bubblesRef.current, bubble];
        setBubbles(bubblesRef.current);
      }
      timer = setTimeout(spawn, bubbleSpawnInterval(Date.now() - start));
    };
    timer = setTimeout(spawn, 280);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  const pop = (id: number) => {
    const bubble = bubblesRef.current.find(item => item.id === id);
    if (!bubble || bubble.popped) return;
    bubble.popped = true;
    bubble.frozenTop = bubbleTop(Date.now() - bubble.born, bubble.duration, heightRef.current, bubble.size);
    const time = Date.now();
    comboRef.current = time - lastPop.current <= 900 ? comboRef.current + 1 : 1;
    lastPop.current = time;
    scoreRef.current += bubblePoints(comboRef.current, bubble.special);
    setCombo(comboRef.current);
    onScoreRef.current(scoreRef.current);
    setBubbles([...bubblesRef.current]);
    if (hapticRef.current) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      bubblesRef.current = bubblesRef.current.filter(item => item.id !== id);
      setBubbles([...bubblesRef.current]);
    }, 130);
  };

  const press = (x: number, y: number) => {
    for (let index = bubblesRef.current.length - 1; index >= 0; index -= 1) {
      const bubble = bubblesRef.current[index];
      if (!bubble || bubble.popped) continue;
      const top = bubbleTop(Date.now() - bubble.born, bubble.duration, heightRef.current, bubble.size);
      if (bubbleContains(x, y, bubble.x, top, bubble.size)) {
        pop(bubble.id);
        return;
      }
    }
  };

  return (
    <GameFrame colors={GAME_VISUAL.bubble.colors} title="バブルポップ" meta={`${formatClock(seconds)}  ${score}点`} onEnd={onEnd}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'rgba(255,255,255,0.86)', fontSize: 16, textAlign: 'center' }}>
          {combo > 1 ? `${combo}連続` : '金色の泡は3倍。上に着く前に割ろう'}
        </Text>
        <View
          accessibilityLabel="泡のフィールド"
          style={{ flex: 1, marginTop: 12, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' }}
          onLayout={event => {
            const { width, height } = event.nativeEvent.layout;
            widthRef.current = width;
            heightRef.current = height;
            setFieldHeight(height);
          }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={event => press(event.nativeEvent.locationX, event.nativeEvent.locationY)}
        >
          {bubbles.map(bubble => (
            <BubbleFace key={bubble.id} bubble={bubble} top={bubble.frozenTop ?? bubbleTop(now - bubble.born, bubble.duration, fieldHeight, bubble.size)} />
          ))}
        </View>
      </View>
    </GameFrame>
  );
}
