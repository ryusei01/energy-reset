import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Title, styles } from '../../src/components/UI';
import { GAMES } from '../../src/lib/games';
import { GAME_VISUAL } from '../../src/lib/play';

export default function Games() {
  const router = useRouter();
  return (
    <ScrollView style={styles.screen}>
      <Title>リカバリーゲーム</Title>
      <Text style={[styles.muted, { marginBottom: 15 }]}>体調入力は任意です。残さなくても遊べます。途中で終えても大丈夫です。</Text>
      {GAMES.map(game => {
        const visual = GAME_VISUAL[game.id];
        return (
          <Card key={game.id}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 8, borderRadius: 8, backgroundColor: visual.accent }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.label}>{game.name}</Text>
                <Text style={styles.text}>{visual.cue}</Text>
                <Text style={styles.muted}>{game.description} ・ 約{game.duration / 60}分</Text>
                <Button title="プレイ" onPress={() => router.push(`/game/${game.id}`)} />
              </View>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}
