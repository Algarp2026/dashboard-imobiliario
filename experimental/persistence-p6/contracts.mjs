import {copy,canonical,commercialHash,legacyTextHash,fail,seal,check,hash,laboratory,validateData} from '../persistence-p5/contracts.mjs';
export {copy,canonical,commercialHash,legacyTextHash,fail,seal,check,hash,laboratory,validateData};
export const DEPENDENCIES={Clientes:['clients'],Eventos:['events'],Agentes:['agents'],EstadosVendas:['statuses','salePrices','unavailableReasons'],PrecosHistorico:['priceHistory'],VendasComissoes:['saleCommissions']};
export const NAMES=Object.keys(DEPENDENCIES);
export const authority=s=>Object.fromEntries(['sourceId','domainId','Store','StoreVersions','BackupsVersions','Manifests'].filter(k=>Object.hasOwn(s,k)).map(k=>[k,copy(s[k])]));
export const authorityHash=s=>commercialHash(authority(s));
export async function inputHash(data,name){return commercialHash(DEPENDENCIES[name].map(k=>Object.hasOwn(data,k)?{key:k,present:true,value:data[k]}:{key:k,present:false}));}
export function validTable(t){return Array.isArray(t)&&t.length>0&&Array.isArray(t[0])&&t[0].length>0&&t.every(r=>Array.isArray(r)&&r.length===t[0].length&&r.every(v=>typeof v==='string'||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)));}
export async function projection(project,data){const p=await project(copy(data));if(p?.version!==1||!hash(p.rulesHash)||!p.tables||NAMES.some(n=>!validTable(p.tables[n]))||Object.keys(p.tables).sort().join('|')!==NAMES.toSorted().join('|'))fail('P6_PROJECTION_UNVERIFIED');return p;}
export function diff(expected,actual){
 if(!Array.isArray(actual))return {rows:expected.length,columns:expected[0].length,zones:['sheet']};
 const rows=new Set(),cols=new Set(),zones=new Set();for(let r=0;r<Math.max(expected.length,actual.length);r++)for(let c=0;c<Math.max(expected[r]?.length||0,actual[r]?.length||0);c++)if(expected[r]?.[c]!==actual[r]?.[c]||typeof expected[r]?.[c]!==typeof actual[r]?.[c]){rows.add(r+1);cols.add(c+1);zones.add(r===0?'header':'body');}
 return {rows:rows.size,columns:cols.size,rowIndexes:[...rows],columnIndexes:[...cols],zones:[...zones]};
}
