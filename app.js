let data = [];

fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  initFiltros();
  render();
});

/* ================= UTIL ================= */

function toNumber(v){
  if(!v) return null;
  return parseFloat(v.toString().replace(",", "."));
}

function getAreas(o){
  const abp = toNumber(o["ABP"]);
  const varan = toNumber(o["Varanda/Terraço"]);
  const total = toNumber(o["Área Total"]) || ((abp||0)+(varan||0));
  return {abp,varan,total};
}

function getPricePerM2(o){
  const a=getAreas(o);
  if(!a.total||!o.PVP) return null;
  return o.PVP/a.total;
}

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function media(arr){
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

/* ================= NOVAS FUNÇÕES ================= */

function precoFallback(d,i,p){
  if(d.length) return media(d);
  if(i.length) return media(i);
  if(p.length) return media(p);
  return null;
}

function precoRigoroso(d,i,p){

  let pesos={d:0.6,i:0.3,p:0.1};
  let soma=0, total=0;

  if(d.length){
    soma+=media(d)*pesos.d;
    total+=pesos.d;
  }

  if(i.length){
    soma+=media(i)*pesos.i;
    total+=pesos.i;
  }

  if(p.length){
    soma+=media(p)*pesos.p;
    total+=pesos.p;
  }

  return total? soma/total : null;
}

/* ================= FILTROS ================= */

function initFiltros(){

  const base=data.filter(d=>d.Empreendimento==="The View");
  const comps=data.filter(d=>d.Empreendimento!=="The View");

  piso.innerHTML=`<option value="">Todos</option>`+
    [...new Set(base.map(d=>d.Piso))].map(p=>`<option>${p}</option>`);

  vista.innerHTML=`<option value="">Todas</option>`+
    [...new Set(base.map(d=>d.Vista))].map(v=>`<option>${v}</option>`);

  fractionsBox.innerHTML=base.map(d=>
    `<label><input type="checkbox" value="${d["Fração"]}" onchange="render()"> ${d["Fração"]}</label>`
  ).join("");

  empreBox.innerHTML=[...new Set(comps.map(d=>d.Empreendimento))]
    .map(e=>`<label><input type="checkbox" checked value="${e}" onchange="render()"> ${e}</label>`)
    .join("");
}

function getChecked(id){
  return [...document.querySelectorAll(`#${id} input:checked`)].map(i=>i.value);
}

function resetFiltros(){
  piso.value="";
  vista.value="";
  document.querySelectorAll("#fractionsBox input").forEach(i=>i.checked=false);
  document.querySelectorAll("#empreBox input").forEach(i=>i.checked=true);
  render();
}

/* ================= RENDER ================= */

function render(){

  let base=data.filter(d=>d.Empreendimento==="The View");

  const p=piso.value;
  const v=vista.value;
  const m=getChecked("fractionsBox");
  const e=getChecked("empreBox");

  if(p) base=base.filter(d=>d.Piso==p);
  if(v) base=base.filter(d=>d.Vista==v);
  if(m.length) base=base.filter(d=>m.includes(d["Fração"]));

  const comp=data.filter(d=>e.includes(d.Empreendimento));

  grid.innerHTML="";

  base.forEach(ap=>{

    const areas=getAreas(ap);
    const m2=getPricePerM2(ap);
    const tip=mapTipologia(ap.Tipologia);

    const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
    const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);
    const pouco=comp.filter(c=>mapTipologia(c.Tipologia)===tip && Math.abs(c.Piso-ap.Piso)<=1);

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="badge">${ap.Tipologia}</div>
      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}

      <div class="small">
        ${areas.abp||"-"} m² • Var ${areas.varan||"-"} • Total ${areas.total||"-"}
      </div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>
      <div class="small">${m2?m2.toFixed(0):"-"} €/m²</div>
    `;

    card.onclick=()=>abrirModal(ap,direto,indireto,pouco);

    grid.appendChild(card);
  });
}

/* ================= MODAL ================= */

function abrirModal(ap,d,i,p){

  const areas=getAreas(ap);

  const fallback = precoFallback(d,i,p);
  const rigor = precoRigoroso(d,i,p);

  const diffF = fallback ? ((ap.PVP/fallback)-1)*100 : null;
  const diffR = rigor ? ((ap.PVP/rigor)-1)*100 : null;

  modal.style.display="block";
  modalTitulo.innerText=ap["Fração"];

  modalConteudo.innerHTML=`

    <p><b>${ap.PVP.toLocaleString()}€</b></p>

    <div style="display:grid;gap:10px;margin:15px 0;">

      ${cardPreco("🔵 Recomendado", fallback, diffF, "#e6f0ff")}
      ${cardPreco("🟡 Fallback", fallback, diffF, "#fff7d6")}
      ${cardPreco("🟣 Rigoroso", rigor, diffR, "#f0e6ff")}

    </div>

    ${sec("Diretos",d,ap)}
    ${sec("Indiretos",i,ap)}
    ${sec("Pouco",p,ap)}
  `;
}

function cardPreco(titulo,valor,diff,color){

  if(!valor) return "";

  return `
    <div style="background:${color};padding:12px;border-radius:10px;">
      <b>${titulo}</b><br>
      ${valor.toLocaleString()}€<br>
      <span class="${diff>0?'up':'down'}">${diff.toFixed(1)}%</span>
    </div>
  `;
}

/* ================= SEC ================= */

function sec(nome,arr,base){

  return `
    <div class="section">
      <div class="section-header" onclick="toggle(this)">
        ${nome} (${arr.length})
      </div>

      <div>
        ${arr.map(c=>{
          const diff=((base.PVP/c.PVP)-1)*100;
          return `
            <div class="comp">
              ${c.Empreendimento} - ${c["Fração"]}
              <span>${c.PVP.toLocaleString()}€ (${diff.toFixed(1)}%)</span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function toggle(el){
  const c=el.nextElementSibling;
  c.style.display = c.style.display==="none"?"block":"none";
}

function fecharModal(){ modal.style.display="none"; }
