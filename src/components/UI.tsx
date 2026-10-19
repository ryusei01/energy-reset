import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
export const palette = { bg:'#F4F7FB', ink:'#17243B', blue:'#365CE6', muted:'#64748B', white:'#FFFFFF' };
export function Card({children}:{children:React.ReactNode}) { return <View style={styles.card}>{children}</View>; }
export function Title({children}:{children:React.ReactNode}) {return <Text style={styles.title}>{children}</Text>}
export function Button({title,onPress,secondary=false,disabled=false}:{title:string;onPress:()=>void;secondary?:boolean;disabled?:boolean}) {return <Pressable disabled={disabled} onPress={onPress} style={[styles.button,secondary&&styles.secondary,disabled&&{opacity:.5}]}><Text style={[styles.buttonText,secondary&&{color:palette.blue}]}>{title}</Text></Pressable>}
export function ScoreInput({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}) {return <View style={{marginVertical:10}}><Text style={styles.label}>{label}  {value}/10</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:5,marginTop:8}}>{Array.from({length:11},(_,n)=><Pressable accessibilityLabel={`${label} ${n}`} key={n} onPress={()=>onChange(n)} style={{backgroundColor:value===n?palette.blue:'#E8EDF5',paddingVertical:8,minWidth:27,alignItems:'center',borderRadius:7}}><Text style={{color:value===n?'white':palette.ink,fontSize:12}}>{n}</Text></Pressable>)}</View></View>}
export function SwitchRow({label,value,onPress}:{label:string;value:boolean;onPress:()=>void}) {
  return <Pressable accessibilityRole="switch" accessibilityState={{checked:value}} onPress={onPress} style={styles.switchRow}><Text style={styles.text}>{label}</Text><Text style={[styles.label,{color:value?palette.blue:palette.muted}]}>{value?'オン':'オフ'}</Text></Pressable>;
}
export function Stepper({label,value,onChange,min,max,step=1}:{label:string;value:number;onChange:(n:number)=>void;min:number;max:number;step?:number}) {
  const previous = Math.max(min, value - step);
  const next = Math.min(max, value + step);
  return <View style={styles.switchRow}><Text style={styles.text}>{label}</Text><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Pressable accessibilityLabel={`${label}を減らす`} onPress={()=>onChange(previous)} style={styles.step}><Text style={styles.label}>−</Text></Pressable><Text style={[styles.label,{minWidth:28,textAlign:'center'}]}>{String(value).padStart(2,'0')}</Text><Pressable accessibilityLabel={`${label}を増やす`} onPress={()=>onChange(next)} style={styles.step}><Text style={styles.label}>＋</Text></Pressable></View></View>;
}
export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.muted}>{label}</Text> : null}
      <View accessibilityRole="progressbar" style={{ height: 12, borderRadius: 8, backgroundColor: '#E8EDF5', overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(ratio > 0 ? 8 : 0, ratio * 100)}%` as const, height: 12, borderRadius: 8, backgroundColor: palette.blue }} />
      </View>
    </View>
  );
}
export const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:palette.bg,padding:18},
  card:{backgroundColor:'white',padding:17,borderRadius:18,marginBottom:14,gap:10,shadowColor:'#17243B',shadowOpacity:0.06,shadowRadius:12,shadowOffset:{width:0,height:6},elevation:2},
  title:{fontSize:24,fontWeight:'800',color:palette.ink,marginBottom:15},
  label:{fontSize:15,fontWeight:'600',color:palette.ink},
  text:{fontSize:15,color:palette.ink},
  muted:{fontSize:13,color:palette.muted},
  button:{backgroundColor:palette.blue,padding:15,borderRadius:12,alignItems:'center',marginVertical:5},
  secondary:{backgroundColor:'#E7EDFF'},
  buttonText:{color:'white',fontWeight:'700',fontSize:15},
  switchRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:48},
  step:{width:44,height:44,borderRadius:12,backgroundColor:'#E8EDF5',alignItems:'center',justifyContent:'center'},
});
