let data = [];

fetch('data.xlsx')
  .then(res => res.arrayBuffer())
  .then(buffer => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);

    if (!data.length) {
      document.body.innerHTML = "Erro: Excel vazio ou mal formatado";
      return;
    }

    cleanData();
    initDropdown();
  })
  .catch(err => {
    document.body.innerHTML = "Erro ao carregar data.xlsx";
    console.error(err);
  });

function cleanData() {
  data.forEach(d => {
    d.Empreendimento = String(d.Empreendimento || "").trim();

    if (d.Piso === "R/C") d.Piso = 0;
    d.Piso = Number(d.Piso || 0);

    d.PVP = Number(d.PVP || 0);
    d.Vista = Number(d.Vista || 0);
  });
}

function mapTipologia(t) {
  if (t === "T1+1" || t === "T1 Duplex") return "T2";
  return t;
}

function initDropdown() {
  const dropdown = document.getElementById("dropdown");
  const empreendimentos = [...new Set(data.map(d => d.Empreendimento).filter(Boolean))];

  if (!empreendimentos.length) {
    document.body.innerHTML = "Erro: Nenhum empreendimento encontrado";
    return;
  }

  empreendimentos.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e;
    opt.innerText = e;
    dropdown.appendChild(opt);
  });

  dropdown.onchange = () => render(dropdown.value);
  render("The View");
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
      <h3>${ap["Fração"] || "-"}</h3>
      <p><b>Piso:</b> ${ap.Piso} | <b>${ap.Tipologia}</b> | Vista ${ap.Vista}</p>
      <p><b>Preço:</b> ${ap.PVP.toLocaleString()}€</p>

      <div><b>Direto:</b> ${mDir ? mDir.toLocaleString()+"€" : "-"} | ${diff(ap.PVP, mDir)}</div>
      <div class="small">${lista(direto)}</div>

      <div><b>Indireto:</b> ${mInd ? mInd.toLocaleString()+"€" : "-"} | ${diff(ap.PVP, mInd)}</div>
      <div class="small">${lista(indireto)}</div>

      <div><b>Pouco:</b> ${mPou ? mPou.toLocaleString()+"€" : "-"} | ${diff(ap.PVP, mPou)}</div>
      <div class="small">${lista(pouco)}</div>

      <hr>
    `;

    container.appendChild(div);
  });
}
