import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, Stepper, SwitchRow, Title, styles } from '../src/components/UI';
import { getPlayPrefs, setSetting, type PlayPrefs } from '../src/db/database';
import { syncReminder } from '../src/lib/reminders';
import { pickBackup, restoreBackup, shareBackup } from '../src/lib/transfer';

const initial: PlayPrefs = { sound: true, haptic: true, reminder: false, reminderHour: 21, reminderMinute: 0 };

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<PlayPrefs>(initial);
  const [busy, setBusy] = useState(false);
  useFocusEffect(useCallback(() => {
    getPlayPrefs().then(setPrefs).catch(console.error);
  }, []));

  const applyReminder = async (next: PlayPrefs, ask: boolean) => {
    await setSetting('reminder', next.reminder ? '1' : '0');
    await setSetting('reminderHour', String(next.reminderHour));
    await setSetting('reminderMinute', String(next.reminderMinute));
    const result = await syncReminder(next.reminder, next.reminderHour, next.reminderMinute, ask);
    if (result === 'denied') {
      await setSetting('reminder', '0');
      setPrefs({ ...next, reminder: false });
      Alert.alert('通知が許可されていません', '端末の設定で通知を許可すると、毎日のリマインダーを使えます。');
      return;
    }
    setPrefs(next);
  };

  return (
    <ScrollView style={styles.screen}>
      <Title>設定</Title>
      <Card>
        <Text style={styles.label}>プレイ中の演出</Text>
        <SwitchRow label="音" value={prefs.sound} onPress={async () => {
          const sound = !prefs.sound;
          await setSetting('sound', sound ? '1' : '0');
          setPrefs({ ...prefs, sound });
        }} />
        <SwitchRow label="振動" value={prefs.haptic} onPress={async () => {
          const haptic = !prefs.haptic;
          await setSetting('haptic', haptic ? '1' : '0');
          setPrefs({ ...prefs, haptic });
        }} />
      </Card>
      <Card>
        <Text style={styles.label}>毎日のリマインダー</Text>
        <Text style={styles.muted}>体調を記録する時刻を、1日1回知らせます。</Text>
        <SwitchRow label="通知" value={prefs.reminder} onPress={() => applyReminder({ ...prefs, reminder: !prefs.reminder }, true).catch(error => {
          console.error(error);
          Alert.alert('エラー', '通知を設定できませんでした');
        })} />
        <Stepper label="時" value={prefs.reminderHour} min={0} max={23} onChange={hour => {
          const next = { ...prefs, reminderHour: hour };
          setSetting('reminderHour', String(hour)).then(() => applyReminder(next, false)).catch(console.error);
        }} />
        <Stepper label="分" value={prefs.reminderMinute} min={0} max={55} step={5} onChange={minute => {
          const next = { ...prefs, reminderMinute: minute };
          setSetting('reminderMinute', String(minute)).then(() => applyReminder(next, false)).catch(console.error);
        }} />
      </Card>
      <Card>
        <Text style={styles.label}>バックアップ</Text>
        <Text style={styles.muted}>日ごとの体調、ゲーム、タスク、XP、睡眠、仲間、設定をJSONで書き出します。読み込むと今の記録を置き換えます。</Text>
        <Button title="書き出して共有" disabled={busy} onPress={async () => {
          setBusy(true);
          try {
            await shareBackup();
          } catch (error) {
            console.error(error);
            Alert.alert('エラー', 'バックアップを共有できませんでした');
          } finally {
            setBusy(false);
          }
        }} />
        <Button secondary title="ファイルから置き換える" disabled={busy} onPress={async () => {
          setBusy(true);
          try {
            const payload = await pickBackup();
            if (payload === null) return;
            if (payload === 'invalid') {
              Alert.alert('読み込めません', 'このファイルはバックアップではありません');
              return;
            }
            Alert.alert('記録を置き換えますか', '今の体調・ゲーム・タスク・睡眠は、選んだファイルの内容になります。', [
              { text: 'キャンセル', style: 'cancel' },
              { text: '置き換える', style: 'destructive', onPress: () => {
                restoreBackup(payload).then(async () => {
                  const next = await getPlayPrefs();
                  await applyReminder(next, false);
                  Alert.alert('読み込みました', 'バックアップの内容に置き換えました');
                }).catch(error => {
                  console.error(error);
                  Alert.alert('エラー', '読み込みに失敗しました');
                });
              } },
            ]);
          } catch (error) {
            console.error(error);
            Alert.alert('エラー', 'ファイルを読めませんでした');
          } finally {
            setBusy(false);
          }
        }} />
      </Card>
      <Card>
        <Text style={styles.label}>このアプリについて</Text>
        <Text style={styles.text}>Energy Resetは医療機器ではありません。眠気、だるさ、気分、ストレスの数値は、プレイ前後に自分でつけた評価の差です。その差には、その日の自然な変動や、よくなりそうだという期待も含まれます。</Text>
        <Text style={styles.text}>ペースを整えた呼吸や、ごく短い行動は、落ち着きや着手の手がかりになることがあります。人によって違い、このアプリはその効果を保証しません。</Text>
        <Text style={styles.muted}>強い眠気や早朝覚醒が続くときは、医療機関に相談してください。</Text>
      </Card>
    </ScrollView>
  );
}
