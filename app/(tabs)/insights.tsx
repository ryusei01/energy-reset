import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BarChart } from '../../src/components/BarChart';
import { Companion, GrowthTrack } from '../../src/components/Companion';
import { Card, ProgressBar, Title, styles } from '../../src/components/UI';
import { getCompanionKind, getInsights, getRecentDailyConditions, getRecentPlays, getXp, type DailyCondition, type Insight, type RecentPlay } from '../../src/db/database';
import { GAMES, xpProgress } from '../../src/lib/games';
import { companionHint, companionStage, companionStageLabel, formatShortDate, type CompanionKind } from '../../src/lib/play';

function signed(value: number) {
  return `${value > 0 ? '+' : ''}${value}`;
}

export default function Insights() {
  const [data, setData] = useState<Insight[]>([]);
  const [recent, setRecent] = useState<RecentPlay[]>([]);
  const [daily, setDaily] = useState<DailyCondition[]>([]);
  const [xp, setXp] = useState(0);
  const [kind, setKind] = useState<CompanionKind>('flower');
  useFocusEffect(useCallback(() => {
    getInsights().then(setData).catch(console.error);
    getRecentPlays().then(setRecent).catch(console.error);
    getRecentDailyConditions(7).then(setDaily).catch(console.error);
    getXp().then(setXp).catch(console.error);
    getCompanionKind().then(setKind).catch(console.error);
  }, []));
  const growth = xpProgress(xp);
  const dayRows = [...daily].reverse();
  return (
    <ScrollView style={styles.screen}>
      <Title>記録と成長</Title>
      <Text style={[styles.muted, { marginBottom: 14 }]}>数値は自己評価です。治療効果を示すものではありません。</Text>
      <Card>
        <Text style={styles.label}>仲間の成長</Text>
        <View style={{ alignItems: 'center' }}>
          <Companion kind={kind} level={growth.level} progress={growth.ratio} size={132} />
        </View>
        <GrowthTrack kind={kind} level={growth.level} />
        <ProgressBar value={growth.into} max={growth.need} label={`Lv.${growth.level} ${companionStageLabel(kind, companionStage(growth.level))}　累計 ${growth.xp} XP`} />
        <Text style={styles.text}>{companionHint(kind, growth.level, growth.remaining)}</Text>
        <Text style={styles.muted}>同じ段階のあいだも、ゲージと大きさで伸びが見えます。</Text>
      </Card>
      {dayRows.length > 0 && (
        <Card>
          <Text style={styles.label}>日ごとの気分</Text>
          <BarChart rows={dayRows.map(row => ({ label: formatShortDate(row.date), value: row.mood }))} />
          <Text style={styles.muted}>日付を選んで残した体調の、気分の推移です。</Text>
        </Card>
      )}
      {dayRows.length > 0 && (
        <Card>
          <Text style={styles.label}>日ごとのだるさ</Text>
          <BarChart rows={dayRows.map(row => ({ label: formatShortDate(row.date), value: row.fatigue }))} />
        </Card>
      )}
      {recent.length > 0 && (
        <Card>
          <Text style={styles.label}>直近の気分の変化</Text>
          <BarChart rows={recent.map((row, index) => ({ label: `${GAMES.find(game => game.id === row.game_id)?.name ?? row.game_id} ${index + 1}`, value: row.mood_delta }))} />
        </Card>
      )}
      {data.length === 0 ? <Card><Text style={styles.text}>まだゲーム記録がありません。ゲームを1回遊んでみましょう。</Text></Card> : data.map(row => (
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
