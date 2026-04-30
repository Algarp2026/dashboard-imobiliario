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

/* ================= NOVO PRICING ================= */

function precoFallback(d,i,p){
  if(d.length) return media(d);
  if(i.length) return media(i);
  if(p.length) return media(p);
  return null;
}

function precoRigoroso(d,i,p){
  let soma=0,total=0;

  if(d.length){
    soma+=media(d)*0.6;
    total+=0.6;
  }

  if(i.length){
    soma+=media(i)*0.3;
    total+=0.3;
  }

  if(p.length){
    soma+=media(p)*0.1;
    total+=0.1;
  }

  return total? soma/total : null;
}

/* ================= FILTROS ================= */

function initFiltros(){

  const base=data.filter(d=>d.Empreendimento==="The View");

  piso.innerHTML=`<option value="">Todos</option>`+
    [...new Set(base.map(d=>d.Piso))]
    .map(p=>`<option>${p}</option>`);

  vista.innerHTML=`<option value="">Todas</option>`+
    [...new Set(base.map(d=>d.Vista))]
    .map(v=>`<option>${v}</option>`);
}

function resetFiltros(){
  piso.value="";
  vista.value="";
  render();
}

/* ================= RENDER ================= */

function render(){

  let base=data.filter(d=>d.Empreendimento==="The View");

  const p=piso.value;
  const v=vista.value;

  if(p) base=base.filter(d=>d.Piso==p);
  if(v) base=base.filter(d=>d.Vista==v);

  const comp=data.filter(d=>d.Empreendimento!=="The View");

  grid.innerHTML="";

  base.forEach(ap=>{

    const areas=getAreas(ap);
    const tip=mapTipologia(ap.Tipologia);

    const direto=comp.filter(c=>
      mapTipologia(c.Tipologia)===tip &&
      c.Piso===ap.Piso &&
      c.Vista===ap.Vista
    );

    const indireto=comp.filter(c=>
      mapTipologia(c.Tipologia)===tip &&
      c.Piso===ap.Piso
    );

    const pouco=comp.filter(c=>
      mapTipologia(c.Tipologia)===tip &&
      Math.abs(c.Piso-ap.Piso)<=1
    );

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <b>${ap["Fração"]}</b><br>
      ${ap.Tipologia} • Piso ${ap.Piso} • Vista ${ap.Vista}

      <div style="font-size:12px;margin-top:5px;">
        ${areas.abp||"-"} m² • Var ${areas.varan||"-"} • Total ${areas.total||"-"}
      </div>

      <div style="margin-top:10px;font-size:18px;font-weight:bold;">
        ${ap.PVP.toLocaleString()}€
      </div>
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

    <p>${ap.Tipologia} • Piso ${ap.Piso} • Vista ${ap.Vista}</p>

    <p>
      ABP: ${areas.abp || "-"} m²<br>
      Varanda: ${areas.varan || "-"} m²<br>
      Total: ${areas.total || "-"} m²
    </p>

    <p style="font-size:18px;">
      <b>${ap.PVP.toLocaleString()}€</b>
    </p>

    <!-- 🔥 PRICING CARDS -->
    <div style="display:grid;gap:10px;margin:15px 0;">

      ${cardPreco("🔵 Recomendado", fallback, diffF, "#e6f0ff")}
      ${cardPreco("🟡 Fallback", fallback, diffF, "#fff7d6")}
      ${cardPreco("🟣 Rigoroso", rigor, diffR, "#f0e6ff")}

    </div>

    ${sec("Diretos",d,ap)}
    ${sec("Indiretos",i,ap)}
    ${sec("Pouco concorrente",p,ap)}
  `;
}

/* ================= CARD PREÇO ================= */

function cardPreco(titulo,valor,diff,color){

  if(!valor) return `
    <div style="background:#eee;padding:10px;border-radius:10px;">
      ${titulo}<br>Sem dados
    </div>
  `;

  return `
    <div style="
      background:${color};
      padding:12px;
      border-radius:10px;
    ">
      <b>${titulo}</b><br>
      ${valor.toLocaleString()}€<br>
      <span class="${diff>0?'up':'down'}">
        ${diff.toFixed(1)}%
      </span>
    </div>
  `;
}

/* ================= CONCORRENTES ================= */

function sec(nome,arr,base){

  return `
    <div style="margin-top:10px;">

      <div style="font-weight:bold;cursor:pointer;" onclick="toggle(this)">
        ${nome} (${arr.length})
      </div>

      <div>
        ${arr.map(c=>{
          const diff=((base.PVP/c.PVP)-1)*100;

          return `
            <div style="display:flex;justify-content:space-between;font-size:13px;margin:3px 0;">
              ${c.Empreendimento} - ${c["Fração"]}
              <span>
                ${c.PVP.toLocaleString()}€
                (${diff.toFixed(1)}%)
              </span>
            </div>
          `;
        }).join("")}
      </div>

    </div>
  `;
}

/* ================= UX ================= */

function toggle(el){
  const c=el.nextElementSibling;
  c.style.display = c.style.display==="none"?"block":"none";
}

function fecharModal(){
  modal.style.display="none";
}
