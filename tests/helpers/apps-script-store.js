const fs=require('node:fs');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
module.exports=function makeStore(data){
  const sheets=new Map(),trace=[],properties={CRM_API_CALLER_EMAIL:'owner@example.test',CRM_SPREADSHEET_ID:'test-sheet',CRM_ENVIRONMENT:'test',CRM_API_WRITES_ENABLED:'true'};
  let held=false,mirrorFailure='',writeFailure='',caller='owner@example.test';
  function coordinates(key,column){
    if(typeof key==='number')return[key,column];
    const match=key.match(/^([A-Z]+)(\d+)/);return[Number(match[2]),match[1].split('').reduce((sum,c)=>sum*26+c.charCodeAt(0)-64,0)];
  }
  function sheet(name){
    if(!sheets.has(name))sheets.set(name,{cells:new Map(),rows:[],maxRows:1000,
      getMaxRows(){return this.maxRows},
      insertRowsAfter(after,count){if(!held||after!==this.maxRows)throw new Error('Invalid row extension');this.maxRows+=count;return this},
      getRange(key,column,height=1,width=1){const [row,col]=coordinates(key,column),address=(r,c)=>r+':'+c,s=this;return{
        getValue(){if(name==='Store')trace.push({type:'read',key,held});return s.cells.get(address(row,col))??''},
        getValues(){trace.push({type:'read',name,key,held});return Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>s.cells.get(address(row+i,col+j))??''))},
        setValue(value){if(!held)throw new Error('Write without script lock');if(String(value).length>50000)throw new Error('Cell capacity exceeded');if(name==='Store'&&key==='B6'&&writeFailure==='pointer-before')throw new Error('Pointer failure');trace.push({type:'write',name,key,held});s.cells.set(address(row,col),value);if(name==='Store'&&key==='B6'&&writeFailure==='pointer-after')throw new Error('Lost commit acknowledgement');return this},
        setValues(values){
          if(!held)throw new Error('Write without script lock');
          if(values.some(line=>line.some(value=>String(value).length>50000)))throw new Error('Cell capacity exceeded');
          if(name==='StoreVersions'&&writeFailure==='chunks-before')throw new Error('Chunk write failure');
          if(name==='StoreVersions'&&writeFailure==='chunks-partial'){s.cells.set(address(row,col),values[0][0]);throw new Error('Partial chunk write');}
          if(mirrorFailure===name||name==='Backups'&&writeFailure==='backup-header'||name==='Store'&&writeFailure==='store-before')throw new Error('Simulated write failure');
          trace.push({type:'rows',name,key,held});
          values.forEach((line,i)=>line.forEach((value,j)=>{if(!(name==='Store'&&writeFailure==='store-json-only'&&row+i===3&&col+j===2))s.cells.set(address(row+i,col+j),value)}));s.rows.push(values);
          if(name==='StoreVersions'&&writeFailure==='chunks-corrupt')s.cells.set(address(row,col+2),':corrupted');
          if(name==='Store'&&['store-after','store-json-only'].includes(writeFailure))throw new Error('Simulated failure after applying Store');
          return this;
        }
      }},
      getLastRow(){return Math.max(0,...[...this.cells.keys()].map(key=>Number(key.split(':')[0])))},
      clearContents(){if(!held)throw new Error('Clear without script lock');this.rows=[];this.cells.clear()},setFrozenRows(){},
      appendRow(row){
        if(!held)throw new Error('Append without script lock');
        if(row.some(value=>String(value).length>50000))throw new Error('Cell capacity exceeded');
        if(name==='BackupsVersions'&&writeFailure==='archive-before')throw new Error('Backup failure');
        if(name==='Backups'&&writeFailure==='backup-before')throw new Error('Simulated backup failure');
        const number=this.getLastRow()+1;row.forEach((value,column)=>this.cells.set(number+':'+(column+1),value));this.rows.push(row);trace.push({type:'append',name,held});
        if(name==='BackupsVersions'&&writeFailure==='archive-after')throw new Error('Backup acknowledgement lost');
        if(name==='Backups'&&writeFailure==='backup-after')throw new Error('Simulated failure after appending backup');
      }
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
  return{context,sheets,trace,properties,get data(){return JSON.parse(JSON.stringify(context.crmRead({sourceId:properties.CRM_SPREADSHEET_ID,environment:properties.CRM_ENVIRONMENT}).data))},get revision(){return context.crmRead({sourceId:properties.CRM_SPREADSHEET_ID,environment:properties.CRM_ENVIRONMENT}).revision},read(){return context.crmRead({sourceId:properties.CRM_SPREADSHEET_ID,environment:properties.CRM_ENVIRONMENT})},write(request){return context.crmWrite({...request,sourceId:properties.CRM_SPREADSHEET_ID,environment:properties.CRM_ENVIRONMENT})},recover(request){return context.crmRecover({...request,sourceId:properties.CRM_SPREADSHEET_ID,environment:properties.CRM_ENVIRONMENT})},failMirror(name){mirrorFailure=name},failWrite(name){writeFailure=name},setCaller(value){caller=value}};
};
