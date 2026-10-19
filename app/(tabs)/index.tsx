import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Card, ProgressBar, Title, palette, styles } from '../../src/components/UI';
import { Companion, GrowthTrack } from '../../src/components/Companion';
import { getCompanionKind, getDailyCondition, getTodayActivity, getXp, setCompanionKind, type DailyCondition, type TodayActivity } from '../../src/db/database';
import { GAMES, recommend, xpProgress, type Condition } from '../../src/lib/games';
import { COMPANIONS, companionHint, companionLine, companionStage, companionStageLabel, formatDate, type CompanionKind } from '../../src/lib/play';

const emptyActivity: TodayActivity = { checkedIn: false, playedGame: false, didTask: false, streak: 0 };

export default function Home() {
  const router = useRouter();
  const today = formatDate(new Date());
  const [condition, setCondition] = useState<DailyCondition | null>(null);
  const [xp, setXp] = useState(0);
  const [kind, setKind] = useState<CompanionKind>('flower');
  const [activity, setActivity] = useState<TodayActivity>(emptyActivity);

  useFocusEffect(useCallback(() => {
    getDailyCondition(today).then(setCondition).catch(console.error);
    getXp().then(setXp).catch(console.error);
    getCompanionKind().then(setKind).catch(console.error);
    getTodayActivity(today).then(setActivity).catch(console.error);
  }, [today]));

  const suggestion = condition ? recommend(condition) : null;
  const growth = xpProgress(xp);
  const todayCondition: Condition | null = condition;
  const choose = async (next: CompanionKind) => {
    setKind(next);
    await setCompanionKind(next);
  };

  return (
    <ScrollView style={styles.screen}>
      <Title>Energy Reset</Title>
      <Card>
        <View style={{ alignItems: 'center' }}>
          <Companion level={growth.level} kind={kind} progress={growth.ratio} />
          <Text style={styles.muted}>{companionLine(kind, todayCondition, activity.streak)}</Text>
        </View>
        <GrowthTrack kind={kind} level={growth.level} />
        <ProgressBar value={growth.into} max={growth.need} label={`Lv.${growth.level} ${companionStageLabel(kind, companionStage(growth.level))}　${growth.into} / ${growth.need} XP`} />
        <Text style={styles.text}>{companionHint(kind, growth.level, growth.remaining)}</Text>
        {activity.streak > 0 && <Text style={styles.muted}>体調の連続記録 {activity.streak}日</Text>}
      </Card>
      <Card>
        <Text style={styles.label}>仲間をえらぶ</Text>
        <Text style={styles.muted}>花でも、ねこ・とり・きつねでも育てられます。姿はレベルで変わります。</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {COMPANIONS.map(item => {
            const active = kind === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => choose(item.id).catch(console.error)}
                style={{ width: '48%', marginBottom: 8, paddingVertical: 10, borderRadius: 16, alignItems: 'center', backgroundColor: active ? '#E7EDFF' : '#F1F5F9', borderWidth: active ? 2 : 0, borderColor: palette.blue }}
              >
                <Companion kind={item.id} level={growth.level} size={88} progress={growth.ratio} showLabel={false} />
                <Text style={styles.label}>{item.name}</Text>
                <Text style={styles.muted}>{item.blurb}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Card>
        <Text style={styles.label}>今日のリセット</Text>
        {[
          { done: activity.checkedIn, label: '体調を残す' },
          { done: activity.playedGame, label: 'ゲームを1回' },
          { done: activity.didTask, label: '小さな一歩' },
        ].map(item => (
          <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: item.done ? palette.blue : '#E8EDF5', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: item.done ? 'white' : palette.muted, fontWeight: '800', fontSize: 12 }}>{item.done ? '済' : ''}</Text>
            </View>
            <Text style={styles.text}>{item.label}</Text>
          </View>
        ))}
        {!activity.checkedIn && <Button title="今日の体調を残す" onPress={() => router.push('/check-in')} />}
        {!activity.playedGame && suggestion && suggestion !== 'rest' && <Button secondary title={`${GAMES.find(item => item.id === suggestion)?.name}を始める`} onPress={() => router.push(`/game/${suggestion}`)} />}
        {!activity.didTask && <Button secondary title="小さな一歩へ" onPress={() => router.push('/(tabs)/tasks')} />}
      </Card>
      <Card>
        <Text style={styles.label}>今日のコンディション</Text>
        {condition ? (
          <Text style={styles.text}>眠気 {condition.sleepiness}　だるさ {condition.fatigue}　気分 {condition.mood}　ストレス {condition.stress}</Text>
        ) : (
          <Text style={styles.muted}>今日はまだ残していません。昨日以前の記録とは別に、日付ごとに残せます。</Text>
        )}
        <Button title={condition ? '今日の体調を見直す' : '体調を記録'} onPress={() => router.push('/check-in')} />
        <Button secondary title="睡眠を記録" onPress={() => router.push('/sleep')} />
      </Card>
      <Card>
        <Text style={styles.label}>おすすめ</Text>
        <Text style={styles.text}>{!condition ? '今日の体調を残すとおすすめが表示されます' : suggestion === 'rest' ? '眠気・だるさが強めです。ゲームより休息を優先しましょう。' : GAMES.find(item => item.id === suggestion)?.name}</Text>
        {suggestion && suggestion !== 'rest' && <Button title="ゲームを始める" onPress={() => router.push(`/game/${suggestion}`)} />}
        <Button secondary title="ゲーム一覧へ" onPress={() => router.push('/(tabs)/games')} />
      </Card>
      <Button secondary title="設定とバックアップ" onPress={() => router.push('/settings')} />
      <Text style={[styles.muted, { marginBottom: 24 }]}>ゲームは治療の代わりではありません。</Text>
    </ScrollView>
  );
}
