let data = [];

fetch('data.xlsx')
  .then(res => res.arrayBuffer())
  .then(buffer => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);

    cleanData();
    initDropdown();
  });

function cleanData() {
  data.forEach(d => {
    // Converter piso
    if (d.Piso === "R/C") d.Piso = 0;
    d.Piso = Number(d.Piso);

    // Converter preço
    d.PVP = Number(d.PVP);

    // Limpar texto
    d.Empreendimento = String(d.Empreendimento).trim();
  });
}

function mapTipologia(t) {
  if (t === "T1+1" || t === "T1 Duplex") return "T2";
  return t;
}

function initDropdown() {
  const dropdown = document.getElementById("dropdown");
  const empreendimentos = [...new Set(data.map(d => d.Empreendimento))];

  empreendimentos.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e;
    opt.innerText = e;
    dropdown.appendChild(opt);
  });

  dropdown.onchange = () => render(dropdown.value);
  render("The View"); // começa já no The View
}

function media(arr) {
  if (!arr.length) return null;
  return arr.reduce((a,b)=>a+Number(b.PVP),0)/arr.length;
}

function diff(preco, media) {
  if (!media) return "-";
  return ((preco / media - 1) * 100).toFixed(1) + "%";
}

function lista(arr) {
  return arr.map(d => d.Empreendimento + " - " + d["Fração"]).join(", ") || "-";
}

function render(selected) {
  const container = document.getElementById("output");
  container.innerHTML = "";

  const base = data.filter(d => d.Empreendimento === selected);
  const comp = data.filter(d => d.Empreendimento !== selected);

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

    const pouco = comp.filter(c =>
      mapTipologia(c.Tipologia) === tip &&
      Math.abs(c.Piso - ap.Piso) <= 1
    );

    const mDir = media(direto);
    const mInd = media(indireto);
    const mPou = media(pouco);

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h3>${ap["Fração"]}</h3>
      <p><b>Piso:</b> ${ap.Piso} | <b>${ap.Tipologia}</b> | Vista ${ap.Vista}</p>
      <p><b>Preço:</b> ${ap.PVP.toLocaleString()}€</p>

      <div class="section direct">
        <b>Direto</b><br>
        Média: ${mDir ? mDir.toLocaleString() + "€" : "-"}  
        | Dif: ${diff(ap.PVP, mDir)}<br>
        <span class="small">${lista(direto)}</span>
      </div>

      <div class="section indirect">
        <b>Indireto</b><br>
        Média: ${mInd ? mInd.toLocaleString() + "€" : "-"}  
        | Dif: ${diff(ap.PVP, mInd)}<br>
        <span class="small">${lista(indireto)}</span>
      </div>

      <div class="section low">
        <b>Pouco concorrente</b><br>
        Média: ${mPou ? mPou.toLocaleString() + "€" : "-"}  
        | Dif: ${diff(ap.PVP, mPou)}<br>
        <span class="small">${lista(pouco)}</span>
      </div>
    `;

    container.appendChild(div);
  });
}