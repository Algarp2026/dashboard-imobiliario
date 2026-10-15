(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./commercial-client-preferences.js'));
  else root.THE_VIEW_FRACTION_RECOMMENDATIONS=factory(root.THE_VIEW_CLIENT_PREFERENCES);
})(typeof globalThis==='object'?globalThis:this,function(preferences){
  'use strict';
  const adjacent={T1:'T1+1','T1+1':'T1',T2:'T2+1','T2+1':'T2'};
  const norm=value=>String(value??'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const positive=value=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):0;
  const cents=value=>Math.round(value*100);
  const money=value=>new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(value);
  function typology(value){return preferences.options.typology.find(type=>norm(type).replace(/[-\s]/g,'')===norm(value).replace(/[-\s]/g,''))||''}
  function profile(client){
    const d=preferences.draft(client),explicitMax=Object.hasOwn(client,'budgetMax');
    const max=positive(explicitMax?client.budgetMax:client.budget),min=positive(client.budgetMin);
    const invalid=['budgetMin',explicitMax?'budgetMax':'budget'].some(key=>client[key]!==undefined&&client[key]!==null&&client[key]!==''&&(!Number.isFinite(Number(client[key]))||Number(client[key])<0));
    const unsupported=[client.preferences,client.manualPreferences].some(p=>p?.selectionV1&&p.selectionV1.version!==1);
    const ambiguous=Object.values(d.choices).some(choice=>choice.state==='legacy');
    const expressed=Object.values(d.choices).some(choice=>['selected','indifferent'].includes(choice.state));
    const known=!unsupported&&!invalid&&!ambiguous&&(!max||min<=max)&&(expressed||min>0||max>0);
    return{choices:d.choices,min,max,maxSource:max?(explicitMax?'declared':'legacy'):'none',alternativeMax:max?(explicitMax?Math.floor(cents(max)*105/100)/100:max):null,known,message:unsupported?'Versão das preferências não reconhecida. Consulte as frações manualmente.':invalid||max&&min>max?'Reveja o intervalo de investimento antes de recomendar frações.':ambiguous?'Existem preferências antigas ambíguas. Confirme-as em Preferências; a consulta manual continua disponível.':!known?'Registe as preferências do cliente para identificar frações compatíveis. Pode consultar todas as frações manualmente.':''};
  }
  function evaluate(client,fractions){
    const p=profile(client),main=[],alternatives=[];
    if(!p.known)return{profile:p,main,alternatives};
    for(const f of fractions){
      const price=positive(f.currentPrice),type=typology(f.typology);
      if(f.priceConfirmed!==true||f.statusConfirmed!==true||f.status!=='Disponível'||!price||!type||p.min&&cents(price)<cents(p.min)||p.max&&cents(price)>cents(p.alternativeMax))continue;
      const typeChoice=p.choices.typology,typeExact=typeChoice.state!=='selected'||typeChoice.values.includes(type);
      const near=typeChoice.state==='selected'&&typeChoice.values.some(value=>adjacent[value]===type);
      if(!typeExact&&!near)continue;
      const reasons=[],differences=[];
      if(typeChoice.state==='selected'){
        if(typeExact)reasons.push('Tipologia pretendida');
        else differences.push(`Alternativa ${type} para ${typeChoice.values.filter(value=>adjacent[value]===type).join(' ou ')}`);
      }
      const over=p.max&&cents(price)>cents(p.max)?(cents(price)-cents(p.max))/100:0;
      if(over)differences.push(`${money(over)} acima do orçamento (+${new Intl.NumberFormat('pt-PT',{maximumFractionDigits:1}).format(over/p.max*100)}%)`);
      else if(p.min||p.max)reasons.push('Dentro do investimento indicado');
      const floorKnown=f.floor!==null&&f.floor!==undefined&&/^-?\d+$/.test(String(f.floor))&&Number.isInteger(Number(f.floor));
      const floorMatch=p.choices.floor.state!=='selected'||floorKnown&&p.choices.floor.values.includes(String(Number(f.floor)));
      if(p.choices.floor.state==='selected')floorMatch?reasons.push('Piso preferido'):differences.push(floorKnown?'Piso diferente do pretendido':'Piso não confirmado');
      const directions=norm(f.orientation).split(/[\s/,;|]+/).filter(value=>['sul','este','oeste'].includes(value));
      const orientationMatch=p.choices.orientation.state!=='selected'||p.choices.orientation.values.some(value=>directions.includes(norm(value)));
      if(p.choices.orientation.state==='selected')orientationMatch?reasons.push('Orientação preferida'):differences.push(directions.length?'Orientação diferente da preferida':'Orientação não confirmada');
      const row={...f,group:differences.length?'alternative':'main',reasons,differences,overBudgetAmount:over,overBudgetPercent:over?over/p.max*100:0,typeExact,preferenceScore:Number(p.choices.floor.state==='selected'&&floorMatch)+Number(p.choices.orientation.state==='selected'&&orientationMatch),explanation:[...reasons,...differences].join(' · ')||'Disponível; cumpre os critérios informados'};
      (row.group==='main'?main:alternatives).push(row);
    }
    // Lexicographic priorities, with stable price/number tie-breakers; no generated scores or prose.
    const rank=(a,b)=>Number(b.typeExact)-Number(a.typeExact)||Number(a.overBudgetAmount>0)-Number(b.overBudgetAmount>0)||b.preferenceScore-a.preferenceScore||a.differences.length-b.differences.length||a.currentPrice-b.currentPrice||a.number-b.number;
    return{profile:p,main:main.sort(rank),alternatives:alternatives.sort(rank)};
  }
  function filter(result,mode='all'){
    const rows=[...result.main,...result.alternatives];
    return mode==='main'?result.main:mode==='alternatives'?result.alternatives:mode==='within'?(result.profile.min||result.profile.max?rows.filter(row=>!row.overBudgetAmount):[]):mode==='plus5'?rows.filter(row=>row.overBudgetAmount>0):rows;
  }
  function search(fractions,query){
    let remaining=norm(query);const unit=remaining.match(/\b(?:apt\.?|apartamento|fracao)\s*0*(\d+)\b/),floor=remaining.match(/\bpiso\s*(-?\d+)\b/),numberOnly=/^\d+$/.test(remaining)?Number(remaining):null;
    if(unit)remaining=remaining.replace(unit[0],'');if(floor)remaining=remaining.replace(floor[0],'');if(numberOnly!==null)remaining='';
    const tokens=remaining.replace(/-/g,' ').split(/\s+/).filter(Boolean);
    return fractions.filter(f=>(!unit||f.number===Number(unit[1]))&&(numberOnly===null||f.number===numberOnly)&&(!floor||f.floor!==null&&f.floor!==undefined&&Number(f.floor)===Number(floor[1]))&&tokens.every(token=>norm([`Apt. ${f.number}`,f.typology,`Piso ${f.floorLabel??f.floor??''}`,f.orientation].join(' ')).replace(/-/g,' ').includes(token))).slice().sort((a,b)=>a.number-b.number);
  }
  return{profile,evaluate,filter,search,typology};
});
