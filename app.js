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
      <td><button class="btn">Ver</button></td>
    `;

    tbody.appendChild(tr);
  });
}
