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

function getVal(obj, keys){
  for(let k of keys){
    if(obj[k] !== undefined) return obj[k];
  }
  return "-";
}

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

function setMode(m){
  modo=m;
  document.getElementById("grid").innerHTML="";
  document.getElementById("selectBox").innerHTML="";

  const base = data.filter(d=>d.Empreendimento==="The View");

  if(m==="todos") render(base);

  if(m==="piso"){
    const pisos=[...new Set(base.map(d=>d.Piso))];
    criarSelect(pisos,"Piso");
  }

  if(m==="vista"){
    const vistas=[...new Set(base.map(d=>d.Vista))];
    criarSelect(vistas,"Vista");
  }

  if(m==="um"){
    criarCheckbox(base);
  }
}

function criarCheckbox(lista){
  const div=document.createElement("div");
  div.className="checkbox-group";

  lista.forEach(d=>{
    const item=document.createElement("div");
    item.className="checkbox-item";

    item.innerHTML=`
      <label>
        <input type="checkbox" value="${d["Fração"]}">
        ${d["Fração"]}
      </label>
    `;

    div.appendChild(item);
  });

  div.onchange=()=>{
    const checked=[...div.querySelectorAll("input:checked")].map(i=>i.value);
    const filtered=data.filter(d=>checked.includes(d["Fração"]));
    render(filtered);
  };

  document.getElementById("selectBox").appendChild(div);
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
  let base=data.filter(d=>d.Empreendimento==="The View");

  if(modo==="piso") base=base.filter(d=>d.Piso==val);
  if(modo==="vista") base=base.filter(d=>d.Vista==val);

  render(base);
}

function media(arr){
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

function render(lista){
  const grid=document.getElementById("grid");
  grid.innerHTML="";

  const comp=data.filter(d=>d.Empreendimento!=="The View");

  lista.forEach(ap=>{
    const tip=mapTipologia(ap.Tipologia);

    const direto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso && c.Vista===ap.Vista);
    const indireto=comp.filter(c=>mapTipologia(c.Tipologia)===tip && c.Piso===ap.Piso);

    const dDir = direto.length ? ((ap.PVP/media(direto)-1)*100) : "-";
    const dInd = indireto.length ? ((ap.PVP/media(indireto)-1)*100) : "-";

    const card=document.createElement("div");
    card.className="card";

    card.innerHTML=`
      <div class="badge">${ap.Tipologia}</div>
      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}

      <div class="small">
        ${getVal(ap,["Área Bruta","Área Bruta (m²)"])} m² • 
        Varanda ${getVal(ap,["Varanda","Varanda (m²)"])} m²<br>
        Total: ${getVal(ap,["Área Total","Área Total (m²)"])} m²
      </div>

      <div class="price">${ap.PVP.toLocaleString()}€</div>

      <div class="${dDir>0?'up':'down'}">
        ${dDir==="-"?"":`${dDir.toFixed(1)}% vs Direto`}
      </div>

      <div class="${dInd>0?'up':'down'}">
        ${dInd==="-"?"":`${dInd.toFixed(1)}% vs Indireto`}
      </div>

      <button class="btn">Ver análise</button>
    `;

    card.onclick=()=>abrirModal(ap);

    grid.appendChild(card);
  });
}

function abrirModal(ap){

  const comp = data.filter(d => d.Empreendimento !== "The View");
  const tip = mapTipologia(ap.Tipologia);

  const direto = comp.filter(c =>
    mapTipologia(c.Tipologia) === tip &&
    c.Piso === ap.Piso &&
    c.Vista === ap.Vista
  );

  const indireto = comp.filter(c =>
    mapTipologia(c.Tipologia) === tip &&
    c.Piso === ap.Piso
  );

  const pouco = comp.filter(c =>
    mapTipologia(c.Tipologia) === tip &&
    Math.abs(c.Piso - ap.Piso) <= 1
  );

  document.getElementById("modal").style.display = "block";
  document.getElementById("modalTitulo").innerText = ap["Fração"];

  document.getElementById("modalConteudo").innerHTML = `
    <p><b>${ap.Tipologia}</b> • Piso ${ap.Piso} • Vista ${ap.Vista}</p>
    <p><b>Preço:</b> ${ap.PVP.toLocaleString()}€</p>

    ${sec("🔴 Diretos", direto, ap.PVP, "dir")}
    ${sec("🟠 Indiretos", indireto, ap.PVP, "ind")}
    ${sec("🟡 Pouco concorrente", pouco, ap.PVP, "pouco")}
  `;
}

function sec(titulo, arr, base, id){

  if(!arr.length){
    return `
      <div class="section">
        <div class="section-header">${titulo}</div>
        <div class="section-content">Nenhum encontrado</div>
      </div>
    `;
  }

  return `
    <div class="section">
      <div class="section-header" onclick="toggle('${id}')">
        <span>${titulo} (${arr.length})</span>
        <span>▼</span>
      </div>

      <div class="section-content" id="${id}">
        ${arr.map(d=>{
          const dif = ((base / d.PVP - 1) * 100);

          return `
            <div class="comp">
              <span>${d.Empreendimento} - ${d["Fração"]}</span>
              <span>
                ${d.PVP.toLocaleString()}€ 
                <span class="${dif > 0 ? 'up' : 'down'}">
                  ${dif > 0 ? '▲' : '▼'} ${Math.abs(dif).toFixed(1)}%
                </span>
              </span>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function toggle(id){
  const el = document.getElementById(id);
  el.classList.toggle("hidden");
}

function fecharModal(){
  document.getElementById("modal").style.display="none";
}
