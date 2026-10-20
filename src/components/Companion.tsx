import React from 'react';
import { Text, View } from 'react-native';
import { COMPANION_STAGES, companionStageLabel, growthLabel, growthPose, type CompanionKind, type CompanionStage } from '../lib/play';
import { palette, styles } from './UI';

const INK = '#17243B';
const LEAF = '#2F9E62';
const PINK = '#F07098';
const GOLD = '#F2C14E';
const POT = '#C46A3A';
const POT_DARK = '#8C4524';
const SOIL = '#6B4A2B';
const CAT = '#F0B15A';
const CREAM = '#FFF3D8';
const BIRD = '#5BA4F0';
const FOX = '#E36B32';

function Box({ size, x, y, w, h, color, radius = 999, rotate = 0 }: { size: number; x: number; y: number; w: number; h: number; color: string; radius?: number; rotate?: number }) {
  return (
    <View style={{ position: 'absolute', left: size * x, bottom: size * y, width: size * w, height: size * h, borderRadius: radius, backgroundColor: color, transform: rotate ? [{ rotate: `${rotate}deg` }] : undefined }} />
  );
}

function Pot({ size }: { size: number }) {
  return (
    <>
      <Box size={size} x={0.12} y={0.04} w={0.76} h={0.18} color="#D7F3E4" radius={size} />
      <Box size={size} x={0.3} y={0.08} w={0.4} h={0.2} color={POT} radius={10} />
      <Box size={size} x={0.24} y={0.24} w={0.52} h={0.07} color={POT_DARK} radius={6} />
      <Box size={size} x={0.32} y={0.27} w={0.36} h={0.045} color={SOIL} radius={4} />
    </>
  );
}

function Eyes({ size, y, gap, awake }: { size: number; y: number; gap: number; awake: boolean }) {
  const eye = size * 0.055;
  return (
    <>
      <View style={{ position: 'absolute', bottom: y, left: size * 0.5 - gap - eye, width: eye, height: awake ? eye : Math.max(3, eye * 0.22), borderRadius: eye, backgroundColor: INK }} />
      <View style={{ position: 'absolute', bottom: y, left: size * 0.5 + gap, width: eye, height: awake ? eye : Math.max(3, eye * 0.22), borderRadius: eye, backgroundColor: INK }} />
    </>
  );
}

function FlowerArt({ size, stage, sub }: { size: number; stage: CompanionStage; sub: 0 | 1 | 2 }) {
  const stem = stage === 'seed' ? (sub === 2 ? 0.12 : 0) : stage === 'sprout' ? 0.18 + sub * 0.04 : stage === 'bud' ? 0.32 : 0.4;
  const leaves = stage === 'sprout' ? sub : stage === 'seed' ? 0 : 2;
  const bud = stage === 'bud' || (stage === 'bloom' && sub === 2) || stage === 'garden';
  const flower = stage === 'bloom' || stage === 'garden';
  const second = (stage === 'bloom' && sub === 2) || stage === 'garden';
  const gardenExtra = stage === 'garden' ? sub : 0;
  return (
    <>
      {stage === 'seed' && <Box size={size} x={0.42} y={0.3} w={0.16} h={0.11} color="#C6A15B" radius={size} />}
      {stage === 'seed' && sub >= 1 && <Box size={size} x={0.47} y={0.34} w={0.015} h={0.06} color="#FFF6E8" radius={2} />}
      {stem > 0 && <Box size={size} x={0.485} y={0.3} w={0.03} h={stem} color={LEAF} radius={4} />}
      {leaves >= 1 && <Box size={size} x={0.3} y={0.36} w={0.16} h={0.08} color={LEAF} radius={size} rotate={-24} />}
      {leaves >= 2 && <Box size={size} x={0.54} y={0.38} w={0.16} h={0.08} color={LEAF} radius={size} rotate={24} />}
      {bud && !flower && <Box size={size} x={0.44} y={0.3 + stem} w={0.12 + sub * 0.03} h={0.12 + sub * 0.03} color={sub === 2 ? PINK : GOLD} radius={size} />}
      {flower && <Box size={size} x={0.4} y={0.62} w={0.2} h={0.2} color={PINK} radius={size} />}
      {flower && <Box size={size} x={0.455} y={0.675} w={0.09} h={0.09} color={GOLD} radius={size} />}
      {second && <Box size={size} x={0.62} y={0.5} w={0.1} h={0.1} color={PINK} radius={size} />}
      {gardenExtra >= 1 && <Box size={size} x={0.22} y={0.48} w={0.1} h={0.1} color="#F4A5C1" radius={size} />}
      {gardenExtra >= 2 && <Box size={size} x={0.16} y={0.32} w={0.08} h={0.14} color={LEAF} radius={4} />}
    </>
  );
}

function CatArt({ size, stage, sub }: { size: number; stage: CompanionStage; sub: 0 | 1 | 2 }) {
  const body = stage === 'seed' ? 0.28 + sub * 0.04 : stage === 'sprout' ? 0.38 : stage === 'bud' ? 0.44 : 0.5;
  const ears = stage !== 'seed' || sub === 2;
  const awake = !(stage === 'seed' && sub === 0);
  const tail = stage === 'sprout' ? sub >= 1 : stage !== 'seed';
  const whiskers = stage === 'bud' && sub >= 1 || stage === 'bloom' || stage === 'garden';
  const bow = (stage === 'bloom' && sub >= 1) || stage === 'garden';
  const longTail = (stage === 'bloom' && sub === 2) || stage === 'garden';
  return (
    <>
      {tail && <Box size={size} x={0.62} y={0.34} w={longTail ? 0.24 : 0.14} h={0.08} color={CAT} radius={size} rotate={18} />}
      {ears && <Box size={size} x={0.5 - body / 2} y={0.3 + body * 0.72} w={0.1} h={0.1} color={CAT} radius={3} rotate={-18} />}
      {ears && <Box size={size} x={0.5 + body / 2 - 0.1} y={0.3 + body * 0.72} w={0.1} h={0.1} color={CAT} radius={3} rotate={18} />}
      <Box size={size} x={0.5 - body / 2} y={0.3} w={body} h={body * 0.86} color={CAT} radius={size} />
      <Box size={size} x={0.5 - body * 0.28} y={0.3} w={body * 0.56} h={body * 0.32} color={CREAM} radius={size} />
      <Eyes size={size} y={size * (0.3 + body * 0.42)} gap={size * body * 0.16} awake={awake} />
      {whiskers && <Box size={size} x={0.5 - body / 2 - 0.08} y={0.3 + body * 0.28} w={0.1} h={0.012} color={INK} radius={2} />}
      {whiskers && <Box size={size} x={0.5 + body / 2 - 0.02} y={0.3 + body * 0.28} w={0.1} h={0.012} color={INK} radius={2} />}
      {bow && <Box size={size} x={0.46} y={0.3 + body * 0.7} w={0.08} h={0.06} color={PINK} radius={3} />}
      {stage === 'garden' && sub >= 1 && <Box size={size} x={0.16} y={0.32} w={0.1} h={0.1} color="#7EB6FF" radius={size} />}
      {stage === 'garden' && <Box size={size} x={0.18} y={0.46} w={0.08} h={0.08} color={PINK} radius={size} />}
    </>
  );
}

function BirdArt({ size, stage, sub }: { size: number; stage: CompanionStage; sub: 0 | 1 | 2 }) {
  if (stage === 'seed') {
    return (
      <>
        <Box size={size} x={0.4} y={0.3} w={0.2} h={0.26} color="#F3E0B8" radius={size * 0.4} />
        {sub >= 1 && <Box size={size} x={0.48} y={0.4} w={0.016} h={0.1} color="#FFF6E8" radius={2} />}
        {sub === 2 && <Box size={size} x={0.46} y={0.52} w={0.08} h={0.05} color={GOLD} radius={4} />}
      </>
    );
  }
  const body = stage === 'sprout' ? 0.3 : stage === 'bud' ? 0.36 : 0.42;
  const wings = stage === 'bud' && sub >= 1 || stage === 'bloom' || stage === 'garden';
  const wide = (stage === 'bloom' && sub >= 1) || stage === 'garden';
  const beak = stage !== 'sprout' || sub === 2;
  return (
    <>
      {wings && <Box size={size} x={0.5 - body / 2 - (wide ? 0.16 : 0.1)} y={0.42} w={wide ? 0.18 : 0.12} h={0.08} color="#3D86D6" radius={size} rotate={-20} />}
      {wings && <Box size={size} x={0.5 + body / 2 - 0.02} y={0.42} w={wide ? 0.18 : 0.12} h={0.08} color="#3D86D6" radius={size} rotate={20} />}
      <Box size={size} x={0.5 - body / 2} y={0.3} w={body} h={body} color={stage === 'sprout' ? GOLD : BIRD} radius={size} />
      <Eyes size={size} y={size * (0.3 + body * 0.48)} gap={size * 0.05} awake />
      {beak && <Box size={size} x={0.5 - 0.03} y={0.3 + body * 0.28} w={0.06} h={0.045} color={GOLD} radius={3} />}
      {stage === 'sprout' && sub >= 1 && <Box size={size} x={0.5 + body / 2 - 0.02} y={0.46} w={0.1} h={0.06} color="#E7B84A" radius={size} />}
      {stage === 'garden' && <Box size={size} x={0.18} y={0.3} w={0.22} h={0.1} color="#C6A15B" radius={8} />}
      {stage === 'garden' && sub >= 1 && <Box size={size} x={0.22} y={0.36} w={0.06} h={0.08} color="#F3E0B8" radius={size} />}
      {stage === 'garden' && sub === 2 && <Box size={size} x={0.3} y={0.36} w={0.05} h={0.07} color="#F3E0B8" radius={size} />}
    </>
  );
}

function FoxArt({ size, stage, sub }: { size: number; stage: CompanionStage; sub: 0 | 1 | 2 }) {
  const body = stage === 'seed' ? 0.26 + sub * 0.03 : stage === 'sprout' ? 0.36 : stage === 'bud' ? 0.42 : 0.48;
  const ears = stage !== 'seed' || sub >= 1;
  const awake = !(stage === 'seed' && sub < 2);
  const tail = stage !== 'seed' && !(stage === 'sprout' && sub === 0);
  const longTail = (stage === 'bloom' && sub >= 1) || stage === 'garden';
  const mane = (stage === 'bloom' && sub === 2) || stage === 'garden';
  return (
    <>
      {tail && <Box size={size} x={0.64} y={0.36} w={longTail ? 0.22 : 0.14} h={0.09} color={FOX} radius={size} />}
      {tail && <Box size={size} x={longTail ? 0.82 : 0.74} y={0.39} w={0.06} h={0.06} color={CREAM} radius={size} />}
      {ears && <Box size={size} x={0.5 - body / 2} y={0.3 + body * 0.7} w={0.1} h={0.14} color={FOX} radius={4} rotate={-12} />}
      {ears && <Box size={size} x={0.5 + body / 2 - 0.1} y={0.3 + body * 0.7} w={0.1} h={0.14} color={FOX} radius={4} rotate={12} />}
      {mane && <Box size={size} x={0.5 - body * 0.2} y={0.3 + body * 0.55} w={body * 0.4} h={0.08} color="#F6E6C8" radius={size} />}
      <Box size={size} x={0.5 - body / 2} y={0.3} w={body} h={body * 0.86} color={FOX} radius={size} />
      <Box size={size} x={0.5 - body * 0.26} y={0.3} w={body * 0.52} h={body * 0.3} color={CREAM} radius={size} />
      <Eyes size={size} y={size * (0.3 + body * 0.4)} gap={size * body * 0.14} awake={awake} />
      {stage === 'garden' && <Box size={size} x={0.16} y={0.32} w={0.16} h={0.1} color="#8C5A34" radius={6} />}
      {stage === 'garden' && sub >= 1 && <Box size={size} x={0.18} y={0.44} w={0.07} h={0.07} color={PINK} radius={size} />}
    </>
  );
}

function Figure({ kind, stage, sub, size }: { kind: CompanionKind; stage: CompanionStage; sub: 0 | 1 | 2; size: number }) {
  if (kind === 'cat') return <CatArt size={size} stage={stage} sub={sub} />;
  if (kind === 'bird') return <BirdArt size={size} stage={stage} sub={sub} />;
  if (kind === 'fox') return <FoxArt size={size} stage={stage} sub={sub} />;
  return <FlowerArt size={size} stage={stage} sub={sub} />;
}

export function Companion({
  level,
  kind = 'flower',
  size = 168,
  light = false,
  progress = 0,
  showLabel = true,
}: {
  level: number;
  kind?: CompanionKind;
  size?: number;
  light?: boolean;
  progress?: number;
  showLabel?: boolean;
}) {
  const pose = growthPose(level, progress);
  const label = growthLabel(kind, level, progress);
  return (
    <View accessibilityLabel={`仲間は${label}、レベル${level}`} style={{ width: size, height: size + (showLabel ? 28 : 0), alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Figure kind={kind} stage={pose.stage} sub={pose.sub} size={size} />
        <Pot size={size} />
      </View>
      {showLabel && <Text style={{ marginTop: 6, fontWeight: '700', color: light ? '#FFFFFF' : INK }}>{label}</Text>}
    </View>
  );
}

export function GrowthTrack({ kind, level, ratio = 0, light = false }: { kind: CompanionKind; level: number; ratio?: number; light?: boolean }) {
  const pose = growthPose(level, ratio);
  const stageIndex = COMPANION_STAGES.indexOf(pose.stage);
  const sub = pose.sub;
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
      {COMPANION_STAGES.map((item, index) => (
        <View key={item} style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {[0, 1, 2].map(part => {
              const filled = index < stageIndex || (index === stageIndex && part <= sub);
              return <View key={part} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: filled ? palette.blue : light ? 'rgba(255,255,255,0.35)' : '#D5DCE8' }} />;
            })}
          </View>
          <Text style={[styles.muted, { fontSize: 10, textAlign: 'center', color: light ? 'rgba(255,255,255,0.8)' : palette.muted }]}>{companionStageLabel(kind, item)}</Text>
        </View>
      ))}
    </View>
  );
}
