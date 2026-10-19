import React from 'react';
import { Text, View } from 'react-native';
import { COMPANION_STAGES, companionStage, companionStageLabel, type CompanionKind, type CompanionStage } from '../lib/play';
import { palette, styles } from './UI';

type FigureProps = { stage: CompanionStage; size: number; extras: number };

function Flower() {
  return (
    <View style={{ position: 'absolute', top: -30, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <View key={deg} style={{ position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#F4A5C1', transform: [{ rotate: `${deg}deg` }, { translateY: -11 }] }} />
      ))}
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#F6D365' }} />
    </View>
  );
}

function Leaf({ flip }: { flip?: boolean }) {
  const side = flip ? { right: -16 } : { left: -16 };
  return <View style={{ position: 'absolute', top: flip ? 18 : 8, width: 18, height: 10, borderRadius: 8, backgroundColor: '#67C587', transform: [{ rotate: flip ? '28deg' : '-28deg' }], ...side }} />;
}

function FlowerFigure({ stage, size, extras }: FigureProps) {
  const stem = stage === 'sprout' ? 0.22 : stage === 'bud' ? 0.34 : stage === 'bloom' || stage === 'garden' ? 0.4 : 0;
  const showLeaves = stage === 'sprout' || stage === 'bud' || stage === 'bloom' || stage === 'garden';
  return (
    <>
      {stage === 'garden' && <View style={{ position: 'absolute', bottom: size * 0.3, left: size * 0.12, width: 4, height: size * 0.22, backgroundColor: '#3E9B62', borderRadius: 3 }} />}
      {stage === 'garden' && <View style={{ position: 'absolute', bottom: size * 0.3, right: size * 0.14, width: 4, height: size * 0.18, backgroundColor: '#3E9B62', borderRadius: 3 }} />}
      {extras >= 1 && <View style={{ position: 'absolute', bottom: size * 0.48, left: size * 0.08, width: 12, height: 12, borderRadius: 6, backgroundColor: '#F2C14E' }} />}
      {extras >= 2 && <View style={{ position: 'absolute', bottom: size * 0.44, right: size * 0.1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#F4A5C1' }} />}
      {extras >= 3 && <View style={{ position: 'absolute', bottom: size * 0.52, left: size * 0.22, width: 8, height: 8, borderRadius: 4, backgroundColor: '#93C5FD' }} />}
      {stem > 0 && (
        <View style={{ position: 'absolute', bottom: size * 0.28, width: 6, height: size * stem, backgroundColor: '#3E9B62', borderRadius: 4 }}>
          {showLeaves && <Leaf />}
          {stage !== 'sprout' && <Leaf flip />}
          {stage === 'bud' && <View style={{ position: 'absolute', top: -14, left: -5, width: 16, height: 18, borderRadius: 9, backgroundColor: '#F2C14E' }} />}
          {(stage === 'bloom' || stage === 'garden') && <Flower />}
        </View>
      )}
      {stage === 'seed' && <View style={{ position: 'absolute', bottom: size * 0.3, width: 18, height: 14, borderRadius: 8, backgroundColor: '#C6A15B' }} />}
    </>
  );
}

function Face({ size, awake }: { size: number; awake: boolean }) {
  return (
    <>
      <View style={{ position: 'absolute', top: size * 0.28, left: size * 0.22, width: size * 0.16, height: awake ? size * 0.16 : 3, borderRadius: size, backgroundColor: '#17243B' }} />
      <View style={{ position: 'absolute', top: size * 0.28, right: size * 0.22, width: size * 0.16, height: awake ? size * 0.16 : 3, borderRadius: size, backgroundColor: '#17243B' }} />
    </>
  );
}

function CatFigure({ stage, size }: FigureProps) {
  const body = stage === 'seed' ? 0.28 : stage === 'sprout' ? 0.36 : stage === 'bud' ? 0.42 : 0.48;
  const awake = stage !== 'seed';
  const ear = size * (stage === 'seed' ? 0.12 : 0.16);
  return (
    <View style={{ position: 'absolute', bottom: size * 0.28, width: size * body, height: size * body, alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: -ear * 0.45, left: size * body * 0.08, width: ear, height: ear, backgroundColor: '#E8B86D', borderTopLeftRadius: 4, borderTopRightRadius: 8, transform: [{ rotate: '-18deg' }] }} />
      <View style={{ position: 'absolute', top: -ear * 0.45, right: size * body * 0.08, width: ear, height: ear, backgroundColor: '#E8B86D', borderTopLeftRadius: 8, borderTopRightRadius: 4, transform: [{ rotate: '18deg' }] }} />
      <View style={{ width: size * body, height: size * body * 0.86, borderRadius: size, backgroundColor: '#E8B86D', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', bottom: 0, alignSelf: 'center', width: size * body * 0.55, height: size * body * 0.38, borderRadius: size, backgroundColor: '#F6E6C8' }} />
        <Face size={size * body} awake={awake} />
      </View>
      {(stage === 'bloom' || stage === 'garden') && (
        <View style={{ position: 'absolute', right: -size * 0.16, bottom: size * 0.08, width: size * 0.22, height: size * 0.1, borderRadius: 10, backgroundColor: '#D4944C', transform: [{ rotate: '18deg' }] }} />
      )}
      {stage === 'garden' && <View style={{ position: 'absolute', left: -size * 0.18, bottom: 4, width: size * 0.16, height: size * 0.16, borderRadius: size, backgroundColor: '#F4A5C1' }} />}
    </View>
  );
}

function BirdFigure({ stage, size }: FigureProps) {
  if (stage === 'seed') {
    return <View style={{ position: 'absolute', bottom: size * 0.3, width: size * 0.22, height: size * 0.28, borderRadius: size, backgroundColor: '#F3E0B8', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />;
  }
  const body = stage === 'sprout' ? 0.3 : stage === 'bud' ? 0.36 : 0.4;
  const color = stage === 'sprout' ? '#F6D365' : '#7EB6FF';
  return (
    <View style={{ position: 'absolute', bottom: size * 0.28, width: size * body, height: size * body, alignItems: 'center' }}>
      {(stage === 'bloom' || stage === 'garden') && (
        <>
          <View style={{ position: 'absolute', left: -size * 0.1, top: size * 0.18, width: size * 0.2, height: size * 0.12, borderRadius: 10, backgroundColor: '#4D8FE8', transform: [{ rotate: '-24deg' }] }} />
          <View style={{ position: 'absolute', right: -size * 0.1, top: size * 0.18, width: size * 0.2, height: size * 0.12, borderRadius: 10, backgroundColor: '#4D8FE8', transform: [{ rotate: '24deg' }] }} />
        </>
      )}
      <View style={{ width: size * body, height: size * body * 0.9, borderRadius: size, backgroundColor: color }}>
        <Face size={size * body} awake />
        <View style={{ position: 'absolute', bottom: size * body * 0.22, alignSelf: 'center', width: 10, height: 8, borderRadius: 3, backgroundColor: '#F2C14E' }} />
      </View>
      {stage === 'garden' && <View style={{ position: 'absolute', left: -size * 0.2, bottom: -2, width: size * 0.22, height: size * 0.1, borderRadius: 8, backgroundColor: '#C6A15B' }} />}
    </View>
  );
}

function FoxFigure({ stage, size }: FigureProps) {
  const body = stage === 'seed' ? 0.26 : stage === 'sprout' ? 0.34 : stage === 'bud' ? 0.4 : 0.46;
  const tail = stage === 'seed' || stage === 'sprout' ? 0 : stage === 'bud' ? 0.18 : 0.28;
  return (
    <View style={{ position: 'absolute', bottom: size * 0.28, width: size * body, height: size * body, alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: -size * 0.06, left: size * body * 0.06, width: size * 0.12, height: size * 0.16, backgroundColor: '#E07A3D', borderTopLeftRadius: 4, borderTopRightRadius: 10, transform: [{ rotate: '-16deg' }] }} />
      <View style={{ position: 'absolute', top: -size * 0.06, right: size * body * 0.06, width: size * 0.12, height: size * 0.16, backgroundColor: '#E07A3D', borderTopLeftRadius: 10, borderTopRightRadius: 4, transform: [{ rotate: '16deg' }] }} />
      {tail > 0 && <View style={{ position: 'absolute', right: -size * tail * 0.7, bottom: size * 0.04, width: size * tail, height: size * 0.14, borderRadius: 12, backgroundColor: '#E07A3D' }} />}
      {tail > 0 && <View style={{ position: 'absolute', right: -size * tail * 0.85, bottom: size * 0.06, width: size * 0.08, height: size * 0.08, borderRadius: 8, backgroundColor: '#F6E6C8' }} />}
      <View style={{ width: size * body, height: size * body * 0.88, borderRadius: size, backgroundColor: '#E07A3D', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', bottom: 0, alignSelf: 'center', width: size * body * 0.5, height: size * body * 0.36, borderRadius: size, backgroundColor: '#F6E6C8' }} />
        <Face size={size * body} awake={stage !== 'seed'} />
      </View>
      {stage === 'garden' && <View style={{ position: 'absolute', left: -size * 0.22, bottom: 0, width: size * 0.2, height: size * 0.14, borderRadius: 8, backgroundColor: '#8C5A34' }} />}
    </View>
  );
}

function Figure({ kind, stage, size, extras }: FigureProps & { kind: CompanionKind }) {
  if (kind === 'cat') return <CatFigure stage={stage} size={size} extras={extras} />;
  if (kind === 'bird') return <BirdFigure stage={stage} size={size} extras={extras} />;
  if (kind === 'fox') return <FoxFigure stage={stage} size={size} extras={extras} />;
  return <FlowerFigure stage={stage} size={size} extras={extras} />;
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
  const stage = companionStage(level);
  const extras = stage === 'garden' ? Math.min(3, Math.max(1, level - 4)) : 0;
  const grow = 0.88 + Math.min(1, Math.max(0, progress)) * 0.14;
  const label = companionStageLabel(kind, stage);
  return (
    <View accessibilityLabel={`仲間は${label}、レベル${level}`} style={{ width: size, height: size + (showLabel ? 28 : 0), alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ position: 'absolute', bottom: size * 0.16, width: size * 0.78, height: size * 0.3, borderRadius: size, backgroundColor: light ? 'rgba(255,255,255,0.16)' : '#D9F5E6' }} />
        <View style={{ transform: [{ scale: grow }] }}>
          <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Figure kind={kind} stage={stage} size={size} extras={extras} />
            <View style={{ width: size * 0.42, height: size * 0.16, backgroundColor: '#6E4428', borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
            <View style={{ width: size * 0.34, height: size * 0.1, backgroundColor: '#8C5A34', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -1 }} />
          </View>
        </View>
      </View>
      {showLabel && <Text style={{ marginTop: 6, fontWeight: '700', color: light ? '#FFFFFF' : '#17243B' }}>Lv.{level} {label}</Text>}
    </View>
  );
}

export function GrowthTrack({ kind, level, light = false }: { kind: CompanionKind; level: number; light?: boolean }) {
  const current = companionStage(level);
  const reached = COMPANION_STAGES.indexOf(current);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
      {COMPANION_STAGES.map((stage, index) => {
        const done = index <= reached;
        return (
          <View key={stage} style={{ flex: 1, alignItems: 'center', gap: 6, opacity: done ? 1 : 0.38 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: done ? palette.blue : '#D5DCE8' }} />
            <Text style={[styles.muted, { fontSize: 11, textAlign: 'center', color: light ? 'rgba(255,255,255,0.8)' : palette.muted }]}>{companionStageLabel(kind, stage)}</Text>
          </View>
        );
      })}
    </View>
  );
}

