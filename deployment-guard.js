'use strict';
(()=>{
  const loaded=document.querySelector('meta[name="the-view-deployment"]')?.content;
  if(!/^[a-f0-9]{64}$/.test(loaded||''))return;
  const originMeta=document.querySelector('meta[name="the-view-version-origin"]')?.content;
  const environment=document.querySelector('meta[name="the-view-environment"]')?.content||(originMeta?'production':'preview');
  const publishedOrigin=environment==='production'&&originMeta?originMeta:location.origin;
  const versionUrl=new URL('/deployment-version.json',publishedOrigin);
  const crossOrigin=versionUrl.origin!==location.origin;
  const pageUrl=new URL(location.href);let requested=pageUrl.searchParams.get('tv_version')||'',failedTarget='';
  const key='theView.crmCommercial.v2',interval=120000,minGap=15000;
  let adapter=null,target='',checking=null,lastCheck=0,dialog=null,banner=null,downloadUrl='',preparing=false,refreshing=false,wakeTimer=null;
  const canonical=value=>JSON.stringify(value);
  const fields=()=>[...document.querySelectorAll('input,select,textarea,[contenteditable="true"],button[aria-pressed]')].filter(n=>!n.closest('.tv-update-dialog,.tv-update-banner')&&!n.matches('[type="password"],[type="file"]')).map(n=>({id:n.id,name:n.name||'',tag:n.tagName,type:n.type||'',value:n.isContentEditable?n.textContent:n.value,checked:n.checked,selected:n.tagName==='SELECT'?[...n.selectedOptions].map(o=>o.value):undefined,pressed:n.getAttribute('aria-pressed'),context:n.closest('form,.modal-backdrop')?.id||n.closest('form')?.getAttribute('data-op-form')||''}));
  const local=()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k===key||k.startsWith(key+'.')).sort().map(k=>[k,localStorage.getItem(k)]));
  function status(){try{return adapter?.status()||{draft:false,pending:localStorage.getItem(key+'.pendingWrite.v1')!==null||localStorage.getItem(key+'.pendingSync')!==null,busy:false}}catch{return{draft:true,pending:true,busy:true}}}
  function blocked(){const s=status();return !!(s.draft||s.pending||s.busy||s.initializing)}
  function error(message){const node=dialog?.querySelector('[role=status]');if(node)node.textContent=message;}
  async function capture(){return{format:'the-view-deployment-recovery-v1',loadedVersion:loaded,targetVersion:target,origin:location.origin,path:location.pathname,environment,fields:fields(),localEntries:local(),commercial:adapter?await adapter.snapshot():null}}
  async function prepare(){
    if(preparing)return;preparing=true;
    try{
      if(status().busy)throw Error('Aguarde a conclusão da operação em curso. Nenhum pedido foi alterado.');
      const snapshot=await capture(),text=JSON.stringify(snapshot,null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
      if(downloadUrl){const old=downloadUrl;setTimeout(()=>URL.revokeObjectURL(old),60000)}downloadUrl=url;
      let link=dialog.querySelector('a');if(!link){link=document.createElement('a');dialog.appendChild(link)}link.href=url;link.download='the-view-trabalho-antes-de-atualizar.json';link.textContent='Descarregar trabalho e formulário';try{link.click()}catch{}
      error('Ficheiro preparado, não confirmado. Guarde-o e selecione-o para verificar todos os campos e pedidos.'+(crossOrigin?' O backup não transfere dados entre origens.':''));
      let verify=dialog.querySelector('[data-verify-update]');if(!verify){verify=document.createElement('button');verify.type='button';verify.dataset.verifyUpdate='';verify.textContent=crossOrigin?'Verificar ficheiro de recuperação':'Verificar ficheiro guardado e atualizar';dialog.querySelector('.tv-update-actions').appendChild(verify)}
      verify.onclick=()=>{const input=document.createElement('input');input.type='file';input.accept='.json';input.hidden=true;document.body.appendChild(input);input.oncancel=()=>input.remove();input.onchange=async()=>{try{
        const file=input.files[0];if(!file)return;
        if(await file.text()!==text||canonical(await capture())!==canonical(snapshot))throw Error('O ficheiro ou o trabalho mudou. Preserve uma nova cópia antes de atualizar.');
        if(status().busy)throw Error('Existe uma operação em curso. Aguarde antes de atualizar.');
        // No storage mutation: original requests and IndexedDB remain available to the new version.
        await reload(true);
      }catch(e){error(e.message)}finally{input.remove()}};input.click();};
    }catch(e){error(e.message||'Não foi possível preservar todo o trabalho. Não atualize a página.')}finally{preparing=false}
  }
  async function reload(verified=false){
    try{
      if(failedTarget===target){error('A navegação anterior não carregou a versão pretendida. Verifique novamente a publicação; não será repetido o mesmo refresh.');return}
      if(crossOrigin&&blocked())throw Error('O ficheiro pode estar verificado, mas o trabalho e os pedidos não foram transferidos. Mantenha este separador na origem anterior e solicite recuperação administrativa antes de mudar de domínio.');
      if(!verified&&blocked()||status().busy)throw Error('O trabalho mudou ou existe uma operação em curso. Preserve-o antes de atualizar.');
      if(crossOrigin){
        const before=canonical(await capture());let safe=false;
        if(adapter?.canLeaveOrigin)safe=await adapter.canLeaveOrigin();
        else if(!Object.values(local()).some(value=>value!==null)&&typeof indexedDB!=='undefined'&&typeof indexedDB.databases==='function')safe=!(await indexedDB.databases()).some(db=>db.name===key+'.recovery.v1');
        if(!safe||blocked()||before!==canonical(await capture()))throw Error('Não foi possível confirmar a segurança do armazenamento desta origem. Não houve transferência. Preserve o arquivo e reveja a recuperação na origem anterior.');
      }
      const url=crossOrigin?new URL(location.pathname,versionUrl.origin):new URL(location.href);
      if(crossOrigin){for(const name of ['client','clientTab','tab','view'])if(pageUrl.searchParams.has(name))url.searchParams.set(name,pageUrl.searchParams.get(name));const next=pageUrl.searchParams.get('next');if(['/commercial.html','/comparador.html','/','/index','/index.html'].includes(next))url.searchParams.set('next',next)}
      url.searchParams.set('tv_version',target);url.searchParams.set('tv_from',loaded);refreshing=true;location.replace(url.href);
    }catch(e){refreshing=false;error(e.message)}
  }
  function clearAttempt(){const url=new URL(location.href);if(url.searchParams.has('tv_version')||url.searchParams.has('tv_from')){url.searchParams.delete('tv_version');url.searchParams.delete('tv_from');history.replaceState(history.state,'',url.href)}requested=''}
  function show(){
    if(!target)return;
    if(!dialog){dialog=document.createElement('dialog');dialog.className='tv-update-dialog';dialog.setAttribute('aria-labelledby','tv-update-title');dialog.innerHTML='<h2 id="tv-update-title">Nova versão disponível</h2><p data-update-message></p><div class="tv-update-actions"></div><p role="status" aria-live="polite"></p>';dialog.addEventListener('cancel',e=>e.preventDefault());document.body.appendChild(dialog)}
    const s=status(),unsafe=blocked();dialog.querySelector('[data-update-message]').textContent=s.pending||s.busy?'Existe uma nova versão e uma gravação pendente ou de resultado desconhecido. Preserve o trabalho e os pedidos originais antes de atualizar.':unsafe?'Existe uma nova versão, mas tem alterações por guardar. Conclua ou preserve o seu trabalho antes de atualizar.':'O The View foi atualizado. É necessário atualizar a página para continuar.';
    if(crossOrigin)dialog.querySelector('[data-update-message]').textContent+=' A publicação atual está noutro domínio; sessão e armazenamento não são transferidos.';
    if(failedTarget===target)dialog.querySelector('[data-update-message]').textContent='A página não carregou a versão pretendida. A atualização anterior falhou; não será repetida automaticamente. Preserve o trabalho e verifique a publicação.';
    const actions=dialog.querySelector('.tv-update-actions');actions.replaceChildren();const update=document.createElement('button');update.type='button';update.textContent=failedTarget===target?'Verificar publicação novamente':unsafe?(crossOrigin?'Preservar trabalho para recuperação':'Preservar trabalho antes de atualizar'):'Atualizar agora';update.onclick=()=>{if(failedTarget===target){check(true).then(()=>{if(failedTarget===target)error('A publicação continua igual à da tentativa falhada. Não repita a navegação; confirme o domínio e a publicação com o administrador.')});return}if(blocked())prepare();else reload()};actions.appendChild(update);
    if(failedTarget===target&&unsafe){const preserve=document.createElement('button');preserve.type='button';preserve.textContent='Preservar trabalho para recuperação';preserve.onclick=prepare;actions.appendChild(preserve)}
    if(unsafe){const edit=document.createElement('button');edit.type='button';edit.textContent='Continuar apenas a edição local';edit.onclick=()=>{dialog.close();if(!banner){banner=document.createElement('aside');banner.className='tv-update-banner';banner.innerHTML='<span>Nova versão disponível. Novas gravações remotas bloqueadas; preserve o trabalho antes de atualizar.</span><button type="button">Rever atualização</button>';banner.querySelector('button').onclick=show;document.body.appendChild(banner)}};actions.appendChild(edit)}
    if(!dialog.open)dialog.showModal();
  }
  function receive(version){
    if(!/^[a-f0-9]{64}$/.test(version||''))return;
    if(version===loaded){clearAttempt();if(!target||target===loaded)return;target=loaded;failedTarget='';show();return}
    const failed=requested===version&&requested!==loaded?version:'';
    if(requested&&requested!==version)clearAttempt();
    if(version!==target||failedTarget!==failed){target=version;failedTarget=failed;adapter?.pause?.();show()}
  }
  let channel;try{channel=new BroadcastChannel('theView.deployment.v1');channel.onmessage=e=>{if(e.data?.type==='version'&&e.data.environment===environment&&e.data.origin===versionUrl.origin&&/^[a-f0-9]{64}$/.test(e.data.version||'')){lastCheck=Date.now();clearTimeout(wakeTimer);wakeTimer=null;receive(e.data.version)}}}catch{}
  async function check(force=false){
    if(checking)return checking;if(!force&&(document.visibilityState==='hidden'||Date.now()-lastCheck<minGap))return;
    const read=async()=>{lastCheck=Date.now();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{
      versionUrl.searchParams.set('t',Date.now());const response=await fetch(versionUrl.href,{cache:'no-store',credentials:versionUrl.origin===location.origin?'same-origin':'omit',signal:controller.signal});
      if(!response.ok)return;const value=await response.json();if(value.format!==1||value.environment!==environment||!/^[a-f0-9]{64}$/.test(value.version||''))return;
      lastCheck=Date.now();channel?.postMessage({type:'version',version:value.version,environment,origin:versionUrl.origin});receive(value.version);
    }catch{}finally{clearTimeout(timer)}};
    checking=(async()=>{if(navigator.locks)await navigator.locks.request('theView.deployment-check.v1',{ifAvailable:true},async lock=>{if(lock)await read()});else await read()})().finally(()=>checking=null);return checking;
  }
  function wake(){
    if(document.visibilityState==='hidden'||checking)return checking;
    clearTimeout(wakeTimer);const delay=Math.max(0,Math.min(minGap,minGap-(Date.now()-lastCheck)));
    if(delay){wakeTimer=setTimeout(()=>{wakeTimer=null;check(true)},delay);return}
    return check(true);
  }
  window.THE_VIEW_DEPLOYMENT_GUARD={get outdated(){return !!target},get refreshing(){return refreshing},loaded,check,register(value){adapter=value;if(target){adapter.pause?.();show()}}};
  let scheduled=false;const progress=()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;if(target&&banner&&!dialog?.open&&!blocked())show()})};
  document.addEventListener('input',progress,true);document.addEventListener('change',progress,true);new MutationObserver(progress).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  document.addEventListener('visibilitychange',wake);
  window.addEventListener('pageshow',()=>{refreshing=false;wake()});window.addEventListener('online',wake);window.addEventListener('focus',wake);
  setInterval(()=>check(),interval);check(true);
})();
