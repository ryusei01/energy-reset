import React,{useCallback,useState} from 'react';
import {ScrollView,Text} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {Card,Title,styles} from '../../src/components/UI';
import {getInsights} from '../../src/db/database';
import {GAMES} from '../../src/lib/games';
type Insight={game_id:string;plays:number;fatigue_delta:number;mood_delta:number};
export default function Insights(){const [data,setData]=useState<Insight[]>([]);useFocusEffect(useCallback(()=>{getInsights().then(setData).catch(console.error)},[]));return <ScrollView style={styles.screen}><Title>ゲーム別の記録</Title><Text style={[styles.muted,{marginBottom:14}]}>数値はプレイ前後の自己評価の差であり、治療効果を示すものではありません。</Text>{data.length===0?<Card><Text style={styles.text}>まだ記録がありません。ゲームを1回遊んでみましょう。</Text></Card>:data.map(row=><Card key={row.game_id}><Text style={styles.label}>{GAMES.find(g=>g.id===row.game_id)?.name??row.game_id}</Text><Text style={styles.text}>プレイ回数：{row.plays}</Text><Text style={styles.text}>だるさの平均変化：{row.fatigue_delta>0?'+':''}{row.fatigue_delta} 改善ポイント</Text><Text style={styles.text}>気分の平均変化：{row.mood_delta>0?'+':''}{row.mood_delta} ポイント</Text>{row.plays<5&&<Text style={styles.muted}>データが少ないため参考値です</Text>}</Card>)}</ScrollView>}
