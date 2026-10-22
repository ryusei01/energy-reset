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
import { formatDate, growthLabel, type CompanionKind } from '../../src/lib/play';
import { endSession, getCompanionKind, getDailyCondition, getPlayPrefs, getXp, saveDailyCondition, startSession, type PlayPrefs } from '../../src/db/database';

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
  const [savedBefore, setSavedBefore] = useState<Condition | null>(null);
  const [loggedBefore, setLoggedBefore] = useState<Condition | null>(null);
  const [loggedAfter, setLoggedAfter] = useState<Condition | null>(null);
  const [enterBefore, setEnterBefore] = useState(false);
  const [enterAfter, setEnterAfter] = useState(false);
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
    getDailyCondition(today).then(log => {
      if (cancelled) return;
      if (log) {
        const next = { sleepiness: log.sleepiness, fatigue: log.fatigue, mood: log.mood, stress: log.stress };
        setBefore(next);
        setSavedBefore(next);
        return;
      }
      setSavedBefore(null);
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
    setEnterBefore(false);
    setEnterAfter(false);
    setLoggedBefore(null);
    setLoggedAfter(null);
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

  const begin = async (condition: Condition | null, saveDaily = false) => {
    setBusy(true);
    try {
      if (saveDaily && condition) await saveDailyCondition({ date: formatDate(new Date()), ...condition });
      session.current = await startSession(game.id, condition);
      setLoggedBefore(condition);
      setScore(0);
      setSeconds(game.duration);
      setAfter(condition ?? initial);
      setStage('play');
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', 'ゲームを開始できませんでした');
    } finally {
      setBusy(false);
    }
  };
  const finish = async (condition: Condition | null) => {
    if (session.current === null) return;
    setBusy(true);
    try {
      await endSession(session.current, condition, score);
      setLoggedAfter(condition);
      setXp(await getXp());
      setStage('done');
    } catch (error) {
      console.error(error);
      Alert.alert('エラー', '保存できませんでした');
    } finally {
      setBusy(false);
    }
  };
  const change = loggedBefore && loggedAfter ? delta(loggedBefore, loggedAfter) : null;
  const growth = xpProgress(xp);
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
      {stage === 'before' && (
        <Card>
          <Text style={styles.label}>準備</Text>
          <Text style={styles.muted}>体調入力は任意です。残さなくてもゲームを始められます。</Text>
          {savedBefore && !enterBefore && (
            <>
              <Text style={styles.text}>今日の体調　眠気 {savedBefore.sleepiness}　だるさ {savedBefore.fatigue}　気分 {savedBefore.mood}　ストレス {savedBefore.stress}</Text>
              <Text style={styles.muted}>残してあれば変化の記録に使えます。使わなくても始められます。</Text>
              <Button title="今日の体調で始める" disabled={busy} onPress={() => begin(savedBefore)} />
            </>
          )}
          <Button title={savedBefore && !enterBefore ? '体調なしで始める' : 'ゲーム開始'} disabled={busy} onPress={() => begin(null)} secondary={Boolean(savedBefore && !enterBefore)} />
          {!enterBefore && <Button secondary title="体調を残してから始める" onPress={() => setEnterBefore(true)} />}
          {enterBefore && (
            <>
              <ConditionForm value={before} onChange={setBefore} />
              <Button title="この体調で始める" disabled={busy} onPress={() => begin(before, savedBefore == null)} />
              <Button secondary title="体調入力をやめる" onPress={() => setEnterBefore(false)} />
            </>
          )}
        </Card>
      )}
      {stage === 'after' && (
        <Card>
          <Text style={styles.label}>プレイ終了</Text>
          <Text style={styles.muted}>体調入力は任意です。残さなくても完了できます。</Text>
          {!enterAfter && (
            <>
              <Button title="完了する" disabled={busy} onPress={() => finish(null)} />
              <Button secondary title="体調を残す" onPress={() => setEnterAfter(true)} />
            </>
          )}
          {enterAfter && (
            <>
              <ConditionForm value={after} onChange={setAfter} />
              <Button title="体調を残して完了" disabled={busy} onPress={() => finish(after)} />
              <Button secondary title="記録せずに完了" disabled={busy} onPress={() => finish(null)} />
            </>
          )}
        </Card>
      )}
      {stage === 'done' && (
        <Card>
          <Text style={styles.label}>プレイ完了</Text>
          <Companion kind={kind} level={growth.level} progress={growth.ratio} size={140} />
          <ProgressBar value={growth.into} max={growth.need} label={`Lv.${growth.level} ${growthLabel(kind, growth.level, growth.ratio)}　${growth.into} / ${growth.need} XP`} />
          <Text style={styles.text}>スコア：{score}　セッションXP：15　その日の初回プレイ：+5{game.id === 'quest' && score > 0 ? '　クエスト達成XP：20' : ''}</Text>
          {change ? (
            <>
              <Text style={styles.text}>眠気の改善：{change.sleepiness}　だるさの改善：{change.fatigue}</Text>
              <Text style={styles.text}>気分の変化：{change.mood}　ストレスの改善：{change.stress}</Text>
              <Text style={styles.muted}>数値は自己評価の変化です。悪化した場合は休息を優先してください。日ごとの体調は上書きされません。</Text>
            </>
          ) : (
            <Text style={styles.muted}>体調を残していないため、変化は表示しません。日ごとの記録もそのままです。</Text>
          )}
          <Button title="タスクを始める" onPress={() => router.replace('/(tabs)/tasks')} />
          <Button secondary title="ホームへ" onPress={() => router.replace('/(tabs)')} />
        </Card>
      )}
    </ScrollView>
  );
}
