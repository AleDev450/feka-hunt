import type { RaceResult } from '../config';
export interface SavedRace extends RaceResult {id:string;name:string;date:string;}
const KEY='cholo-factos:v2:results';
export function readResults():SavedRace[]{try{const rows:unknown=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(rows)?rows.filter((r):r is SavedRace=>r&&Number.isFinite(r.score)&&typeof r.name==='string'):[];}catch{return [];}}
export function record():number{return readResults().reduce((best,r)=>Math.max(best,r.score),0);}
export function saveResult(result:RaceResult,name:string,id:string):void{
  const rows=readResults();if(rows.some(r=>r.id===id))return;
  rows.push({...result,id,name:name.trim().slice(0,12)||'CHOLO',date:new Date().toISOString()});
  localStorage.setItem(KEY,JSON.stringify(rows.sort((a,b)=>b.score-a.score).slice(0,100)));
}
