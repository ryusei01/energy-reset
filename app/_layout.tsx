import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { db, getPlayPrefs, setSetting } from '../src/db/database';
import { configureNotifications, syncReminder } from '../src/lib/reminders';

export default function RootLayout() {
  useEffect(() => {
    configureNotifications();
    db().then(async () => {
      const prefs = await getPlayPrefs();
      if (!prefs.reminder) return;
      const result = await syncReminder(true, prefs.reminderHour, prefs.reminderMinute, false);
      if (result === 'denied') await setSetting('reminder', '0');
    }).catch(console.error);
  }, []);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="game/[id]" options={{ headerShown: true, title: 'リカバリーゲーム' }} />
      <Stack.Screen name="check-in" options={{ headerShown: true, title: '体調チェック' }} />
      <Stack.Screen name="sleep" options={{ headerShown: true, title: '睡眠記録' }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: '設定' }} />
    </Stack>
  );
}
