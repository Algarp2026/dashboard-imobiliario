export async function recoveryCopies(page,key='theView.crmCommercial.v2'){
  return page.evaluate(async key=>{
    const db=await new Promise((resolve,reject)=>{const request=indexedDB.open(key+'.recovery.v1',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
    try{
      if(!db.objectStoreNames.contains('copies'))return [];
      return await new Promise((resolve,reject)=>{const request=db.transaction('copies','readonly').objectStore('copies').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});
    }finally{db.close()}
  },key);
}
export async function hasArchivedPending(page,raw){
  return (await recoveryCopies(page)).some(record=>{const value=JSON.parse(record.raw);return JSON.stringify(value.pendingWrite)===JSON.stringify(JSON.parse(raw))});
}
