'use strict';
// Test reference model only; served by the isolated P1 runner, never by the app.
if(location.hostname!=='127.0.0.1')throw Error('P1 requires isolated loopback');
window.P1Lab=(()=>{
  let db;
  const names=['workspace','bodies','operations','branches','legacy','migration'];
  const canonical=v=>Array.isArray(v)?'['+v.map(canonical).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
  const digest=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const hash=value=>digest(new TextEncoder().encode(typeof value==='string'?value:canonical(value)));
  function open(){return new Promise((resolve,reject)=>{
    const r=indexedDB.open('the-view-p1-fiction-only',1);
    r.onupgradeneeded=()=>{for(const name of names)r.result.createObjectStore(name,{keyPath:'id'});};
    r.onerror=()=>reject(r.error);r.onsuccess=()=>{db=r.result;db.onversionchange=()=>db.close();resolve(true);};
  });}
  function tx(stores,mode,action){return new Promise((resolve,reject)=>{
    let value,error;const t=db.transaction(stores,mode,mode==='readwrite'?{durability:'strict'}:undefined);
    t.oncomplete=()=>resolve(value);t.onabort=()=>reject(error||t.error||new DOMException('Abort','AbortError'));
    t.onerror=e=>{e.preventDefault();error ||= e.target.error;try{t.abort();}catch{}};
    try{action(t,v=>value=v,e=>{error=e;t.abort();});}catch(e){error=e;t.abort();}
  });}
  function snapshot(){return tx(names,'readonly',(t,done)=>{
    const result={};let left=names.length;
    for(const name of names){const r=t.objectStore(name).getAll();r.onsuccess=()=>{result[name]=r.result;if(!--left)done(result);};}
  });}
  async function seed(base){const ref=await hash(base);return tx(['workspace','bodies'],'readwrite',(t,done)=>{
    t.objectStore('bodies').put({id:ref,data:base});t.objectStore('workspace').put({id:'head',localRevision:0,baseRef:ref,dataRef:ref});done(true);
  });}
  async function prepare(id,base,data,expected){return {id,base,data,baseRef:await hash(base),dataRef:await hash(data),requestHash:await hash({requestId:id,baseRevision:await hash(base),data}),expected};}
  function propose(p){return tx(['workspace','bodies','operations','branches'],'readwrite',(t,done,fail)=>{
    const ops=t.objectStore('operations'),existing=ops.get(p.id);
    existing.onsuccess=()=>{
      if(existing.result){if(existing.result.requestHash!==p.requestHash)fail(Error('IMMUTABLE_REQUEST_ID'));else done({replay:true});return;}
      const w=t.objectStore('workspace'),r=w.get('head');r.onsuccess=()=>{
        const head=r.result,branch=head.localRevision!==p.expected;
        t.objectStore('bodies').put({id:p.baseRef,data:p.base});t.objectStore('bodies').put({id:p.dataRef,data:p.data});
        ops.put({id:p.id,baseRef:p.baseRef,dataRef:p.dataRef,requestHash:p.requestHash,phase:'LOCAL_DURABLE'});
        if(branch)t.objectStore('branches').put({id:p.id,expected:p.expected,observed:head.localRevision});
        else w.put({...head,localRevision:head.localRevision+1,dataRef:p.dataRef});
        done({branch});
      };
    };
  });}
  async function exportOp(id){
    const s=await snapshot(),op=s.operations.find(x=>x.id===id),base=s.bodies.find(x=>x.id===op?.baseRef)?.data,data=s.bodies.find(x=>x.id===op?.dataRef)?.data;
    if(!op||!base||!data)return {kind:'forensic',available:s};
    if(await hash(base)!==op.baseRef||await hash(data)!==op.dataRef||await hash({requestId:id,baseRevision:op.baseRef,data})!==op.requestHash)return {kind:'forensic',available:s};
    return {kind:'recoverable',base,data,requestId:id,baseRevision:op.baseRef};
  }
  function abort(kind='AbortError'){return tx(['workspace','bodies','migration'],'readwrite',(t,done,fail)=>{
    t.objectStore('workspace').put({id:'head',localRevision:99999});t.objectStore('bodies').put({id:'uncommitted',bytes:new Uint8Array(10)});t.objectStore('migration').put({id:'uncommitted',phase:'ACTIVATED'});fail(new DOMException('Injected test failure',kind));
  });}
  function addLegacy(id,bytes){return tx(['legacy'],'readwrite',(t,done)=>{t.objectStore('legacy').put({id,bytes,protected:true});done(true);});}
  async function migrate(id){
    const original=(await snapshot()).legacy.find(x=>x.id===id),bytes=original.bytes,encoded=new Uint8Array(bytes.length*2);
    for(let i=0;i<bytes.length;i++){const unit=bytes.charCodeAt(i);encoded[i*2]=unit&255;encoded[i*2+1]=unit>>>8;}
    const rawHash=await digest(encoded);
    return tx(['legacy','bodies','migration'],'readwrite',(t,done,fail)=>{
      const r=t.objectStore('legacy').get(id);r.onsuccess=()=>{
        if(r.result.bytes!==bytes){fail(Error('MIGRATION_STALE'));return;}
        t.objectStore('bodies').put({id:'opaque:'+rawHash,bytes,protected:true});t.objectStore('migration').put({id,rawHash,phase:'VERIFIED',cursor:1});done(true);
      };
    });
  }
  async function measure(data,iterations){
    const samples=[];
    for(let i=0;i<iterations;i++){
      data.syntheticBenchmarkIteration=i;
      let start=performance.now();const raw=canonical(data),bytes=new TextEncoder().encode(raw),serializationMs=performance.now()-start;
      start=performance.now();const ref=await digest(bytes),hashingMs=performance.now()-start;
      let compressionMs=null,packedBytes=null,roundtripVerified=false;
      if(typeof CompressionStream==='function'&&typeof DecompressionStream==='function'){
        start=performance.now();const packed=await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();compressionMs=performance.now()-start;packedBytes=packed.byteLength;
        const restored=await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).text();if(restored!==raw)throw Error('COMPRESSION_ROUNDTRIP');roundtripVerified=true;
      }
      start=performance.now();let durability;
      await tx(['workspace','bodies'],'readwrite',(t,done)=>{
        durability=t.durability;t.objectStore('bodies').put({id:'benchmark:'+ref,bytes});t.objectStore('workspace').put({id:'benchmark',localRevision:i,dataRef:'benchmark:'+ref});done(true);
      });
      const transactionMs=performance.now()-start;
      start=performance.now();const readback=await tx(['bodies'],'readonly',(t,done)=>{const r=t.objectStore('bodies').get('benchmark:'+ref);r.onsuccess=()=>done(r.result.bytes);});
      if(await digest(readback)!==ref)throw Error('READBACK_HASH');
      samples.push({serializationMs,hashingMs,compressionMs,transactionMs,verificationMs:performance.now()-start,payloadBytes:bytes.byteLength,packedBytes,roundtripVerified,durability});
    }
    return samples;
  }
  return {open,seed,prepare,propose,snapshot,exportOp,abort,addLegacy,migrate,measure,hash};
})();
