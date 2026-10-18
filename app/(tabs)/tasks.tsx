import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { addXp, db } from '../../src/db/database';
import { Button, Card, Title, styles } from '../../src/components/UI';

type Task = { id: number; title: string; done: number };

export default function Tasks() {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<Task[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(120);
  const refresh = async () => setItems(await (await db()).getAllAsync<Task>('SELECT id,title,done FROM tasks ORDER BY done,id DESC'));
  useFocusEffect(useCallback(() => {
    refresh().catch(console.error);
  }, []));
  React.useEffect(() => {
    if (active === null) return;
    const timer = setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return (
    <ScrollView style={styles.screen}>
      <Title>スモールクエスト</Title>
      <Text style={[styles.muted, { marginBottom: 12 }]}>ゲームで達成した行動もここに残ります。作業できない日は休んで大丈夫です。</Text>
      <Card>
        <Text style={styles.label}>今日の小さな一歩</Text>
        <TextInput placeholder="例：エディタを開く" value={title} onChangeText={setTitle} style={{ padding: 12, backgroundColor: '#F1F5F9', borderRadius: 10 }} />
        <Button title="タスクを追加" onPress={async () => {
          if (!title.trim()) return;
          await (await db()).runAsync('INSERT INTO tasks(title,created_at) VALUES(?,?)', title.trim(), new Date().toISOString());
          setTitle('');
          await refresh();
        }} />
      </Card>
      {active !== null && (
        <Card>
          <Text style={styles.label}>2分スタート：残り {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</Text>
          <Button title="終了する" onPress={() => { setActive(null); setRemaining(120); }} />
        </Card>
      )}
      {items.map(item => (
        <Card key={item.id}>
          <Text style={styles.text}>{item.done ? '完了：' : ''}{item.title}</Text>
          {!item.done && (
            <View>
              <Button secondary title="2分だけ始める" onPress={async () => {
                setActive(item.id);
                setRemaining(120);
                await addXp(`task-start:${item.id}`, 10);
              }} />
              <Button title="達成した" onPress={async () => {
                try {
                  await (await db()).runAsync('UPDATE tasks SET done=1 WHERE id=?', item.id);
                  await addXp(`task-done:${item.id}`, 20);
                  if (active === item.id) setActive(null);
                  await refresh();
                } catch (error) {
                  console.error(error);
                  Alert.alert('エラー', '達成を保存できませんでした');
                }
              }} />
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}
