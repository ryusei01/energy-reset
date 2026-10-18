import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, Title, styles } from '../../src/components/UI';
import { Companion } from '../../src/components/Companion';
import { getLatestCondition, getXp } from '../../src/db/database';
import { GAMES, levelFromXp, recommend, type Condition } from '../../src/lib/games';

export default function Home() {
  const router = useRouter();
  const [condition, setCondition] = useState<Condition | null>(null);
  const [xp, setXp] = useState(0);
  useFocusEffect(useCallback(() => {
    getLatestCondition().then(setCondition).catch(console.error);
    getXp().then(setXp).catch(console.error);
  }, []));
  const suggestion = condition ? recommend(condition) : null;
  const level = levelFromXp(xp);
  return (
    <ScrollView style={styles.screen}>
      <Title>Energy Reset</Title>
      <Card>
        <View style={{ alignItems: 'center' }}>
          <Companion level={level} />
          <Text style={styles.muted}>累計 {xp} XP。休む日があっても、またここからで大丈夫です。</Text>
        </View>
      </Card>
      <Card>
        <Text style={styles.label}>今日のコンディション</Text>
        {condition ? <Text style={styles.text}>眠気 {condition.sleepiness}　だるさ {condition.fatigue}　気分 {condition.mood}　ストレス {condition.stress}</Text> : <Text style={styles.muted}>まずは体調を記録しましょう</Text>}
        <Button title="体調を記録" onPress={() => router.push('/check-in')} />
        <Button secondary title="睡眠を記録" onPress={() => router.push('/sleep')} />
      </Card>
      <Card>
        <Text style={styles.label}>おすすめ</Text>
        <Text style={styles.text}>{!condition ? '体調を記録するとおすすめが表示されます' : suggestion === 'rest' ? '眠気・だるさが強めです。ゲームより休息を優先しましょう。' : GAMES.find(item => item.id === suggestion)?.name}</Text>
        {suggestion && suggestion !== 'rest' && <Button title="ゲームを始める" onPress={() => router.push(`/game/${suggestion}`)} />}
        <Button secondary title="ゲーム一覧へ" onPress={() => router.push('/(tabs)/games')} />
      </Card>
      <Button secondary title="設定とバックアップ" onPress={() => router.push('/settings')} />
      <Text style={[styles.muted, { marginBottom: 24 }]}>ゲームは治療の代わりではありません。</Text>
    </ScrollView>
  );
}
