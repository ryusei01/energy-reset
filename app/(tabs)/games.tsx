import React from 'react';
import {ScrollView,Text} from 'react-native';
import {useRouter} from 'expo-router';
import {Card,Title,Button,styles} from '../../src/components/UI';
import {GAMES} from '../../src/lib/games';
export default function Games(){const router=useRouter();return <ScrollView style={styles.screen}><Title>リカバリーゲーム</Title><Text style={[styles.muted,{marginBottom:15}]}>プレイ前後の変化を記録。無理せず途中終了できます。</Text>{GAMES.map(g=><Card key={g.id}><Text style={styles.label}>{g.name}</Text><Text style={styles.muted}>{g.description} ・ 約{g.duration/60}分</Text><Button title="プレイ" onPress={()=>router.push(`/game/${g.id}`)}/></Card>)}</ScrollView>}
