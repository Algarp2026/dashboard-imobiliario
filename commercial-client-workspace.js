(function(root){
  'use strict';
  const modes=['newest','oldest','stage','contact-recent','contact-oldest','next-action'];
  function dateValue(value){
    if(typeof value!=='string')return null;
    let text=value.trim();const local=text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if(local)text=local[3]+'-'+local[2]+'-'+local[1];
    if(!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}.*)?$/.test(text))return null;
    const time=Date.parse(text),day=Date.parse(text.slice(0,10)+'T00:00:00Z');
    return Number.isFinite(time)&&Number.isFinite(day)&&new Date(day).toISOString().slice(0,10)===text.slice(0,10)?time:null;
  }
  function creationTime(client){
    if(client.createdByMigration||client.majucaImportId||client.majucaImportKey)return null;
    for(const key of ['createdAt','createdDate','created']){const time=dateValue(client[key]);if(time!==null)return time}return null;
  }
  function associatedAgentId(client,agents){
    const ids=[...new Set([client.agentId,client.responsibleAgentId].filter(Boolean).map(String))];
    return ids.length===1&&agents.some(agent=>String(agent.id)===ids[0])?ids[0]:null;
  }
  function sortClients(clients,{mode='newest',source=clients,stages=[],contact=new Map(),actions=new Map()}={}){
    const positions=new Map(source.map((client,index)=>[client.id,index]));
    const dated=(a,b,direction=1)=>a===null?(b===null?0:1):b===null?-1:(a-b)*direction;
    return clients.slice().sort((a,b)=>{
      let result=0;
      if(mode==='stage')result=stages.indexOf(a.stage)-stages.indexOf(b.stage);
      else if(mode==='contact-recent')result=dated(dateValue(contact.get(a.id)?.lastContact),dateValue(contact.get(b.id)?.lastContact),-1);
      else if(mode==='contact-oldest'){
        const x=dateValue(contact.get(a.id)?.lastContact),y=dateValue(contact.get(b.id)?.lastContact);result=x===null?(y===null?0:-1):y===null?1:x-y;
      }else if(mode==='next-action'){
        const x=actions.get(a.id)||{},y=actions.get(b.id)||{},rank=v=>v.date?0:v.step?1:2;
        result=rank(x)-rank(y)||dated(dateValue(x.date),dateValue(y.date));
      }else result=dated(creationTime(a),creationTime(b),mode==='oldest'?1:-1);
      return result||(mode==='oldest'?1:-1)*((positions.get(a.id)??0)-(positions.get(b.id)??0));
    });
  }
  function createModal(adapter){
    const document=root.document,dialog=document.createElement('div');dialog.id='clientProfileDialog';dialog.className='modal-backdrop client-profile-backdrop hidden';
    dialog.innerHTML='<section class="modal panel client-profile-modal" role="dialog" aria-modal="true" aria-label="Ficha do cliente" tabindex="-1"><div class="client-profile-toolbar"><strong>Ficha do cliente</strong><span data-profile-sync role="status"></span><nav aria-label="Navegar entre clientes"><button class="ghost-button ux-icon-button" type="button" data-profile-prev title="Cliente anterior" aria-label="Cliente anterior"><i data-lucide="arrow-left"></i></button><button class="ghost-button ux-icon-button" type="button" data-profile-next title="Cliente seguinte" aria-label="Cliente seguinte"><i data-lucide="arrow-right"></i></button><button class="ghost-button ux-icon-button" type="button" data-profile-close title="Fechar ficha" aria-label="Fechar ficha"><i data-lucide="x"></i></button></nav></div></section>';
    (document.querySelector('.ux-app-shell')||document.body).append(dialog);
    const surface=dialog.firstElementChild,details=adapter.detail;surface.append(details);
    let opened=false,current='',origin=null,lastUrl='',scheduled=false,lastCount=0;
    const openOrder=new Map(),originalStyles=new Map(),inertNodes=new Map(),scroll=new Map();let sequence=0;
    const visible=element=>!element.classList.contains('hidden')&&element.getClientRects().length;
    const allDialogs=()=>[...document.querySelectorAll('.modal-backdrop,.ux-drawer-backdrop')].filter(visible);
    const top=()=>allDialogs().sort((a,b)=>(openOrder.get(a)||0)-(openOrder.get(b)||0)).at(-1);
    const focusables=element=>[...element.querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex="0"]')].filter(node=>!node.disabled&&!node.closest('[inert]')&&node.getClientRects().length);
    function busy(){return !!details.querySelector('fieldset:disabled,button[type="submit"]:disabled,[data-fraction-save]:disabled')}
    function focusProfile(){(details.querySelector('.client-detail-header h2')||surface).focus({preventScroll:true})}
    function syncStack(){
      const active=allDialogs();
      for(const element of active)if(!openOrder.has(element)){openOrder.set(element,++sequence);originalStyles.set(element,{z:element.style.getPropertyValue('z-index'),priority:element.style.getPropertyPriority('z-index'),focus:document.activeElement})}
      let restoreFocus;
      for(const [element,original]of originalStyles)if(!active.includes(element)){
        if(original.z)element.style.setProperty('z-index',original.z,original.priority);else element.style.removeProperty('z-index');
        element.inert=false;element.removeAttribute('aria-hidden');restoreFocus=original.focus;openOrder.delete(element);originalStyles.delete(element);
      }
      const ordered=active.sort((a,b)=>openOrder.get(a)-openOrder.get(b)),last=ordered.at(-1);
      ordered.forEach((element,index)=>{element.style.setProperty('z-index',String(100+index*20),'important');element.inert=element!==last;if(element===last)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden','true')});
      document.body.classList.toggle('client-dialogs-managed',!!last);
      if(opened){document.body.style.overflow='hidden';const shell=dialog.parentElement;for(const node of [...shell.children].filter(node=>node!==dialog)){if(!inertNodes.has(node))inertNodes.set(node,node.inert);node.inert=true}}
      else{for(const [node,value]of inertNodes)node.inert=value;inertNodes.clear();if(!last)document.body.style.overflow=''}
      if(restoreFocus?.isConnected&&restoreFocus.getClientRects().length&&!restoreFocus.closest('[inert]'))restoreFocus.focus({preventScroll:true});
      if(last&&lastCount!==ordered.length&&!last.contains(document.activeElement))(focusables(last)[0]||last.querySelector('[role="dialog"]'))?.focus({preventScroll:true});lastCount=ordered.length;
    }
    const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(refresh)}});
    function refresh(){
      scheduled=false;observer.disconnect();
      try{
        if(opened){
          surface.classList.add('ux-client-profile-active');
          const header=details.querySelector('.client-detail-header h2');if(header){header.id='clientProfileTitle';surface.setAttribute('aria-labelledby',header.id)}
          const status=document.getElementById('commercialSyncBadge'),mirror=dialog.querySelector('[data-profile-sync]');if(status&&mirror.textContent!==status.textContent)mirror.textContent=status.textContent;
          const ids=adapter.visibleIds(),index=ids.indexOf(current);dialog.querySelector('[data-profile-prev]').disabled=index<=0;dialog.querySelector('[data-profile-next]').disabled=index<0||index>=ids.length-1;
        }
        syncStack();
      }finally{observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']})}
    }
    function route(id,tab,push){
      const url=new URL(root.location.href);if(id){url.searchParams.set('client',id);url.searchParams.set('clientTab',tab||'data')}else{url.searchParams.delete('client');url.searchParams.delete('clientTab')}
      if(url.href!==root.location.href)root.history[push?'pushState':'replaceState']({...root.history.state,theViewClientModal:!!id},'',url);
      lastUrl=url.href;
    }
    function setOpen(value,id,{history=true}={}){
      if(!value&&!opened)return;
      const changed=current!==id,wasOpen=opened;
      if(value){
        if(!opened){origin=document.activeElement===document.body?null:document.activeElement;opened=true;dialog.classList.remove('hidden')}
        current=id;
        if(history)route(id,adapter.tab(),!new URL(root.location.href).searchParams.has('client'));
        refresh();
        if(changed||!wasOpen)requestAnimationFrame(()=>{if(top()===dialog)focusProfile()});
      }else{
        opened=false;dialog.classList.add('hidden');surface.classList.remove('ux-client-profile-active');
        if(history)route(null,null,false);refresh();
        requestAnimationFrame(()=>{
          const target=origin?.isConnected&&origin.getClientRects().length?origin:adapter.returnFocus(current);
          if(target&&!target.closest('[inert]'))target.focus({preventScroll:true});
        });
      }
    }
    function capture(){const content=details.querySelector('.ux-client-workspace__content');return{top:content?.scrollTop||0,client:current,tab:adapter.tab()}}
    function rendered(previous){
      if(!opened)return;
      const content=details.querySelector('.ux-client-workspace__content');if(content&&previous?.client===current&&previous.tab===adapter.tab())content.scrollTop=previous.top;
      refresh();
    }
    function changeTab(){if(opened){route(current,adapter.tab(),false);const content=details.querySelector('.ux-client-workspace__content');if(content)content.scrollTop=scroll.get(current+':'+adapter.tab())||0}}
    details.addEventListener('scroll',event=>{if(event.target.matches('.ux-client-workspace__content'))scroll.set(current+':'+adapter.tab(),event.target.scrollTop)},true);
    function closeTop(){
      const active=top();if(!active)return;
      if(active===dialog){if(!busy())adapter.close();return}
      if(active.classList.contains('ux-drawer-backdrop')){adapter.closeDrawer();return}
      const button=[...active.querySelectorAll('[data-dialog-cancel],.modal-close,[data-close-clients-summary],[data-close-price-list-modal]')].find(node=>node.getClientRects().length&&!node.disabled);button?.click();
    }
    document.addEventListener('keydown',event=>{
      const active=top();if(!active)return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeTop();return}
      if(event.key!=='Tab')return;
      const nodes=focusables(active),first=nodes[0],last=nodes.at(-1);if(!first)return;
      if(!active.contains(document.activeElement)){event.preventDefault();first.focus()}
      else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
      event.stopImmediatePropagation();
    },true);
    dialog.addEventListener('click',event=>{if(event.target===dialog){event.preventDefault();event.stopPropagation()}});
    dialog.querySelector('[data-profile-close]').onclick=()=>{if(top()===dialog&&!busy())adapter.close()};
    for(const [selector,delta]of [['[data-profile-prev]',-1],['[data-profile-next]',1]])dialog.querySelector(selector).onclick=()=>{if(busy())return;const ids=adapter.visibleIds(),next=ids[ids.indexOf(current)+delta];if(next)adapter.open(next)};
    root.addEventListener('popstate',()=>{
      if(opened&&top()!==dialog){closeTop();root.history.pushState({...root.history.state,theViewClientModal:true},'',lastUrl);return}
      const url=new URL(root.location.href),id=url.searchParams.get('client');
      if(id&&adapter.exists(id)){adapter.open(id,{history:false});adapter.activate(url.searchParams.get('clientTab')||'data')}
      else if(opened){if(busy()){root.history.pushState({...root.history.state,theViewClientModal:true},'',lastUrl);return}adapter.close({history:false})}
    });
    refresh();return{setOpen,capture,rendered,changeTab,busy,restore(){const url=new URL(root.location.href),id=url.searchParams.get('client');if(id&&adapter.exists(id)){adapter.open(id,{history:false});adapter.activate(url.searchParams.get('clientTab')||'data')}},element:dialog};
  }
  const api={modes,dateValue,creationTime,associatedAgentId,sortClients,createModal};
  root.THE_VIEW_CLIENT_WORKSPACE=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
