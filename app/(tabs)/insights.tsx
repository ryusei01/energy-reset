import React, { useCallback, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BarChart } from '../../src/components/BarChart';
import { Card, Title, styles } from '../../src/components/UI';
import { getInsights, getRecentPlays, type Insight, type RecentPlay } from '../../src/db/database';
import { GAMES } from '../../src/lib/games';

function signed(value: number) {
  return `${value > 0 ? '+' : ''}${value}`;
}

export default function Insights() {
  const [data, setData] = useState<Insight[]>([]);
  const [recent, setRecent] = useState<RecentPlay[]>([]);
  useFocusEffect(useCallback(() => {
    getInsights().then(setData).catch(console.error);
    getRecentPlays().then(setRecent).catch(console.error);
  }, []));
  return (
    <ScrollView style={styles.screen}>
      <Title>ゲーム別の記録</Title>
      <Text style={[styles.muted, { marginBottom: 14 }]}>数値はプレイ前後の自己評価の差です。治療効果を示すものではありません。</Text>
      {recent.length > 0 && (
        <Card>
          <Text style={styles.label}>直近の気分の変化</Text>
          <BarChart rows={recent.map((row, index) => ({ label: `${GAMES.find(game => game.id === row.game_id)?.name ?? row.game_id} ${index + 1}`, value: row.mood_delta }))} />
        </Card>
      )}
      {data.length === 0 ? <Card><Text style={styles.text}>まだ記録がありません。ゲームを1回遊んでみましょう。</Text></Card> : data.map(row => (
        <Card key={row.game_id}>
          <Text style={styles.label}>{GAMES.find(game => game.id === row.game_id)?.name ?? row.game_id}</Text>
          <Text style={styles.text}>プレイ回数：{row.plays}</Text>
          <BarChart rows={[
            { label: '眠気', value: row.sleepiness_delta },
            { label: 'だるさ', value: row.fatigue_delta },
            { label: '気分', value: row.mood_delta },
            { label: 'ストレス', value: row.stress_delta },
          ]} />
          <Text style={styles.muted}>プラスはプレイ後に自己評価が改善した方向です（眠気 {signed(row.sleepiness_delta)} / 気分 {signed(row.mood_delta)}）</Text>
          {row.plays < 5 && <Text style={styles.muted}>データが少ないため参考値です</Text>}
        </Card>
      ))}
    </ScrollView>
  );
}
