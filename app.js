let data = [];

/* ================= LOAD ================= */

fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  initFiltros();
  render();
});

/* ================= UTILS ================= */

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

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function media(arr){
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

function mediaM2(arr){
  return arr.reduce((a,b)=>{
    const ar = getAreas(b);
    return a + (b.PVP/(ar.total||1));
  },0)/arr.length;
}

/* ================= PRICING ================= */

function precoFallback(d,i,p){
  if(d.length) return {valor:media(d), origem:"Baseado em Diretos"};
  if(i.length) return {valor:media(i), origem:"Baseado em Indiretos"};
  if(p.length) return {valor:media(p), origem:"Baseado em Pouco concorrente"};
  return null;
}

function precoRigoroso(d,i,p){
  let soma=0,total=0;

  if(d.length){ soma+=media(d)*0.6; total+=0.6; }
  if(i.length){ soma+=media(i)*0.3; total+=0.3; }
  if(p.length){ soma+=media(p)*0.1; total+=0.1; }

  if(!total) return null;

  return {
    valor:soma/total,
    explicacao:"Modelo ponderado: 60% Diretos • 30% Indiretos • 10% restantes"
  };
}

function precoIdeal(ap,d,i,p){
  const areas=getAreas(ap);
  let base = d.length ? d : (i.length ? i : p);
  if(!base.length) return null;

  const m2 = mediaM2(base);
  const preco = m2 * (areas.total||1);

  return {
    valor:preco,
    explicacao:`€/m² médio (${m2.toFixed(0)}€/m²) ajustado à área`
  };
}

/* ================= FILTROS ================= */

function initFiltros(){

  const base = data.filter(d=>d.Empreendimento==="The View");
  const comps = data.filter(d=>d.Empreendimento!=="The View");

  piso.innerHTML=`<option value="">Todos os pisos</option>`+
    [...new Set(base.map(d=>d.Piso))]
    .map(p=>`<option>${p}</option>`);

  vista.innerHTML=`<option value="">Todas as vistas</option>`+
    [...new Set(base.map(d=>d.Vista))]
    .map(v=>`<option>${v}</option>`);

  fractionsBox.innerHTML = base.map(d=>`
    <label class="checkItem">
      <input type="checkbox" value="${d["Fração"]}" onchange="render()">
      ${d["Fração"]}
    </label>
  `).join("");

  empreBox.innerHTML = [...new Set(comps.map(d=>d.Empreendimento))]
    .map(e=>`
      <label class="checkItem">
        <input type="checkbox" value="${e}" checked onchange="render()">
        ${e}
      </label>
    `).join("");
}

function getChecked(id){
  return [...document.querySelectorAll(`#${id} input:checked`)]
    .map(i=>i.value);
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

  let base = data.filter(d=>d.Empreendimento==="The View");

  const p = piso.value;
  const v = vista.value;
  const selectedFractions = getChecked("fractionsBox");
  const selectedEmpre = getChecked("empreBox");

  if(p) base = base.filter(d=>d.Piso==p);
  if(v) base = base.filter(d=>d.Vista==v);
  if(selectedFractions.length){
    base = base.filter(d=>selectedFractions.includes(d["Fração"]));
  }

  const comp = data.filter(d=>
    d.Empreendimento !== "The View" &&
    selectedEmpre.includes(d.Empreendimento)
  );

  grid.innerHTML="";

  base.forEach(ap=>{

    const areas=getAreas(ap);
    const tip=mapTipologia(ap.Tipologia);

    const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
    const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);
    const pouco=comp.filter(c=>mapTipologia(c.Tipologia)===tip && Math.abs(c.Piso-ap.Piso)<=1);

    const f = precoFallback(direto,indireto,pouco);
    const diff = f ? ((ap.PVP/f.valor)-1)*100 : null;

    const card=document.createElement("div");
    card.className="card premium";

    card.innerHTML=`
      <div class="badge">${ap.Tipologia}</div>

      <div class="title">${ap["Fração"]}</div>

      <div class="meta">
        Piso ${ap.Piso} • ${ap.Vista}
      </div>

      <div class="area">
        ${areas.total||"-"} m²
      </div>

      <div class="price">
        ${ap.PVP.toLocaleString()}€
      </div>

      ${
        diff!==null ? `
        <div class="delta ${diff>0?'up':'down'}">
          ${diff>0?'+':''}${diff.toFixed(1)}%
        </div>` : ''
      }
    `;

    card.onclick=()=>abrirModal(ap,direto,indireto,pouco);

    grid.appendChild(card);
  });
}

/* ================= MODAL ================= */

function abrirModal(ap,d,i,p){

  const areas=getAreas(ap);

  const f = precoFallback(d,i,p);
  const r = precoRigoroso(d,i,p);
  const ideal = precoIdeal(ap,d,i,p);

  modal.style.display="block";
  modalTitulo.innerText=ap["Fração"];

  modalConteudo.innerHTML=`

    <div class="modalHeader">
      <div>
        <b>${ap.Tipologia}</b> • Piso ${ap.Piso} • ${ap.Vista}
      </div>
      <div class="bigPrice">${ap.PVP.toLocaleString()}€</div>
    </div>

    <div class="areas">
      ${areas.abp||"-"} m² • Var ${areas.varan||"-"} • Total ${areas.total||"-"}
    </div>

    <div class="pricingGrid">
      ${boxPreco("Recomendado",f,"blue")}
      ${boxPreco("Rigoroso",r,"purple")}
      ${boxPreco("Ideal",ideal,"green")}
    </div>

    ${sec("Diretos",d,ap)}
    ${sec("Indiretos",i,ap)}
    ${sec("Pouco concorrente",p,ap)}
  `;
}

/* ================= UI ================= */

function boxPreco(titulo,obj,color){

  if(!obj) return `<div class="priceBox empty">${titulo}<br>Sem dados</div>`;

  return `
    <div class="priceBox ${color}">
      <div class="label">${titulo}</div>
      <div class="value">${obj.valor.toLocaleString()}€</div>
      <div class="desc">${obj.explicacao || obj.origem}</div>
    </div>
  `;
}

function sec(nome,arr,base){

  return `
    <div class="section">
      <div class="section-header" onclick="toggle(this)">
        ▶ ${nome} (${arr.length})
      </div>

      <div class="section-body">
        ${arr.map(c=>{
          const diff=((base.PVP/c.PVP)-1)*100;
          return `
            <div class="compRow">
              <div>
                ${c.Empreendimento}<br>
                <small>${c["Fração"]}</small>
              </div>
              <div>
                ${c.PVP.toLocaleString()}€<br>
                <span class="${diff>0?'up':'down'}">
                  ${diff.toFixed(1)}%
                </span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function toggle(el){
  const body = el.nextElementSibling;
  const isOpen = body.style.display==="block";
  body.style.display = isOpen?"none":"block";
  el.innerText = (isOpen?"▶ ":"▼ ") + el.innerText.slice(2);
}

function fecharModal(){
  modal.style.display="none";
}
