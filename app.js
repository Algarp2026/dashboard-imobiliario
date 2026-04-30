let data = [];
let modo = null;

fetch('data.xlsx')
.then(res=>res.arrayBuffer())
.then(buffer=>{
  const wb = XLSX.read(buffer,{type:"array"});
  const sheet = wb.Sheets[wb.SheetNames[0]];
  data = XLSX.utils.sheet_to_json(sheet);

  render(data.filter(d=>d.Empreendimento==="The View"));
});

function mapTipologia(t){
  return (t==="T1+1"||t==="T1 Duplex")?"T2":t;
}

function media(arr){
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

function setMode(m){
  modo=m;
  document.getElementById("selectBox").innerHTML="";
  document.getElementById("grid").innerHTML="";

  const base=data.filter(d=>d.Empreendimento==="The View");

  if(m==="todos") render(base);
}

function render(lista){
  const grid=document.getElementById("grid");
  grid.innerHTML="";

  const comp=data.filter(d=>d.Empreendimento!=="The View");

  lista.forEach(ap=>{
    const tip=mapTipologia(ap.Tipologia);

    const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
    const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);

    const dDir = direto.length ? ((ap.PVP/media(direto)-1)*100) : null;
    const dInd = indireto.length ? ((ap.PVP/media(indireto)-1)*100) : null;

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="badge">${ap.Tipologia}</div>
      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}

      <div class="price">${ap.PVP.toLocaleString()}€</div>

      <div class="${dDir>0?'up':'down'}">
        ${dDir?`${dDir.toFixed(1)}% vs Diretos`:""}
      </div>

      <div class="${dInd>0?'up':'down'}">
        ${dInd?`${dInd.toFixed(1)}% vs Indiretos`:""}
      </div>
    `;

    card.onclick=()=>abrirModal(ap);
    grid.appendChild(card);
  });
}

function abrirModal(ap){
  document.getElementById("modal").style.display="block";
  document.getElementById("modalTitulo").innerText=ap["Fração"];

  document.getElementById("modalConteudo").innerHTML=`
    <p><b>${ap.Tipologia}</b> • Piso ${ap.Piso}</p>
    <p><b>${ap.PVP.toLocaleString()}€</b></p>
  `;
}

function fecharModal(){
  document.getElementById("modal").style.display="none";
}

function fecharConc(){
  document.getElementById("modalConc").style.display="none";
}
