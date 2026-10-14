import { Tabs } from 'expo-router';
export default function TabsLayout(){return <Tabs screenOptions={{tabBarActiveTintColor:'#365CE6',headerShown:false}}><Tabs.Screen name="index" options={{title:'ホーム'}}/><Tabs.Screen name="games" options={{title:'ゲーム'}}/><Tabs.Screen name="tasks" options={{title:'タスク'}}/><Tabs.Screen name="insights" options={{title:'分析'}}/></Tabs>}
