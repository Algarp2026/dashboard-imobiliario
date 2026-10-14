(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.THE_VIEW_CLIENT_PREFERENCES=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const options={typology:['T1','T1+1','T1-Duplex','T2','T2+1','T3'],floor:['1','2','3','4','5','6'],orientation:['Sul','Este','Oeste']};
  const objectives=['Habitação própria','Segunda habitação / férias','Investimento','Ainda não definido'];
  const deadlines=['Imediato','Até 3 meses','Entre 3 e 6 meses','Mais de 6 meses','Indefinido'];
  const keys=['typology','floor','orientation','objective','decisionTime','summary'];
  const text=value=>typeof value==='string'?value.trim():'';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function projection(choice){
    if(choice.state==='indifferent')return'Indiferente';
    if(choice.state==='legacy')return choice.legacyText;
    return choice.state==='selected'?choice.values.map(value=>value==='T1-Duplex'?'T1 Duplex':value).join(' ou '):'';
  }
  function fromLegacy(key,value){
    if(value!==undefined&&value!==null&&typeof value!=='string'&&typeof value!=='number')return{state:'legacy',values:[],legacyText:JSON.stringify(value)};
    const raw=typeof value==='number'?String(value):text(value);
    if(!raw)return{state:'unreported',values:[]};
    if(raw.toLowerCase()==='indiferente')return{state:'indifferent',values:[]};
    const tokens=raw.split(/\s+(?:ou|e)\s+|[,;/|]+/i).map(token=>token.trim());
    const selected=tokens.map(token=>options[key].find(option=>option.toLowerCase()===token.toLowerCase()||key==='typology'&&option==='T1-Duplex'&&/^t1\s+duplex$/i.test(token)));
    if(selected.every(Boolean))return{state:'selected',values:options[key].filter(option=>selected.includes(option))};
    return{state:'legacy',values:[],legacyText:raw};
  }
  function choice(key,preferences){
    const stored=preferences.selectionV1?.[key];
    if(stored&&['unreported','indifferent','selected','legacy'].includes(stored.state)&&Array.isArray(stored.values)&&stored.values.every(value=>options[key].includes(value))&&(stored.state!=='selected'||stored.values.length)&&projection(stored)===text(preferences[key]))return copy(stored);
    return fromLegacy(key,preferences[key]);
  }
  function draft(client){
    const preferences={...(client.manualPreferences||{}),...(client.preferences||{})};
    return{choices:Object.fromEntries(Object.keys(options).map(key=>[key,choice(key,preferences)])),objective:text(preferences.objective),decisionTime:text(preferences.decisionTime),summary:text(preferences.summary),budgetMin:Number(client.budgetMin)||0,budgetMax:Number(client.budgetMax)||0};
  }
  function toggle(key,current,value){
    if(value==='Indiferente')return current.state==='indifferent'?{state:'unreported',values:[]}:{state:'indifferent',values:[]};
    if(!options[key].includes(value))return copy(current);
    const values=current.state==='selected'?current.values:[];
    const next=values.includes(value)?values.filter(item=>item!==value):[...values,value];
    return{state:next.length?'selected':'unreported',values:options[key].filter(option=>next.includes(option))};
  }
  function buildUpdate(client,values){
    const original=draft(client);
    if(same(original,values))return null;
    if(!Number.isFinite(values.budgetMin)||!Number.isFinite(values.budgetMax)||values.budgetMin<0||values.budgetMax<0||values.budgetMin&&values.budgetMax&&values.budgetMin>values.budgetMax)throw new Error('INVALID_INVESTMENT');
    const current=client.preferences||{},manual=client.manualPreferences||{},known=Object.fromEntries(keys.map(key=>[key,text(current[key]??manual[key])]));
    if([current,manual].some(preferences=>preferences.selectionV1&&preferences.selectionV1.version!==1))throw new Error('UNSUPPORTED_PREFERENCE_VERSION');
    const legacyText={...(current.legacyText||{})};
    for(const key of Object.keys(options)){
      const selected=values.choices[key];
      if(!selected||!['selected','indifferent','unreported','legacy'].includes(selected.state)||!Array.isArray(selected.values)||selected.values.some(value=>!options[key].includes(value))||selected.state==='selected'&&!selected.values.length||selected.state!=='selected'&&selected.values.length||selected.state==='legacy'&&typeof selected.legacyText!=='string')throw new Error('INVALID_SELECTION');
      known[key]=same(original.choices[key],selected)?(current[key]??manual[key]??''):projection(selected);
    }
    for(const key of ['objective','decisionTime','summary'])known[key]=original[key]===values[key]?(current[key]??manual[key]??''):text(values[key]);
    for(const key of keys){
      const previous=current[key]??manual[key];
      if(known[key]!==previous&&previous!==undefined&&!Object.hasOwn(legacyText,key))legacyText[key]=copy(previous);
    }
    const selectionV1={...(current.selectionV1||{}),version:1};
    for(const key of Object.keys(options))selectionV1[key]={...(current.selectionV1?.[key]||{}),...copy(values.choices[key])};
    const metadata={selectionV1,...(Object.keys(legacyText).length?{legacyText}:{})};
    const manualSelection={...(manual.selectionV1||{}),...selectionV1};
    for(const key of Object.keys(options))manualSelection[key]={...(manual.selectionV1?.[key]||{}),...selectionV1[key]};
    const result={...client,preferences:{...current,...known,...metadata},manualPreferences:{...manual,...known,...metadata,selectionV1:manualSelection,...(Object.keys(legacyText).length||manual.legacyText?{legacyText:{...(manual.legacyText||{}),...legacyText}}:{})},preferencesManuallyEdited:true};
    for(const key of ['budgetMin','budgetMax'])if(original[key]!==values[key])result[key]=values[key];
    return result;
  }
  return{options,objectives,deadlines,keys,projection,fromLegacy,choice,draft,toggle,buildUpdate};
});
