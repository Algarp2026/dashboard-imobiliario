import {copy,canonical,commercialHash,fail,seal,check,laboratory,NAMES,authorityHash,inputHash,projection,validTable,diff} from './contracts.mjs';
import {capture} from './snapshot.mjs';
import {readVersion,metrics} from '../persistence-p5/chain.mjs';
export async function mirrorEvidence(snapshot,projected,name,{candidate=false}={}){const data=candidate?snapshot.candidate?.data:snapshot.data;if(!data)fail('P6_NO_CANDIDATE');return seal({version:1,name,revision:candidate?snapshot.candidate.revision:snapshot.revision,ref:candidate?snapshot.candidate.ref:snapshot.proof.manifestRef||snapshot.authorityHash,kind:candidate?'PREPARED_VM':'OFFICIAL_VM',inputHash:await inputHash(data,name),projectionHash:await commercialHash(projected.tables[name]),rulesHash:projected.rulesHash,sourceId:snapshot.sourceId});}
export async function openMirrors({backend,sourceId,origin,synthetic=false,authorize,project}={}){
 laboratory(origin,synthetic);if(!backend?.labOnly||!backend.failureDomain||!/^fiction-(p3-p5-|p6-)/.test(sourceId)||typeof authorize!=='function'||typeof project!=='function')fail('P6_LAB_ONLY');
 let fault=null;const permits=new WeakMap();
 function principal(c,scope){const p=authorize(c);if(!p||p.sourceId!==sourceId||p.apiEpoch!==2||!p.scopes?.includes(scope))fail('P6_UNAUTHORIZED');}
 async function diagnose(c,{onCaptured=null}={}){
  principal(c,'mirror-read');const started=performance.now();let found;
  try{found=await capture(backend,sourceId,{onCaptured});}catch(e){return {status:e.code==='P6_SOURCE_CHANGED'?'SOURCE_CHANGED':'SOURCE_UNVERIFIED',reason:e.code||'READ_FAILURE',sheets:NAMES.map(name=>({name,status:'SOURCE_UNVERIFIED',rebuildable:false})),durationMs:performance.now()-started};}
  const {snapshot:s,state}=found,p=await projection(project,s.data),reports=[];
  for(const name of NAMES){const t=performance.now(),actual=state.Derived?.tables?.[name],expected=p.tables[name],zones=diff(expected,actual);let status='UNKNOWN',association=null;
   if(actual===undefined||actual===null)status='MISSING';else if(Array.isArray(actual)&&!actual.length)status='PARTIAL';else if(!validTable(actual))status='CORRUPT';else if(canonical(actual)===canonical(expected))status='CONSISTENT';else if(canonical(actual[0])!==canonical(expected[0]))status='CORRUPT';else if(actual.length<expected.length&&actual.every((r,i)=>canonical(r)===canonical(expected[i])))status='PARTIAL';
   else{const claim=state.Derived?.claims?.[name];if(claim)try{
    await check(claim,'version name revision ref kind inputHash projectionHash rulesHash sourceId');if(claim.version!==1||claim.sourceId!==sourceId||claim.name!==name||claim.rulesHash!==p.rulesHash||claim.projectionHash!==await commercialHash(actual))fail('P6_CLAIM');
    let data,reason;if(s.candidate&&claim.kind==='PREPARED_VM'&&claim.ref===s.candidate.ref&&claim.revision===s.candidate.revision){data=s.candidate.data;reason='AHEAD_OF_AUTHORITY';}
    else if(claim.kind==='OFFICIAL_VM'){const h=s.history.find(h=>h.revision===claim.revision&&h.ref===claim.ref);if(h){data=JSON.parse(await readVersion(s.image,h.version,metrics()));reason='STALE';}}
    if(data&&claim.inputHash===await inputHash(data,name)&&canonical((await projection(project,data)).tables[name])===canonical(actual)){status=reason;association={kind:claim.kind,comparisonRevision:claim.revision,ref:claim.ref};}
   }catch{association=null;}}
   reports.push({name,status,officialRevision:s.revision,snapshotHash:s.authorityHash,mirrorRevision:null,association,affected:zones,rebuildable:true,blockedBy:s.pending.state==='NONE'||s.pending.state==='COMMITTED'?null:'PENDING_MAINTENANCE_AUTHORIZATION_REQUIRED',durationMs:performance.now()-t});
  }
  const after=await backend.load();if(after.generation!==state.generation)return {status:'SOURCE_CHANGED',sheets:reports.map(r=>({...r,status:'UNKNOWN',rebuildable:false})),durationMs:performance.now()-started};
  return {status:reports.every(r=>r.status==='CONSISTENT')?'CONSISTENT':'DIVERGENT',sourceId,officialRevision:s.revision,snapshotHash:s.authorityHash,format:s.format,pending:s.pending.state,lockHeld:!!state.lockOwner,sheets:reports,durationMs:performance.now()-started};
 }
 async function plan(c){principal(c,'mirror-read');const {snapshot:s,state}=await capture(backend,sourceId),p=await projection(project,s.data),names=NAMES.filter(n=>canonical(state.Derived?.tables?.[n]??null)!==canonical(p.tables[n]));return seal({version:1,kind:'P6_REPAIR_PLAN',sourceId,authorityHash:s.authorityHash,revision:s.revision,rulesHash:p.rulesHash,derivedHash:await commercialHash(state.Derived||null),pendingHash:await commercialHash(s.image.Store.B5||null),pendingState:s.pending.state,names,expected:Object.fromEntries(names.map(n=>[n,p.tables[n]])),estimated:{reads:2+names.length*3,writes:names.length*2},risks:['No cross-sheet atomicity','No commercial confirmation','Pending original remains protected'],blockers:[...(state.lockOwner?['LOCK_HELD']:[]),...(!['NONE','COMMITTED'].includes(s.pending.state)?['PENDING_AUTHORIZATION_REQUIRED']:[])]});}
 async function validatePlan(p){await check(p,'version kind sourceId authorityHash revision rulesHash derivedHash pendingHash pendingState names expected estimated risks blockers');if(p.version!==1||p.kind!=='P6_REPAIR_PLAN'||p.sourceId!==sourceId||!Array.isArray(p.names)||new Set(p.names).size!==p.names.length||p.names.some(n=>!NAMES.includes(n)))fail('P6_PLAN');}
 async function authorizePending(c,p){principal(c,'pending-maintenance');await validatePlan(p);const {snapshot:s}=await capture(backend,sourceId);if(s.authorityHash!==p.authorityHash||s.pending.state!=='PENDING')fail('P6_PENDING_NOT_AUTHORIZABLE');const token=Object.freeze({});permits.set(token,{credential:c,planHash:p.integrity,authorityHash:p.authorityHash});return token;}
 async function execute(c,p,{pendingPermit=null,onStage=null}={}){
  principal(c,'repair');await validatePlan(p);const mode=fault;fault=null;let owner=null,crashed=false,completed=[];
  const first=await capture(backend,sourceId),s=first.snapshot,projected=await projection(project,s.data);
  if(s.authorityHash!==p.authorityHash||s.revision!==p.revision||projected.rulesHash!==p.rulesHash)fail('P6_STALE_PLAN');
  if(p.names.some(n=>canonical(p.expected[n])!==canonical(projected.tables[n])))fail('P6_PLAN_PROJECTION');
  const permit=permits.get(pendingPermit);if(!['NONE','COMMITTED'].includes(s.pending.state)&&!(s.pending.state==='PENDING'&&permit?.credential===c&&permit.planHash===p.integrity&&permit.authorityHash===s.authorityHash))fail('P6_PENDING_BLOCKED');
  if(first.state.lockOwner)fail('P6_LOCK_HELD');
  if(!p.names.length)return {status:'ALREADY_CONSISTENT',writes:0,commercialConfirmed:false};
  if(first.state.Derived?.journal?.some(j=>j.planHash===p.integrity&&j.status==='COMPLETE')&&p.names.every(n=>canonical(first.state.Derived.tables[n])===canonical(projected.tables[n])))return {status:'ALREADY_CONSISTENT',writes:0,commercialConfirmed:false};
  if(await commercialHash(first.state.Derived||null)!==p.derivedHash)fail('P6_STALE_PLAN');
  owner='p6-repair-'+crypto.randomUUID();const acquired=copy(first.state),g=acquired.generation;if(g>=Number.MAX_SAFE_INTEGER)fail('P6_GENERATION_EXHAUSTED');acquired.lockOwner=owner;acquired.generation++;await backend.compareExchange(g,acquired);
  async function change(fn){principal(c,'repair');const x=await backend.load();if(x.lockOwner!==owner)fail('P6_LOCK_LOST');if(await authorityHash(x)!==p.authorityHash)fail('P6_SOURCE_CHANGED');const gen=x.generation;if(gen>=Number.MAX_SAFE_INTEGER)fail('P6_GENERATION_EXHAUSTED');x.Derived ||= {version:1,tables:{},claims:{},journal:[]};if(x.Derived.version!==1||!Array.isArray(x.Derived.journal))fail('P6_UNKNOWN_DERIVED_FORMAT');await fn(x.Derived);x.generation++;await backend.compareExchange(gen,x);}
  async function stage(name){if(onStage)await onStage(name);if(mode===name)fail('P6_INJECTED_INTERRUPTION');if(mode==='crash:'+name){crashed=true;fail('P6_SIMULATED_CRASH');}}
  try{
   await change(d=>d.journal.push({planHash:p.integrity,status:'RUNNING',sheets:[],authorityHash:p.authorityHash}));
   for(const name of p.names){
    await change(d=>{d.tables[name]=[];delete d.claims[name];});await stage('after-clear:'+name);
    const evidence=await mirrorEvidence(s,projected,name);await change(d=>{d.tables[name]=copy(projected.tables[name]);d.claims[name]=evidence;});
    const read=await backend.load();if(canonical(read.Derived.tables[name])!==canonical(projected.tables[name])||await authorityHash(read)!==p.authorityHash)fail('P6_REPAIR_UNVERIFIED');completed.push(name);await stage('after-write:'+name);
   }
   await change(d=>{const j=d.journal.findLast(j=>j.planHash===p.integrity);j.status='COMPLETE';j.sheets=[...completed];});const final=await backend.load();if(await authorityHash(final)!==p.authorityHash||p.names.some(n=>canonical(final.Derived.tables[n])!==canonical(projected.tables[n])))fail('P6_SOURCE_CHANGED');return {status:'REPAIRED',sheets:completed,writes:p.names.length*2,commercialConfirmed:false};
  }catch(e){try{await change(d=>{const j=d.journal.findLast(j=>j.planHash===p.integrity);if(j){j.status='PARTIAL';j.sheets=[...completed];j.reason=e.code||'STORAGE_FAILURE';}});}catch{}return {status:'PARTIAL',reason:e.code||'STORAGE_FAILURE',sheets:completed,commercialConfirmed:false};}
  finally{if(!crashed){const end=await backend.load();if(end.lockOwner===owner){const gen=end.generation;if(gen>=Number.MAX_SAFE_INTEGER)fail('P6_GENERATION_EXHAUSTED');end.lockOwner=null;end.generation++;await backend.compareExchange(gen,end);}}}
 }
 return Object.freeze({diagnose,plan,execute,authorizePending,setFault:mode=>{fault=mode;}});
}
