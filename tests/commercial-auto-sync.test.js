'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../commercial.js'),'utf8');
const factory=vm.runInNewContext('('+source.slice(source.indexOf('function createCommercialAutoSync('),source.indexOf('function createCommercialDraftGuard('))+')');
const revision='a'.repeat(64),other='b'.repeat(64);
function fixture(options={}){
  let now=0,visible=true,ready=true,fault=null,reads=0,hold=null;const timers=new Map(),messages=[];let next=0;
  const channel={postMessage:m=>messages.push(m),close(){}};
  const scheduler=factory({now:()=>now,setTimer:(fn,delay)=>{const id=++next;timers.set(id,{fn,at:now+delay,delay});return id},clearTimer:id=>timers.delete(id),random:()=>.5,visible:()=>visible,ready:()=>ready,revision:()=>revision,channel,
    read:async()=>{reads++;if(fault)throw fault;if(hold)await hold;now+=options.readMs||0;return{revision}},...options});
  async function advance(ms){const end=now+ms;for(;;){const first=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!first||first[1].at>end)break;timers.delete(first[0]);now=first[1].at;await first[1].fn()}now=Math.max(now,end)}
  return{scheduler,timers,messages,channel,advance,get now(){return now},get reads(){return reads},set visible(v){visible=v},set ready(v){ready=v},set fault(v){fault=v},set hold(v){hold=v}};
}
(async()=>{
  let cases=0;
  const f=fixture();f.scheduler.start();assert.equal(f.reads,0);await f.advance(60000);assert.equal(f.reads,2);assert.ok(f.messages.every(m=>Object.keys(m).sort().join(',')==='at,revision,type'));cases++;
  f.visible=false;await f.scheduler.wake('visibility');const before=f.reads;await f.advance(600000);assert.equal(f.reads,before);assert.equal(f.timers.size,0);f.visible=true;await f.scheduler.wake('visibility');assert.equal(f.reads,before+1);cases++;
  const count=f.reads;await Promise.all(Array.from({length:40},()=>f.scheduler.wake('focus')));assert.equal(f.reads,count);assert.equal(f.timers.size,1);await f.advance(10000);assert.equal(f.reads,count+1);cases++;
  let release;const g=fixture();g.scheduler.start();g.hold=new Promise(r=>release=r);const first=g.scheduler.check();await g.scheduler.check();assert.equal(g.reads,1);release();await first;assert.ok(g.scheduler.metrics.coalesced>0);cases++;
  const h=fixture();h.scheduler.start();h.fault={httpStatus:503};await h.advance(30000);assert.equal([...h.timers.values()][0].delay,60000);await h.advance(60000);assert.equal([...h.timers.values()][0].delay,120000);await h.advance(120000);await h.advance(240000);assert.equal([...h.timers.values()][0].delay,300000);h.fault=null;await h.scheduler.wake('online');await h.advance(10000);assert.equal([...h.timers.values()][0].delay,30000);cases++;
  const auth=fixture();auth.scheduler.start();auth.fault={httpStatus:401};await auth.advance(30000);assert.equal(auth.timers.size,0);await auth.advance(3600000);assert.equal(auth.reads,1);auth.fault=null;await auth.scheduler.wake('focus');assert.equal(auth.reads,2);cases++;
  const lock=fixture({locks:{request:async(name,options,fn)=>{assert.equal(options.ifAvailable,true);return fn(null)}}});lock.scheduler.start();await lock.advance(30000);assert.equal(lock.reads,0);assert.equal(lock.scheduler.metrics.lockSkipped,1);cases++;
  const peer=fixture();peer.scheduler.start();peer.channel.onmessage({data:{type:'confirmed',revision:other,at:0}});await Promise.resolve();await Promise.resolve();assert.equal(peer.reads,1);for(let i=0;i<20;i++)peer.channel.onmessage({data:{type:'checked',revision:other,at:0}});assert.equal(peer.reads,1);cases++;
  peer.channel.onmessage({data:{type:'confirmed',revision:'invalid',at:0,data:{clients:[]}}});assert.equal(peer.reads,1);peer.scheduler.stop();assert.equal(peer.timers.size,0);cases++;
  const modeled=fixture({readMs:3000});modeled.scheduler.start();await modeled.advance(600000);assert.ok(modeled.reads<=20);const activeReads=modeled.reads;modeled.visible=false;await modeled.scheduler.wake('visibility');await modeled.advance(600000);assert.equal(modeled.reads,activeReads);cases++;
  console.log(JSON.stringify({cases,normalPollsPerMinute:2,minimumEventGapMs:10000,modeledSlowReadsPerTenMinutes:activeReads,hiddenReadsPerTenMinutes:0,realGoogle:false}));
})().catch(error=>{console.error(error);process.exitCode=1});
