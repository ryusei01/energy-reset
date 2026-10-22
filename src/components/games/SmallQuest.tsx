import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { completePresetQuest, completeTaskById, getCompanionKind, getXp, listOpenTasks, type OpenTask } from '../../db/database';
import { xpProgress } from '../../lib/games';
import { formatClock, GAME_VISUAL, QUEST_PRESETS, type CompanionKind } from '../../lib/play';
import { Companion } from '../Companion';
import { GameFrame, type GamePlayProps } from './GameFrame';
import * as Haptics from 'expo-haptics';

type Choice = { kind: 'preset' | 'task'; id: number | string; title: string };

function Ring({ progress }: { progress: number }) {
  const dots = 36;
  const size = 168;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: dots }, (_, index) => {
        const angle = (index / dots) * Math.PI * 2 - Math.PI / 2;
        const radius = size / 2 - 8;
        const lit = index / dots < progress;
        return <View key={index} style={{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: lit ? '#F0C27A' : 'rgba(255,255,255,0.22)', left: size / 2 + Math.cos(angle) * radius - 4, top: size / 2 + Math.sin(angle) * radius - 4 }} />;
      })}
    </View>
  );
}

export function SmallQuest({ haptic, onScore, onEnd }: GamePlayProps) {
  const [tasks, setTasks] = useState<OpenTask[]>([]);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [left, setLeft] = useState(120);
  const [done, setDone] = useState(false);
  const [awarded, setAwarded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [xp, setXp] = useState(0);
  const [kind, setKind] = useState<CompanionKind>('flower');

  useEffect(() => {
    listOpenTasks().then(setTasks).catch(console.error);
    getXp().then(setXp).catch(console.error);
    getCompanionKind().then(setKind).catch(console.error);
  }, []);

  useEffect(() => {
    if (!choice || done) return;
    const start = Date.now();
    const timer = setInterval(() => setLeft(Math.max(0, 120 - Math.floor((Date.now() - start) / 1000))), 250);
    return () => clearInterval(timer);
  }, [choice, done]);

  const finish = async () => {
    if (!choice || left > 0 || done || busy) return;
    setBusy(true);
    try {
      const gained = choice.kind === 'task' ? await completeTaskById(Number(choice.id)) : Boolean(await completePresetQuest(choice.title));
      if (haptic) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAwarded(gained);
      setDone(true);
      onScore(gained ? 1 : 0);
      setXp(await getXp());
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', '達成を記録できませんでした');
    } finally {
      setBusy(false);
    }
  };

  const progress = choice ? (120 - left) / 120 : 0;
  const growth = xpProgress(xp);
  return (
    <GameFrame colors={GAME_VISUAL.quest.colors} title="スモールクエスト" meta={done ? '達成' : choice ? formatClock(left) : '選択'} endLabel={done ? '終える' : '終了する'} onEnd={onEnd}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 12 }}>
        <Companion kind={kind} level={growth.level} size={120} light progress={growth.ratio} />
        {!choice && <Text style={{ color: 'rgba(255,255,255,0.86)', textAlign: 'center', marginBottom: 12 }}>今できる行動を一つ選ぶ。2分たったら達成を記録できる。</Text>}
        {choice && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 168, height: 168, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute' }}><Ring progress={progress} /></View>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: '800' }}>{formatClock(left)}</Text>
            </View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginTop: 8 }}>{choice.title}</Text>
            <Pressable accessibilityRole="button" disabled={left > 0 || done || busy} onPress={finish} style={{ marginTop: 14, minHeight: 48, paddingHorizontal: 22, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: left > 0 || done ? 'rgba(255,255,255,0.2)' : '#F0C27A' }}>
              {busy ? <ActivityIndicator color="#2C2116" /> : <Text style={{ color: left > 0 || done ? 'white' : '#2C2116', fontWeight: '800' }}>{done ? '達成済み' : left > 0 ? '2分後に達成を記録' : '達成した'}</Text>}
            </Pressable>
            {done && <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>{awarded ? 'タスク一覧に残し、20 XPを足しました' : 'このタスクはすでに完了していました'}</Text>}
          </View>
        )}
        {!choice && (
          <View style={{ alignSelf: 'stretch', gap: 8 }}>
            {QUEST_PRESETS.map(preset => (
              <Pressable key={preset.id} accessibilityRole="button" onPress={() => setChoice({ kind: 'preset', id: preset.id, title: preset.title })} style={{ minHeight: 48, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' }}>
                <Text style={{ color: 'white', fontSize: 16 }}>{preset.title}</Text>
              </Pressable>
            ))}
            {tasks.map(task => (
              <Pressable key={task.id} accessibilityRole="button" onPress={() => setChoice({ kind: 'task', id: task.id, title: task.title })} style={{ minHeight: 48, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: 'rgba(240,194,122,0.18)' }}>
                <Text style={{ color: '#F0C27A', fontSize: 13 }}>登録済みタスク</Text>
                <Text style={{ color: 'white', fontSize: 16 }}>{task.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </GameFrame>
  );
}
