import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, Stepper, SwitchRow, Title, styles } from '../src/components/UI';
import { getRecentSleep, getSleep, saveSleep, type SleepLog } from '../src/db/database';
import { formatDate, formatDuration, shiftDate, sleepMinutes } from '../src/lib/play';

export default function SleepScreen() {
  const today = formatDate(new Date());
  const [date, setDate] = useState(today);
  const [bedHour, setBedHour] = useState(23);
  const [bedMinute, setBedMinute] = useState(0);
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(0);
  const [earlyAwake, setEarlyAwake] = useState(false);
  const [saved, setSaved] = useState<SleepLog | null>(null);
  const [recent, setRecent] = useState<SleepLog[]>([]);
  const [busy, setBusy] = useState(false);
  const minutes = sleepMinutes(bedHour, bedMinute, wakeHour, wakeMinute);

  const load = useCallback(async (nextDate: string) => {
    const [current, history] = await Promise.all([getSleep(nextDate), getRecentSleep()]);
    setSaved(current);
    setRecent(history);
    setEarlyAwake(current?.early_awake === 1);
  }, []);

  useFocusEffect(useCallback(() => {
    load(date).catch(console.error);
  }, [date, load]));

  const move = (days: number) => {
    const next = shiftDate(date, days);
    if (next > today) return;
    setDate(next);
  };

  return (
    <ScrollView style={styles.screen}>
      <Title>睡眠記録</Title>
      <Card>
        <Text style={styles.label}>{date}</Text>
        <Button secondary title="前日" onPress={() => move(-1)} />
        <Button secondary title="翌日" disabled={date >= today} onPress={() => move(1)} />
        {saved?.minutes != null && <Text style={styles.muted}>この日の保存済み：{formatDuration(saved.minutes)}{saved.early_awake ? '　早朝覚醒あり' : ''}</Text>}
        <Stepper label="就床 時" value={bedHour} min={0} max={23} onChange={setBedHour} />
        <Stepper label="就床 分" value={bedMinute} min={0} max={55} step={5} onChange={setBedMinute} />
        <Stepper label="起床 時" value={wakeHour} min={0} max={23} onChange={setWakeHour} />
        <Stepper label="起床 分" value={wakeMinute} min={0} max={55} step={5} onChange={setWakeMinute} />
        <Text style={styles.text}>睡眠時間 {minutes === 0 ? '同じ時刻です' : formatDuration(minutes)}</Text>
        <SwitchRow label="早朝覚醒" value={earlyAwake} onPress={() => setEarlyAwake(value => !value)} />
        <Button title="保存する" disabled={busy || minutes === 0} onPress={async () => {
          setBusy(true);
          try {
            await saveSleep({ date, minutes, earlyAwake });
            await load(date);
          } catch (error) {
            console.error(error);
            Alert.alert('エラー', '睡眠を保存できませんでした');
          } finally {
            setBusy(false);
          }
        }} />
      </Card>
      <Card>
        <Text style={styles.label}>最近の記録</Text>
        {recent.length === 0 ? <Text style={styles.muted}>まだありません</Text> : recent.map(row => (
          <Text key={row.id} style={styles.text}>{row.date}　{row.minutes == null ? '時間なし' : formatDuration(row.minutes)}{row.early_awake ? '　早朝覚醒' : ''}</Text>
        ))}
      </Card>
      <Text style={[styles.muted, { marginBottom: 20 }]}>強い眠気や早朝覚醒が続く場合は、医療機関に相談してください。</Text>
    </ScrollView>
  );
}
