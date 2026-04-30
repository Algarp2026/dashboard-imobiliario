let data = [];

fetch('data.xlsx')
  .then(res => res.arrayBuffer())
  .then(buffer => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);

    cleanData();
    render();
  });

function cleanData() {
  data.forEach(d => {
    if (d.Piso === "R/C") d.Piso = 0;
    d.Piso = Number(d.Piso);
    d.PVP = Number(d.PVP);
  });
}

function mapTipologia(t) {
  if (t === "T1+1" || t === "T1 Duplex") return "T2";
  return t;
}

function media(arr) {
  if (!arr.length) return null;
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

function diff(preco, media) {
  if (!media) return "-";
  return ((preco/media -1)*100).toFixed(1) + "%";
}

function corClasse(valor) {
  if (valor === "-" || valor === null) return "";
  return parseFloat(valor) > 0 ? "red" : "green";
}

function render() {
  const tbody = document.getElementById("tabela");

  const base = data.filter(d => d.Empreendimento === "The View");
  const comp = data.filter(d => d.Empreendimento !== "The View");

  base.forEach(ap => {
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

    const mDir = media(direto);
    const mInd = media(indireto);

    const dDir = diff(ap.PVP, mDir);
    const dInd = diff(ap.PVP, mInd);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${ap["Fração"]}</td>
      <td>${ap.Piso}</td>
      <td>${ap.Tipologia}</td>
      <td>Vista ${ap.Vista}</td>
      <td>${ap.PVP.toLocaleString()}€</td>
      <td>${mDir ? mDir.toLocaleString()+"€" : "-"}</td>
      <td class="${corClasse(dDir)}">${dDir}</td>
      <td>${mInd ? mInd.toLocaleString()+"€" : "-"}</td>
      <td class="${corClasse(dInd)}">${dInd}</td>
      <td><button class="btn" onclick='abrirModal(${JSON.stringify(ap)})'>Ver</button></td>
    `;

    tbody.appendChild(tr);
  });
}
function abrirModal(ap) {

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
    
    <p><b>Piso:</b> ${ap.Piso}</p>
    <p><b>Tipologia:</b> ${ap.Tipologia}</p>
    <p><b>Vista:</b> ${ap.Vista}</p>
    <p><b>Preço:</b> ${ap.PVP.toLocaleString()}€</p>

    <hr>

    <h4>🔴 Diretos (${direto.length})</h4>
    ${listaDetalhada(direto)}

    <h4>🟠 Indiretos (${indireto.length})</h4>
    ${listaDetalhada(indireto)}

    <h4>🟡 Pouco concorrente (${pouco.length})</h4>
    ${listaDetalhada(pouco)}
  `;
}

function listaDetalhada(arr) {
  if (!arr.length) return "<p>Nenhum encontrado</p>";

  return arr.map(d => `
    <div style="margin-bottom:5px;">
      ${d.Empreendimento} - ${d["Fração"]} — ${d.PVP.toLocaleString()}€
    </div>
  `).join("");
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}
