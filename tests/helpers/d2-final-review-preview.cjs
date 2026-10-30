'use strict';
const key=require.resolve('./d2-synthetic-catalog.cjs'),original=require(key);
require.cache[key].exports=()=>{
 const rows=original(),sample=rows[40];
 return rows.concat(Array.from({length:216},(_,i)=>({...sample,Empreendimento:'BelaFormosa',Fração:'Unidade fictícia '+(i+1),Piso:String(1+i%7),Tipologia:['T1','T2','T3'][i%3],PVP:350000+i*1000,'Preço Recomendado':360000+i*1000,'Vista':null,'Vista mínima':2,'Vista máxima':3,'Confiança vista':i%7<2?'Baixa':'Média','Localidade':'Olhão','Fonte':'Catálogo fictício para revisão visual',URL:'https://example.invalid/belaformosa/'+(i+1)})));
};
process.env.D2_SYNTHETIC_CATALOG='true';
process.env.AUTO_SYNC_TESTS='true';process.env.LOADING_PERSISTENCE_TESTS='true';
require('./visual-workspace-preview.cjs');
