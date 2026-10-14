import React,{useCallback,useState} from 'react';
import {ScrollView,Text,TextInput,View,Alert} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {db,addXp} from '../../src/db/database';
import {Card,Title,Button,styles} from '../../src/components/UI';
type Task={id:number;title:string;done:number};
export default function Tasks(){const [title,setTitle]=useState('');const [items,setItems]=useState<Task[]>([]);const [active,setActive]=useState<number|null>(null);const [remaining,setRemaining]=useState(120);
const refresh=async()=>setItems(await (await db()).getAllAsync<Task>('SELECT id,title,done FROM tasks ORDER BY done,id DESC'));
useFocusEffect(useCallback(()=>{refresh().catch(console.error)},[]));
React.useEffect(()=>{if(active===null)return;const t=setInterval(()=>setRemaining(v=>Math.max(0,v-1)),1000);return()=>clearInterval(t)},[active]);
return <ScrollView style={styles.screen}><Title>スモールクエスト</Title><Card><Text style={styles.label}>今日の小さな一歩</Text><TextInput placeholder="例：エディタを開く" value={title} onChangeText={setTitle} style={{padding:12,backgroundColor:'#F1F5F9',borderRadius:10}}/><Button title="タスクを追加" onPress={async()=>{if(!title.trim())return;await (await db()).runAsync('INSERT INTO tasks(title,created_at) VALUES(?,?)',title.trim(),new Date().toISOString());setTitle('');await refresh()}}/></Card>{active!==null&&<Card><Text style={styles.label}>2分スタート：残り {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</Text><Button title="終了する" onPress={()=>{setActive(null);setRemaining(120)}}/></Card>}{items.map(item=><Card key={item.id}><Text style={styles.text}>{item.done?'完了：':''}{item.title}</Text>{!item.done&&<View><Button secondary title="2分だけ始める" onPress={async()=>{setActive(item.id);setRemaining(120);await addXp(`task-start:${item.id}`,10)}}/><Button title="達成した" onPress={async()=>{await (await db()).runAsync('UPDATE tasks SET done=1 WHERE id=?',item.id);await addXp(`task-done:${item.id}`,20);if(active===item.id)setActive(null);await refresh()}}/></View>}</Card>)}<Text style={styles.muted}>作業できない日は休んでも大丈夫です。</Text></ScrollView>}
