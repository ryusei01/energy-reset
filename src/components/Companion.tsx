import React from 'react';
import { Text, View } from 'react-native';
import { companionStage, STAGE_LABEL } from '../lib/play';

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

export function Companion({ level, size = 168, light = false }: { level: number; size?: number; light?: boolean }) {
  const stage = companionStage(level);
  const stem = stage === 'sprout' ? 0.22 : stage === 'bud' ? 0.34 : stage === 'bloom' || stage === 'garden' ? 0.4 : 0;
  const showLeaves = stage === 'sprout' || stage === 'bud' || stage === 'bloom' || stage === 'garden';
  return (
    <View accessibilityLabel={`仲間は${STAGE_LABEL[stage]}、レベル${level}`} style={{ width: size, height: size + 28, alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ position: 'absolute', bottom: size * 0.16, width: size * 0.78, height: size * 0.3, borderRadius: size, backgroundColor: '#D9F5E6' }} />
        {stage === 'garden' && <View style={{ position: 'absolute', bottom: size * 0.3, left: size * 0.12, width: 4, height: size * 0.22, backgroundColor: '#3E9B62', borderRadius: 3 }} />}
        {stage === 'garden' && <View style={{ position: 'absolute', bottom: size * 0.3, right: size * 0.14, width: 4, height: size * 0.18, backgroundColor: '#3E9B62', borderRadius: 3 }} />}
        {stage === 'garden' && <View style={{ position: 'absolute', bottom: size * 0.48, left: size * 0.08, width: 12, height: 12, borderRadius: 6, backgroundColor: '#F2C14E' }} />}
        {stage === 'garden' && <View style={{ position: 'absolute', bottom: size * 0.44, right: size * 0.1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#F4A5C1' }} />}
        {stem > 0 && (
          <View style={{ position: 'absolute', bottom: size * 0.28, width: 6, height: size * stem, backgroundColor: '#3E9B62', borderRadius: 4 }}>
            {showLeaves && <Leaf />}
            {stage !== 'sprout' && <Leaf flip />}
            {stage === 'bud' && <View style={{ position: 'absolute', top: -14, left: -5, width: 16, height: 18, borderRadius: 9, backgroundColor: '#F2C14E' }} />}
            {(stage === 'bloom' || stage === 'garden') && <Flower />}
          </View>
        )}
        {stage === 'seed' && <View style={{ position: 'absolute', bottom: size * 0.3, width: 18, height: 14, borderRadius: 8, backgroundColor: '#C6A15B' }} />}
        <View style={{ width: size * 0.42, height: size * 0.16, backgroundColor: '#6E4428', borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
        <View style={{ width: size * 0.34, height: size * 0.1, backgroundColor: '#8C5A34', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, marginTop: -1 }} />
      </View>
      <Text style={{ marginTop: 6, fontWeight: '700', color: light ? '#FFFFFF' : '#17243B' }}>Lv.{level} {STAGE_LABEL[stage]}</Text>
    </View>
  );
}
