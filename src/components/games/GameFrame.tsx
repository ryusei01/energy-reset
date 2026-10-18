import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export function GameFrame({
  colors,
  title,
  meta,
  onEnd,
  endLabel = '終了して記録',
  children,
}: {
  colors: readonly [string, string];
  title: string;
  meta: string;
  onEnd: () => void;
  endLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <LinearGradient colors={colors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 12 }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, marginBottom: 8 }}>
          <Text style={{ color: 'white', fontSize: 22, fontWeight: '800', flex: 1 }}>{title}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 16, fontWeight: '700' }}>{meta}</Text>
        </View>
        <View style={{ flex: 1 }}>{children}</View>
        <Pressable accessibilityRole="button" onPress={onEnd} style={{ minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{endLabel}</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

export type GamePlayProps = {
  sound: boolean;
  haptic: boolean;
  seconds: number;
  score: number;
  onScore: (score: number) => void;
  onEnd: () => void;
};
