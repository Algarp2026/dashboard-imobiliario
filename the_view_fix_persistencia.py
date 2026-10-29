"""Correção conservadora para commercial.js de main e2c041dc.
Executar na raiz do repositório: python3 the_view_fix_persistencia.py
Não contacta rede, não altera folhas de cálculo. Falha se encontrar código inesperado.
"""
from pathlib import Path

p = Path('commercial.js')
s = p.read_text(encoding='utf-8')
replacements = [
("commercialUxToast('Alteração de preço guardada.');", "commercialUxToast('Preço registado no dispositivo. Confirme a sincronização na base partilhada.');"),
("commercialUxToast(idx>=0?'Agente atualizado.':'Agente guardado.');", "commercialUxToast('Dados do agente registados no dispositivo. Confirme a sincronização na base partilhada.');"),
("if(!automatic){sharedSync.verified=false;sharedSync.phase='loading'}else{sharedSync.checking=true;sharedSync.received=false}",
 "if(!automatic){sharedSync.checking=true;sharedSync.received=false}else{sharedSync.checking=true;sharedSync.received=false}"),
("""if(!automatic&&sharedSync.initialized&&protectedCommercialEdit()){
      sharedSync.incoming=result.revision!==sharedSync.revision;
      if(sharedSync.incoming){sharedSync.phase='conflict';sharedSync.error='REMOTE_UPDATE_DURING_EDIT';sharedSync.verified=false}
      return{shouldSave:false};
    }""",
"""if(!automatic&&sharedSync.initialized&&protectedCommercialEdit()){
      sharedSync.incoming=result.revision!==sharedSync.revision;
      if(sharedSync.incoming){sharedSync.phase='conflict';sharedSync.error='REMOTE_UPDATE_DURING_EDIT';sharedSync.verified=false}
      else if(sharedSync.base&&syncComparable(sharedSync.base)===syncComparable(remote)&&localStorage.getItem(LOCAL_SYNC_REQUEST_KEY)===null){
        sharedSync.ticket=result.readTicket;sharedSync.canWrite=!!result.canWrite;sharedSync.verified=true;sharedSync.error='';
        sharedSync.phase=hasPendingLocalSync()||sharedSync.dirty||syncComparable(state.data)!==syncComparable(remote)?'pending':'synced';
      }
      return{shouldSave:false};
    }"""),
("finally{sharedSync.checking=false;renderSharedSyncStatus({refresh:!automatic||sharedSync.phase==='offline'})}",
"""finally{
    sharedSync.checking=false;
    // A completed read may leave local writes waiting: never make the write depend
    // on a second manual click. Preserve requests with uncertain outcomes.
    if(sharedSync.initialized&&sharedSync.phase==='pending'&&sharedSync.verified&&sharedSync.base&&sharedSync.revision&&sharedSync.canWrite&&!sharedSync.busy&&!protectedCommercialEdit()&&localStorage.getItem(LOCAL_SYNC_REQUEST_KEY)===null&&(hasPendingLocalSync()||sharedSync.dirty)&&!sharedSync.autoBlock){
      clearTimeout(saveTimer);saveTimer=setTimeout(syncRemote,300);
    }
    renderSharedSyncStatus({refresh:!automatic||sharedSync.phase==='offline'});
  }""")]
for before, after in replacements:
    count = s.count(before)
    if count != 1:
        raise RuntimeError(f'Base inesperada: ocorrência {count} para {before[:70]!r}; nenhuma escrita')
    s = s.replace(before, after, 1)
p.write_text(s, encoding='utf-8')
print('Correção aplicada localmente a commercial.js. Executar os testes e rever o diff antes de abrir PR.')
