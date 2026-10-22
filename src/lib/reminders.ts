import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'daily-checkin';

export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function syncReminder(enabled: boolean, hour: number, minute: number, ask: boolean) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled) return 'off' as const;
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted && ask) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return 'denied' as const;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: '体調リマインダー',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Energy Reset',
      body: '短いリセットからで大丈夫です。体調は任意で残せます',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: CHANNEL_ID,
      hour,
      minute,
    },
  });
  return 'on' as const;
}
