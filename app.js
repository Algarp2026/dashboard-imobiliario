let data = [];

fetch('data.xlsx')
  .then(res => res.arrayBuffer())
  .then(buffer => {
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);

    clean();
    render();
  });

function clean() {
  data.forEach(d => {
    if (d.Piso === "R/C") d.Piso = 0;
    d.Piso = Number(d.Piso);
    d.PVP = Number(d.PVP);
  });
}

function mapTipologia(t) {
  return (t === "T1+1" || t === "T1 Duplex") ? "T2" : t;
}

function media(arr) {
  if (!arr.length) return null;
  return arr.reduce((a,b)=>a+b.PVP,0)/arr.length;
}

function diff(p, m) {
  if (!m) return "-";
  return ((p/m -1)*100);
}

function arrow(v) {
  if (v === "-") return "";
  return v > 0 ? "▲" : "▼";
}

function classe(v) {
  if (v === "-") return "";
  return v > 0 ? "up" : "down";
}

function render() {
  const grid = document.getElementById("grid");

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

    const dDir = diff(ap.PVP, media(direto));
    const dInd = diff(ap.PVP, media(indireto));

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="badge">${ap.Tipologia}</div>

      <b>${ap["Fração"]}</b><br>
      Piso ${ap.Piso} • Vista ${ap.Vista}

      <div class="price">${ap.PVP.toLocaleString()}€</div>

      <div class="diff ${classe(dDir)}">
        ${dDir === "-" ? "-" : `${arrow(dDir)} ${Math.abs(dDir).toFixed(1)}% vs Direto`}
      </div>

      <div class="diff ${classe(dInd)}">
        ${dInd === "-" ? "-" : `${arrow(dInd)} ${Math.abs(dInd).toFixed(1)}% vs Indireto`}
      </div>

      <button class="btn">Ver análise</button>
    `;

    card.onclick = () => abrirModal(ap);

    grid.appendChild(card);
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
    <p><b>${ap.Tipologia}</b> • Piso ${ap.Piso} • Vista ${ap.Vista}</p>
    <p><b>Preço:</b> ${ap.PVP.toLocaleString()}€</p>

    ${sec("🔴 Diretos", direto)}
    ${sec("🟠 Indiretos", indireto)}
    ${sec("🟡 Pouco concorrente", pouco)}
  `;
}

function sec(titulo, arr) {
  if (!arr.length) return `<div class="section"><b>${titulo}</b><p>Nenhum encontrado</p></div>`;

  return `
    <div class="section">
      <b>${titulo} (${arr.length})</b>
      ${arr.map(d => `
        <div class="comp">
          <span>${d.Empreendimento} - ${d["Fração"]}</span>
          <span>${d.PVP.toLocaleString()}€</span>
        </div>
      `).join("")}
    </div>
  `;
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}
