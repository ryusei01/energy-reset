import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { Button, Card, ProgressBar, ScoreInput, Title, styles } from '../../src/components/UI';
import { Companion } from '../../src/components/Companion';
import { BreathGarden } from '../../src/components/games/BreathGarden';
import { BubblePop } from '../../src/components/games/BubblePop';
import { RhythmReset } from '../../src/components/games/RhythmReset';
import { SmallQuest } from '../../src/components/games/SmallQuest';
import { GAMES, type Condition, type GameId, delta, xpProgress } from '../../src/lib/games';
import { companionStage, companionStageLabel, formatDate, type CompanionKind } from '../../src/lib/play';
import { endSession, getCompanionKind, getDailyCondition, getLatestConditionLog, getPlayPrefs, getXp, saveDailyCondition, startSession, type PlayPrefs } from '../../src/db/database';

const initial: Condition = { sleepiness: 5, fatigue: 5, mood: 5, stress: 5 };
const defaultPrefs: PlayPrefs = { sound: true, haptic: true, reminder: false, reminderHour: 21, reminderMinute: 0 };

function ConditionForm({ value, onChange }: { value: Condition; onChange: (v: Condition) => void }) {
  return (
    <>
      <ScoreInput label="眠気" value={value.sleepiness} onChange={n => onChange({ ...value, sleepiness: n })} />
      <ScoreInput label="だるさ" value={value.fatigue} onChange={n => onChange({ ...value, fatigue: n })} />
      <ScoreInput label="気分のよさ" value={value.mood} onChange={n => onChange({ ...value, mood: n })} />
      <ScoreInput label="ストレス" value={value.stress} onChange={n => onChange({ ...value, stress: n })} />
    </>
  );
}

export default function GameScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const gameId = (Array.isArray(params.id) ? params.id[0] : params.id) as GameId | undefined;
  const router = useRouter();
  const navigation = useNavigation();
  const game = GAMES.find(item => item.id === gameId);
  const [stage, setStage] = useState<'before' | 'play' | 'after' | 'done'>('before');
  const [before, setBefore] = useState<Condition>(initial);
  const [after, setAfter] = useState<Condition>(initial);
  const [beforeLogId, setBeforeLogId] = useState<number | null>(null);
  const [beforeDirty, setBeforeDirty] = useState(false);
  const [seconds, setSeconds] = useState(game?.duration ?? 120);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [prefs, setPrefs] = useState<PlayPrefs>(defaultPrefs);
  const [kind, setKind] = useState<CompanionKind>('flower');
  const [xp, setXp] = useState(0);
  const session = useRef<number | null>(null);

  useEffect(() => {
    navigation.setOptions({ headerShown: stage !== 'play', title: game?.name ?? 'リカバリーゲーム' });
  }, [game?.name, navigation, stage]);

  useEffect(() => {
    if (stage !== 'play') return;
    activateKeepAwakeAsync('energy-reset-play').catch(() => {});
    return () => {
      deactivateKeepAwake('energy-reset-play').catch(() => {});
    };
  }, [stage]);

  useFocusEffect(useCallback(() => {
    if (stage !== 'before') return;
    let cancelled = false;
    const today = formatDate(new Date());
    getDailyCondition(today).then(async log => {
      if (cancelled) return;
      if (log) {
        setBefore({ sleepiness: log.sleepiness, fatigue: log.fatigue, mood: log.mood, stress: log.stress });
        setBeforeLogId(log.id);
        setBeforeDirty(false);
        return;
      }
      const latest = await getLatestConditionLog();
      if (cancelled) return;
      if (latest && formatDate(new Date(latest.recorded_at)) === today) {
        setBefore({ sleepiness: latest.sleepiness, fatigue: latest.fatigue, mood: latest.mood, stress: latest.stress });
      }
      setBeforeLogId(null);
      setBeforeDirty(true);
    }).catch(console.error);
    getPlayPrefs().then(next => {
      if (!cancelled) setPrefs(next);
    }).catch(console.error);
    getCompanionKind().then(next => {
      if (!cancelled) setKind(next);
    }).catch(console.error);
    getXp().then(next => {
      if (!cancelled) setXp(next);
    }).catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [stage]));

  useEffect(() => {
    setStage('before');
    setScore(0);
    session.current = null;
    if (game) setSeconds(game.duration);
  }, [game, gameId]);

  useEffect(() => {
    if (stage !== 'play' || game?.id === 'quest') return;
    const timer = setInterval(() => setSeconds(current => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [game?.id, stage]);

  useEffect(() => {
    if (stage === 'play' && seconds === 0 && game?.id !== 'quest') setStage('after');
  }, [game?.id, seconds, stage]);

  if (!game) {
    return (
      <View style={styles.screen}>
        <Title>ゲームが見つかりません</Title>
        <Button title="戻る" onPress={() => router.back()} />
      </View>
    );
  }

  const useSavedBefore = !beforeDirty && beforeLogId != null;
  const growth = xpProgress(xp);
  const editBefore = (value: Condition) => {
    setBefore(value);
    setBeforeDirty(true);
    setBeforeLogId(null);
  };
  const begin = async () => {
    setBusy(true);
    try {
      if (!useSavedBefore) await saveDailyCondition({ date: formatDate(new Date()), ...before });
      session.current = await startSession(game.id, before);
      setScore(0);
      setSeconds(game.duration);
      setAfter(before);
      setStage('play');
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', 'ゲームを開始できませんでした');
    } finally {
      setBusy(false);
    }
  };
  const finish = async () => {
    if (session.current === null) return;
    setBusy(true);
    try {
      await endSession(session.current, after, score);
      setXp(await getXp());
      setStage('done');
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', '保存できませんでした');
    } finally {
      setBusy(false);
    }
  };
  const change = delta(before, after);
  const playProps = { sound: prefs.sound, haptic: prefs.haptic, seconds, score, onScore: setScore, onEnd: () => setStage('after') };

  if (stage === 'play') {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        {game.id === 'breath' && <BreathGarden {...playProps} />}
        {game.id === 'bubble' && <BubblePop {...playProps} />}
        {game.id === 'rhythm' && <RhythmReset {...playProps} />}
        {game.id === 'quest' && <SmallQuest {...playProps} />}
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <StatusBar style="dark" />
      <Title>{game.name}</Title>
      {stage === 'before' && useSavedBefore && (
        <Card>
          <Text style={styles.label}>今日の体調でプレイ</Text>
          <Text style={styles.text}>眠気 {before.sleepiness}　だるさ {before.fatigue}　気分 {before.mood}　ストレス {before.stress}</Text>
          <Text style={styles.muted}>今日残した体調をプレイ前の基準に使います。日ごとの記録はそのまま残ります。</Text>
          <Button title="ゲーム開始" disabled={busy} onPress={begin} />
          <Button secondary title="体調を入力し直す" onPress={() => { setBeforeDirty(true); setBeforeLogId(null); }} />
        </Card>
      )}
      {stage === 'before' && !useSavedBefore && (
        <Card>
          <Text style={styles.label}>プレイ前の体調</Text>
          <Text style={styles.muted}>今日の体調はまだ残していません。プレイ前の状態を入力してください。今日の記録としても残せます。</Text>
          <ConditionForm value={before} onChange={editBefore} />
          <Button title="ゲーム開始" disabled={busy} onPress={begin} />
        </Card>
      )}
      {stage === 'after' && (
        <Card>
          <Text style={styles.label}>プレイ後の体調</Text>
          <ConditionForm value={after} onChange={setAfter} />
          <Button title="結果を保存" disabled={busy} onPress={finish} />
        </Card>
      )}
      {stage === 'done' && (
        <Card>
          <Text style={styles.label}>プレイ完了</Text>
          <Companion kind={kind} level={growth.level} progress={growth.ratio} size={140} />
          <ProgressBar value={growth.into} max={growth.need} label={`Lv.${growth.level} ${companionStageLabel(kind, companionStage(growth.level))}　${growth.into} / ${growth.need} XP`} />
          <Text style={styles.text}>スコア：{score}　セッションXP：15　その日の初回プレイ：+5{game.id === 'quest' && score > 0 ? '　クエスト達成XP：20' : ''}</Text>
          <Text style={styles.text}>眠気の改善：{change.sleepiness}　だるさの改善：{change.fatigue}</Text>
          <Text style={styles.text}>気分の変化：{change.mood}　ストレスの改善：{change.stress}</Text>
          <Text style={styles.muted}>数値は自己評価の変化です。悪化した場合は休息を優先してください。日ごとの体調は上書きされません。</Text>
          <Button title="タスクを始める" onPress={() => router.replace('/(tabs)/tasks')} />
          <Button secondary title="ホームへ" onPress={() => router.replace('/(tabs)')} />
        </Card>
      )}
    </ScrollView>
  );
}
