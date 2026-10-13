const fs=require('node:fs');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
module.exports=function makeStore(data){
  const sheets=new Map(),trace=[],properties={CRM_API_CALLER_EMAIL:'owner@example.test',CRM_SPREADSHEET_ID:'test-sheet',CRM_ENVIRONMENT:'test'};
  let held=false,mirrorFailure='',caller='owner@example.test';
  function coordinates(key,column){
    if(typeof key==='number')return[key,column];
    const match=key.match(/^([A-Z]+)(\d+)/);return[Number(match[2]),match[1].split('').reduce((sum,c)=>sum*26+c.charCodeAt(0)-64,0)];
  }
  function sheet(name){
    if(!sheets.has(name))sheets.set(name,{cells:new Map(),rows:[],
      getRange(key,column){const [row,col]=coordinates(key,column),address=(r,c)=>r+':'+c,s=this;return{
        getValue(){if(name==='Store')trace.push({type:'read',key,held});return s.cells.get(address(row,col))??''},
        setValue(value){if(!held)throw new Error('Write without script lock');trace.push({type:'write',name,key,held});s.cells.set(address(row,col),value);return this},
        setValues(values){if(!held)throw new Error('Write without script lock');if(mirrorFailure===name)throw new Error('Simulated mirror failure');trace.push({type:'rows',name,key,held});values.forEach((line,i)=>line.forEach((value,j)=>s.cells.set(address(row+i,col+j),value)));s.rows.push(values);return this}
      }},
      getLastRow(){return this.rows.length},clearContents(){if(!held)throw new Error('Clear without script lock');this.rows=[];this.cells.clear()},setFrozenRows(){},appendRow(row){if(!held)throw new Error('Append without script lock');this.rows.push(row)}
    });return sheets.get(name);
  }
  const store=sheet('Store');store.cells.set('2:2',JSON.stringify(data));store.cells.set('3:2','2026-10-01T10:00:00.000Z');
  const context={
    console,
    PropertiesService:{getScriptProperties(){return{getProperty:key=>properties[key]||''}}},
    Session:{getEffectiveUser(){return{getEmail:()=>caller}}},
    Utilities:{DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest(algorithm,text){return [...createHash(algorithm).update(text).digest()].map(byte=>byte>127?byte-256:byte)}},
    SpreadsheetApp:{openById(id){if(id!==properties.CRM_SPREADSHEET_ID)throw new Error('Wrong sheet');return{getSheetByName:name=>sheets.get(name),insertSheet:sheet}},flush(){}},
    LockService:{getScriptLock(){return{waitLock(){if(held)throw new Error('Concurrent lock not serialized');held=true;trace.push({type:'lock'})},releaseLock(){held=false;trace.push({type:'unlock'})}}}},
    ContentService:{MimeType:{JSON:'json',JAVASCRIPT:'js'},createTextOutput(body){return{body,setMimeType(){return this}}}}
  };
  vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../../google_apps_script.gs'),'utf8'),context);
  return{context,sheets,trace,properties,get data(){return JSON.parse(store.cells.get('2:2'))},get revision(){return createHash('sha256').update(store.cells.get('2:2').trim()).digest('hex')},read(){return context.crmRead({sourceId:properties.CRM_SPREADSHEET_ID,environment:properties.CRM_ENVIRONMENT})},write(request){return context.crmWrite({...request,sourceId:properties.CRM_SPREADSHEET_ID,environment:properties.CRM_ENVIRONMENT})},recover(request){return context.crmRecover({...request,sourceId:properties.CRM_SPREADSHEET_ID,environment:properties.CRM_ENVIRONMENT})},failMirror(name){mirrorFailure=name},setCaller(value){caller=value}};
};
