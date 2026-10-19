import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, ScoreInput, Title, palette, styles } from '../src/components/UI';
import { getDailyCondition, getRecentDailyConditions, saveDailyCondition, type DailyCondition } from '../src/db/database';
import type { Condition } from '../src/lib/games';
import { formatDate, formatShortDate, shiftDate } from '../src/lib/play';

const blank: Condition = { sleepiness: 5, fatigue: 5, mood: 5, stress: 5 };

export default function CheckIn() {
  const today = formatDate(new Date());
  const [date, setDate] = useState(today);
  const [c, setC] = useState<Condition>(blank);
  const [saved, setSaved] = useState<DailyCondition | null>(null);
  const [recent, setRecent] = useState<DailyCondition[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (nextDate: string) => {
    const [current, history] = await Promise.all([getDailyCondition(nextDate), getRecentDailyConditions(14)]);
    setSaved(current);
    setRecent(history);
    setC(current ? { sleepiness: current.sleepiness, fatigue: current.fatigue, mood: current.mood, stress: current.stress } : blank);
  }, []);

  useFocusEffect(useCallback(() => {
    load(date).catch(console.error);
  }, [date, load]));

  const move = (days: number) => {
    const next = shiftDate(date, days);
    if (next > today) return;
    setDate(next);
  };

  const set = (key: keyof Condition) => (value: number) => setC(previous => ({ ...previous, [key]: value }));
  const recorded = new Set(recent.map(row => row.date));
  const week = Array.from({ length: 7 }, (_, index) => shiftDate(today, index - 6));

  return (
    <ScrollView style={styles.screen}>
      <Title>日ごとの体調</Title>
      <Card>
        <Text style={styles.label}>{date}{date === today ? '　今日' : ''}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
          {week.map(day => {
            const active = day === date;
            const has = recorded.has(day);
            return (
              <Pressable
                key={day}
                accessibilityLabel={`${day}の体調`}
                onPress={() => setDate(day)}
                style={{ flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? palette.blue : '#E8EDF5' }}
              >
                <Text style={{ color: active ? 'white' : palette.ink, fontWeight: '700', fontSize: 12 }}>{formatShortDate(day)}</Text>
                <View style={{ marginTop: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: has ? (active ? 'white' : palette.blue) : 'transparent' }} />
              </Pressable>
            );
          })}
        </View>
        <Button secondary title="前日" onPress={() => move(-1)} />
        <Button secondary title="翌日" disabled={date >= today} onPress={() => move(1)} />
        {saved ? <Text style={styles.muted}>この日は保存済みです。上書きできます。</Text> : <Text style={styles.muted}>この日はまだ残していません。</Text>}
        <Text style={styles.muted}>0 = なし（気分のみ最悪）、10 = 最大（気分のみ最高）</Text>
        <ScoreInput label="眠気" value={c.sleepiness} onChange={set('sleepiness')} />
        <ScoreInput label="だるさ" value={c.fatigue} onChange={set('fatigue')} />
        <ScoreInput label="気分のよさ" value={c.mood} onChange={set('mood')} />
        <ScoreInput label="ストレス" value={c.stress} onChange={set('stress')} />
        <Button
          disabled={busy}
          title={saved ? 'この日の体調を更新' : 'この日の体調を残す'}
          onPress={async () => {
            setBusy(true);
            try {
              await saveDailyCondition({ date, ...c });
              await load(date);
            } catch (error) {
              console.error(error);
              Alert.alert('エラー', '保存できませんでした');
            } finally {
              setBusy(false);
            }
          }}
        />
      </Card>
      <Card>
        <Text style={styles.label}>最近の体調</Text>
        {recent.length === 0 ? <Text style={styles.muted}>まだありません</Text> : recent.map(row => (
          <Pressable key={row.id} onPress={() => setDate(row.date)}>
            <Text style={styles.text}>{row.date}　眠気 {row.sleepiness}　だるさ {row.fatigue}　気分 {row.mood}　ストレス {row.stress}</Text>
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}
