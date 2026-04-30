let data = [];
let modo = null;

fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  clean();
});

function clean(){
  data.forEach(d=>{
    if(d.Piso==="R/C") d.Piso=0;
    d.Piso=Number(d.Piso);
    d.PVP=Number(d.PVP);
  });
}

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function media(arr){
  if(!arr.length) return null;
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

function diff(p,m){
  if(!m) return "-";
  return ((p/m-1)*100);
}

function arrow(v){
  if(v==="-"||v==null) return "";
  return v>0?"▲":"▼";
}

function classe(v){
  if(v==="-"||v==null) return "";
  return v>0?"up":"down";
}

/* FILTROS */

function setMode(m){
  modo=m;
  document.getElementById("grid").innerHTML="";
  document.getElementById("selectBox").innerHTML="";

  if(m==="todos") render(data);

  if(m==="piso"){
    const pisos=[...new Set(data.map(d=>d.Piso))];
    criarSelect(pisos,"Piso");
  }

  if(m==="vista"){
    const vistas=[...new Set(data.map(d=>d.Vista))];
    criarSelect(vistas,"Vista");
  }

  if(m==="um"){
    const nomes=data.map(d=>d["Fração"]);
    criarSelect(nomes,"Fração");
  }
}

function criarSelect(lista,label){
  const select=document.createElement("select");
  select.innerHTML=`<option>${label}</option>`;

  lista.forEach(v=>{
    const o=document.createElement("option");
    o.value=v;
    o.innerText=v;
    select.appendChild(o);
  });

  select.onchange=(e)=>{
    aplicarFiltro(e.target.value);
  };

  document.getElementById("selectBox").appendChild(select);
}

function aplicarFiltro(val){
  let filtered=[];

  if(modo==="piso") filtered=data.filter(d=>d.Piso==val);
  if(modo==="vista") filtered=data.filter(d=>d.Vista==val);
  if(modo==="um") filtered=data.filter(d=>d["Fração"]==val);

  render(filtered);
}

/* RENDER */

function render(lista){
  const grid=document.getElementById("grid");
  grid.innerHTML="";

  const base=lista.filter(d=>d.Empreendimento==="The View");
  const comp=data.filter(d=>d.Empreendimento!=="The View");

  base.forEach(ap=>{
    const tip=mapTipologia(ap.Tipologia);

    const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
    const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);

    const dDir=diff(ap.PVP,media(direto));
    const dInd=diff(ap.PVP,media(indireto));

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="badge">${ap.Tipologia}</div>
      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}

      <div style="font-size:12px;color:#666;">
        ${ap["Área Bruta"]||"-"} m² • Varanda ${ap["Varanda"]||"-"} m²<br>
        Total: ${ap["Área Total"]||"-"} m²
      </div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>

      <div class="${classe(dDir)}">
        ${dDir==="-"?"-":`${arrow(dDir)} ${Math.abs(dDir).toFixed(1)}% vs Direto`}
      </div>

      <div class="${classe(dInd)}">
        ${dInd==="-"?"-":`${arrow(dInd)} ${Math.abs(dInd).toFixed(1)}% vs Indireto`}
      </div>

      <button class="btn">Ver análise</button>
    `;

    card.onclick=()=>abrirModal(ap);

    grid.appendChild(card);
  });
}

/* MODAL */

function abrirModal(ap){
  const comp=data.filter(d=>d.Empreendimento!=="The View");
  const tip=mapTipologia(ap.Tipologia);

  const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
  const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);

  document.getElementById("modal").style.display="block";
  document.getElementById("modalTitulo").innerText=ap["Fração"];

  document.getElementById("modalConteudo").innerHTML=`
    <p><b>${ap.Tipologia}</b> • Piso ${ap.Piso} • Vista ${ap.Vista}</p>
    <p><b>Preço:</b> ${ap.PVP.toLocaleString()}€</p>

    ${sec("Diretos",direto,ap.PVP)}
    ${sec("Indiretos",indireto,ap.PVP)}
  `;
}

function sec(titulo,arr,base){
  if(!arr.length) return `<div class="section">${titulo}: nenhum</div>`;

  return `
    <div class="section">
      <b>${titulo}</b>
      ${arr.map(d=>{
        const dif=((base/d.PVP-1)*100);
        return `
          <div class="comp">
            <span>${d.Empreendimento} - ${d["Fração"]}</span>
            <span>${d.PVP.toLocaleString()}€ (${dif.toFixed(1)}%)</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function fecharModal(){
  document.getElementById("modal").style.display="none";
}
