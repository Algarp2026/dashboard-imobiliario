import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {NAMES} from './contracts.mjs';
const require=createRequire(import.meta.url),makeStore=require('../../tests/helpers/apps-script-store.js');
const sourcePath=fileURLToPath(new URL('../../google_apps_script.gs',import.meta.url)),currentHash=()=>createHash('sha256').update(fs.readFileSync(sourcePath,'utf8').replace(/\r\n/g,'\n')).digest('hex');
export const rulesHash=currentHash();
export function grids(store){return Object.fromEntries(NAMES.map(name=>{const s=store.sheets.get(name);if(!s)return [name,null];const rows=s.getLastRow(),cols=Math.max(0,...[...s.cells.keys()].map(k=>Number(k.split(':')[1])));return [name,Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>s.cells.get((r+1)+':'+(c+1))??''))];}));}
export function project(data){if(currentHash()!==rulesHash)throw Error('P6_PROJECTION_RULES_CHANGED');const s=makeStore(data),lock=s.context.LockService.getScriptLock();lock.waitLock();try{s.context.mirrorChanged_({},data);if(currentHash()!==rulesHash)throw Error('P6_PROJECTION_RULES_CHANGED');return {version:1,rulesHash,tables:grids(s),trace:s.trace.map(x=>({type:x.type,name:x.name||null}))};}finally{lock.releaseLock();}}
