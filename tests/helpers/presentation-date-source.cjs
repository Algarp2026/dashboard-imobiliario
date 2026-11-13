'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process');
function restoreDate(source){
  const lines=[
    "  const generatedDate=new Intl.DateTimeFormat('pt-PT',{timeZone:'Europe/Lisbon',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());\n",
    "  const generatedLabel=copy.disclaimerLang==='fr'?'Généré le :':'Generated on:';\n",
    '        <div class="pdf-generated-date">Impresso em: ${esc(generatedDate)} · ${generatedLabel} ${esc(generatedDate)}</div>\n',
    '  .pdf-generated-date{margin-top:1mm;color:#62738a;font:8pt/1.25 Arial,sans-serif}\n'
  ];
  let restored=source.replace(/\r\n/g,'\n');
  for(const line of lines){assert.equal(restored.split(line).length,2,'Exact authorized generation date addition');restored=restored.replace(line,'')}
  for(const [current,previous] of [
    ['.pdf-footer{margin-top:auto;border-top:1px solid #d9e1eb;padding-top:1mm;break-inside:avoid}', '.pdf-footer{margin-top:auto;border-top:1px solid #d9e1eb;padding-top:2mm;break-inside:avoid}'],
    ['.pdf-footer p{margin:0;color:#62738a;font:8pt/1.1 Arial,sans-serif}', '.pdf-footer p{margin:0;color:#62738a;font:8pt/1.25 Arial,sans-serif}'],
    ['.pdf-footer p+p{margin-top:1mm}', '.pdf-footer p+p{margin-top:1.5mm}']
  ]){assert.equal(restored.split(current).length,2);restored=restored.replace(current,previous)}
  const section=s=>s.slice(s.indexOf('function generateClientPresentationPdf('),s.indexOf('\n// Presentation state is isolated'));
  const baseline=cp.execFileSync('git',['show','194a513:commercial.js'],{cwd:require('node:path').resolve(__dirname,'../..'),encoding:'utf8',maxBuffer:4000000});
  assert.equal(section(restored),section(baseline.replace(/\r\n/g,'\n')),'No PDF change outside the approved date line');
  return restored;
}
module.exports={restoreDate};
