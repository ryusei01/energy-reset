import React, { useRef } from 'react';
import { Alert, Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { File } from 'expo-file-system';
import { Button } from './UI';

const TARGETS = {
  x: 'com.twitter.android',
  instagram: 'com.instagram.android',
} as const;

async function openAndroidApp(packageName: string, uri: string, caption: string) {
  const contentUri = new File(uri).contentUri;
  await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
    type: 'image/png',
    packageName,
    flags: 1,
    extra: {
      'android.intent.extra.STREAM': contentUri,
      'android.intent.extra.TEXT': caption,
    },
  });
}

async function shareOnWeb(uri: string, caption: string) {
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (!nav.share) {
    Alert.alert('共有', 'このブラウザでは共有できません。スマホのアプリから X や Instagram に送れます。');
    return;
  }
  if (uri.startsWith('data:')) {
    const blob = await (await fetch(uri)).blob();
    const file = new window.File([blob], 'energy-reset.png', { type: 'image/png' });
    if (!nav.canShare || nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], text: caption, title: 'Energy Reset' });
      return;
    }
  }
  await nav.share({ text: caption, title: 'Energy Reset' });
}

export function GrowthShare({ caption, children }: { caption: string; children: React.ReactNode }) {
  const ref = useRef<View>(null);
  const share = async (target: keyof typeof TARGETS) => {
    try {
      if (Platform.OS === 'web') {
        const node = ref.current as unknown as HTMLElement | null;
        if (!node || typeof node.getBoundingClientRect !== 'function') {
          Alert.alert('共有', 'このブラウザでは画像を作れません。スマホのアプリから X や Instagram に送れます。');
          return;
        }
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(node, { backgroundColor: '#F4F7FB' });
        await shareOnWeb(canvas.toDataURL('image/png'), caption);
        return;
      }
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
      if (uri.startsWith('data:')) {
        await shareOnWeb(uri, caption);
        return;
      }
      try {
        await openAndroidApp(TARGETS[target], uri, caption);
      } catch (error) {
        console.error(error);
        if (!(await Sharing.isAvailableAsync())) {
          Alert.alert('共有できません', 'X または Instagram が見つかりませんでした。');
          return;
        }
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'XやInstagramに共有', UTI: 'public.png' });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('共有できませんでした', '画像を作れなかったので、もう一度試してください。');
    }
  };

  return (
    <View>
      <View ref={ref} collapsable={false} style={{ backgroundColor: '#F4F7FB', borderRadius: 18, paddingVertical: 8, gap: 8 }}>
        {children}
      </View>
      <Button title="Xで共有" onPress={() => share('x')} />
      <Button secondary title="Instagramで共有" onPress={() => share('instagram')} />
    </View>
  );
}
