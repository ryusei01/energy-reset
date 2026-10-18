import React from 'react';
import { Text, View } from 'react-native';
import { palette, styles } from './UI';

export function BarChart({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map(row => Math.abs(row.value)));
  return (
    <View style={{ gap: 10 }}>
      {rows.map(row => {
        const width = `${Math.max(6, (Math.abs(row.value) / max) * 100)}%` as const;
        const positive = row.value >= 0;
        return (
          <View key={row.label}>
            <Text style={styles.text}>{row.label}　{positive && row.value !== 0 ? '+' : ''}{row.value}</Text>
            <View style={{ height: 10, borderRadius: 6, backgroundColor: '#E8EDF5', marginTop: 4 }}>
              <View style={{ width, height: 10, borderRadius: 6, backgroundColor: positive ? palette.blue : '#E11D48' }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
