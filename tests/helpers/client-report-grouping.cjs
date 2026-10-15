'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function loadReportApp(source=fs.readFileSync(path.join(root,'commercial.js'),'utf8')){
  const start=source.indexOf('const MAJUCA_IMPORT_RECORDS=['),stop=source.indexOf('\n];',start);
  source=source.slice(0,start)+'const MAJUCA_IMPORT_RECORDS=[];'+source.slice(stop+3);
  let html='';
  const context={console,document:{readyState:'loading',addEventListener(){}},window:{THE_VIEW_CONFIG:{},THE_VIEW_RECOMMENDATIONS:require('../../commercial-recommendations.js'),THE_VIEW_CLIENT_WORKFLOW:require('../../commercial-client-workflow.js'),open(){return{document:{open(){},write(value){html=value},close(){}}}}},localStorage:{getItem(){return null}}};
  vm.createContext(context);const end=source.lastIndexOf('})();');
  vm.runInContext(source.slice(0,end)+"commercialUxToast=()=>{};sharedSync.phase='synced';sharedSync.verified=true;sharedSync.lastConfirmedAt='2026-10-15T12:00:00Z';globalThis.report={state,STAGES,CLIENT_REPORT_COLUMNS,clientReportMarkup,clientReportStageGroups:typeof clientReportStageGroups==='function'?clientReportStageGroups:null,clientReportColumnGroups,filterClientReportRows,generateClientsSummaryPdf};"+source.slice(end),context);
  return {...context.report,html:()=>html};
}
function fictitiousRows(stages,count=28){
  return Array.from({length:count},(_,i)=>({id:'fiction-'+i,client:'Cliente fictício '+String(i+1).padStart(3,'0'),status:stages[i%stages.length],agentId:i%2?'agent-a':'agent-b',agent:i%2?'Agente A fictício':'Agente B fictício',contactState:i%2?'Resposta nossa pendente':'Em acompanhamento',priorityClient:i%3===0,priorityLabel:i%3===0?'Sim':'Não',phone:'000000000',email:'cliente'+i+'@example.test',contact:'000000000 · cliente'+i+'@example.test',origin:'Website The View',typology:'T2',preferences:'T2 · Sul',budget:'Intervalo fictício',floor:'4',orientation:'Sul',related:'Apt. 24 · Apt. 30',presented:'Apt. 24',fractions:'Apt. 24',informedPrices:'Valor exclusivamente fictício',lastContact:'2026-10-'+String(i%10+1).padStart(2,'0'),lastContactLabel:String(i%10+1).padStart(2,'0')+'/10/2026',daysWithoutContact:i%10,nextStep:'Confirmar interesse na apresentação fictícia',automatic:'Enviar documentação e esclarecer condições',recommendationReason:'Acompanhamento de apresentação fictícia',priority:i%3===0?'Alta':'Média',manualPriority:'Média',followupStatus:i%2?'future':'overdue',followupNeedsReview:false,followupDate:'2026-10-'+(i%2?'20':'01'),followupDateLabel:i%2?'20/10/2026':'01/10/2026',followupState:i%2?'Agendado':'Vencido',note:'Nota fictícia preservada'}));
}
module.exports={loadReportApp,fictitiousRows};
