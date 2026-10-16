'use strict';
module.exports=()=>Array.from({length:319},(_,index)=>{
  const own=index<39,n=own?index+1:index-38,abp=80+(index%9)*7,terrace=12+(index%5)*4;
  return{'Empreendimento':own?'The View':'Empreendimento fictício '+(1+Math.floor((index-39)/35)),'Fração':own?'Apartamento '+n:'Unidade simulada '+n,'Piso':String(1+Math.floor(index%39/7)),'Tipologia':['T1','T1+1','T2','T2+1','T3'][index%5],'Vista':1+index%4,'Orientação':['Sul/Este','Oeste','Este'][index%3],'ABP':abp,'Varanda/Terraço':terrace,'Área Total':abp+terrace,'PVP':450000+index*1500,'Preço Recomendado':470000+index*1600,'Garagem':'Estacionamento simulado '+n,'Status':'Disponível','Fonte':'Catálogo inteiramente fictício','URL':'https://example.invalid/unidade/'+n,'Ano Referência':2026,'Ano de entrega':2028,'Segmento':'Novo','Condição':'Em construção','Piscina':'Sim','Distância ao The View':own?0:2,'Peso comparável':1,'Camada compset':'Primário'};
});
