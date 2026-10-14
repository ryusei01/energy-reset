import React,{useState} from 'react';
import {ScrollView,Text,Alert} from 'react-native';
import {useRouter} from 'expo-router';
import {Card,Title,Button,ScoreInput,styles} from '../src/components/UI';
import {logCondition} from '../src/db/database';
import type {Condition} from '../src/lib/games';
export default function CheckIn(){const router=useRouter();const [c,setC]=useState<Condition>({sleepiness:6,fatigue:6,mood:5,stress:5});const [busy,setBusy]=useState(false);
const set=(key:keyof Condition)=>(v:number)=>setC(p=>({...p,[key]:v}));
return <ScrollView style={styles.screen}><Title>今のコンディション</Title><Card><Text style={styles.muted}>0 = なし（気分のみ最悪）、10 = 最大（気分のみ最高）</Text><ScoreInput label="眠気" value={c.sleepiness} onChange={set('sleepiness')}/><ScoreInput label="だるさ" value={c.fatigue} onChange={set('fatigue')}/><ScoreInput label="気分のよさ" value={c.mood} onChange={set('mood')}/><ScoreInput label="ストレス" value={c.stress} onChange={set('stress')}/><Button disabled={busy} title="保存する" onPress={async()=>{setBusy(true);try{await logCondition(c);router.back()}catch{Alert.alert('エラー','保存できませんでした')}finally{setBusy(false)}}}/></Card></ScrollView>}
