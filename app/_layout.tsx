import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { db } from '../src/db/database';
export default function RootLayout() {
  useEffect(()=>{db().catch(console.error)},[]);
  return <Stack screenOptions={{headerShown:false}}><Stack.Screen name="(tabs)"/><Stack.Screen name="game/[id]" options={{headerShown:true,title:'リカバリーゲーム'}}/><Stack.Screen name="check-in" options={{headerShown:true,title:'体調チェック'}}/></Stack>;
}
