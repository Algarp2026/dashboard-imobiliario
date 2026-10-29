"""Explicit, idempotent local migration; never accesses commercial storage."""
import argparse
import hashlib
import json
import os
import re
import tempfile
import zipfile
from collections import Counter
from pathlib import Path
from statistics import median
from xml.etree import ElementTree as ET

from data_workbook import ROOT, Q, OPTIONAL_COLUMNS, column_name, dados_path, generate, put_value, read_dados

PRICES = [675000,785000,420000,535000,510000,795000,675000,425000,1200000,830000,
          440000,515000,500000,735000,705000,1300000,880000,465000,395000,440000,
          745000,775000,1075000,940000,490000,815000,510000,565000,545000,1175000,
          1025000,515000,795000,935000,800000,1750000,1150000,545000,1300000]
FIELDS = OPTIONAL_COLUMNS[1:]
LOCALITIES = {
    "The View": ("Olhão", "Empreendimento The View Olhão"),
    "BelaFormosa": ("Olhão", "BelaFormosa Price List September 2026, p. 1"),
    "EVO Lux Garden": ("Faro", "https://libertas.pt/portfolio/"),
    "Palácio BR Avenida": ("Faro", "https://palaciobravenida.pt/localizacao/"),
    "Del Mar Waterfront": ("Olhão", "https://residential.jll.pt/imovel/apartamento-t1-com-varanda-em-olhao-algarve/19744519"),
}
ROW = re.compile(r"^(\d{3})\s+([A-Z])\s+(T[123](?:\s*\+?\s*Rooftop|\s+Duplex)?)\s+"
                 r"(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+([\d,]+\.\d{2})\s+", re.I)


def extract(pdf):
    from pypdf import PdfReader
    reader = PdfReader(pdf)
    if len(reader.pages) != 7 or "September 2026" not in reader.pages[0].extract_text():
        raise ValueError("Expected the original seven-page September 2026 price list.")
    # Pages split merged block labels; unit order is validated against each block.
    block = "LB"
    previous = 0
    records = []
    anomalies = []
    for page_number, page in enumerate(reader.pages, 1):
        if page_number == 6:
            block, previous = "RF", 0
        for line in page.extract_text().splitlines():
            match = ROW.match(line)
            if not match:
                continue
            unit, source_type, typology, interior, exterior, total, price = match.groups()
            number = int(unit)
            if number < previous:
                block = {"LB":"LF", "LF":"RB"}[block]
            previous = number
            floor, position = divmod(number, 100)
            interior, exterior, total = map(float, (interior, exterior, total))
            price = float(price.replace(",", ""))
            code = block + unit
            reserved = "RESERVED" in line
            product = "Rooftop" if "rooftop" in typology.lower() else "Duplex" if "duplex" in typology.lower() else "Convencional"
            low, high = None, None
            view_note = "Implantação por validar; não existe classe de vista confirmada."
            if block in ("LF", "RF") and position in (4, 5):
                low, high = 1, 1
                view_note = "Posição frontal 4/5; estimativa de exposição à Ria, não confirmada por altura."
            elif block in ("LF", "RF") and position in (6, 7, 8):
                low, high = 2, 3
                view_note = "Posição interior frontal; intervalo preliminar 2–3, sem confirmação por altura."
            elif block in ("LB", "RB") and position in (6, 7, 8, 9):
                low, high = 2, 3
                view_note = "Posição posterior 6–9; intervalo preliminar 2–3, sem confirmação por altura."
            elif (block in ("LF", "RF") and position in (1, 2, 3)) or (block in ("LB", "RB") and position in (2, 3, 4, 5)):
                low, high = 3, 4
                view_note = "Posição lateral; intervalo preliminar 3–4, sem confirmação por altura."
            elif block in ("LB", "RB") and position in (1, 10, 11):
                low, high = 3, 4
                view_note = "Posição lateral/retaguarda; intervalo preliminar 3–4, sem confirmação por altura."
            notes = ["Preço pedido, não transação. Garagem/arrecadação não incluídas.",
                     "Desconto de 5% mencionado na fonte não aplicado automaticamente.",
                     "Tipologia de planta: " + source_type + ".", view_note]
            if abs(interior + exterior - total) > .02:
                anomalies.append({"unit":code,"problem":"Interior + exterior differ from the source total"})
                notes.append("Área total da fonte diverge da soma interior + exterior; validar antes de usar €/m² total.")
            if reserved:
                notes.append("Reservado, não vendido. Preço extraído mantido por autorização da gestão; não constitui oferta ativa.")
            records.append({
                "Empreendimento":"BelaFormosa", "Fração":code, "Piso":floor,
                "Tipologia":re.sub(r"\s*\+?\s*Rooftop", " Rooftop", typology, flags=re.I),
                "Vista":None, "ABP":interior, "Varanda/Terraço":exterior,
                "Área Total":total, "PVP":int(price), "Ano Referência":2026,
                "Sem Varanda/Terraço":price/interior, "Com Varanda/Terraço":price/total,
                "Status":"Reservado" if reserved else "Ativo", "Fonte":f"BelaFormosa · Price List September 2026 · p. {page_number}",
                "URL":None, "Data de atualização":"2026-09", "Segmento":"Premium local",
                "Condição":"Nova construção", "Ano de entrega":None,
                "Garagem":"Não incluído no preço; disponibilidade por confirmar", "Piscina":None,
                "Distância ao The View":None, "Peso comparável":.9,
                "Camada compset":"A · Premium local; vistas estimadas", "Qualidade dados":"Média" if code not in {x["unit"] for x in anomalies} else "Baixa",
                "Observações comerciais":" ".join(notes), "Ação recomendada":"Confirmar vista, orientação, disponibilidade e condições atuais.",
                "Prioridade atualização":"Alta" if reserved else "Média", "Bloco":block,
                "Tipo produto":product, "Vista mínima":low, "Vista máxima":high,
                "Confiança vista":"Estimada · média" if low is not None and floor >= 4 else "Estimada · baixa",
                "Fonte vista":"Estimativa de implantação fornecida pela gestão; piso considerado sem confirmação geométrica.",
                "Preço visível na fonte":"Não · reservado" if reserved else "Sim",
                "Localidade":LOCALITIES["BelaFormosa"][0], "Fonte localidade":LOCALITIES["BelaFormosa"][1],
            })
    counts = Counter(r["Bloco"] for r in records)
    if len(records) != 216 or counts != {"LB":60,"RB":60,"LF":48,"RF":48} or len({r["Fração"] for r in records}) != 216:
        raise ValueError(f"Invalid coverage: {len(records)} rows, {dict(counts)}")
    for block, count in counts.items():
        actual = {r["Fração"] for r in records if r["Bloco"] == block}
        expected = {block+str(f*100+p) for f in range(1,5) for p in range(1,12 if block in ("LB","RB") else 9)}
        expected |= {block+str(500+p) for p in range(1,10 if block in ("LB","RB") else 9)}
        expected |= {block+str(600+p) for p in (range(2,9) if block=="LB" else range(1,8) if block=="RB" else range(1,9))}
        if actual != expected:
            raise ValueError("Unexpected unit coverage: " + block)
    return records, {"source":"BelaFormosa Price List September 2026", "sha256":hashlib.sha256(pdf.read_bytes()).hexdigest(),
                     "pages":7,"records":216,"blocks":dict(counts),"reserved":sum(r["Status"]=="Reservado" for r in records),
                     "products":dict(Counter(r["Tipo produto"] for r in records)),"anomalies":anomalies,
                     "estimatedViewRanges":sum(r["Vista mínima"] is not None for r in records),
                     "viewsStillUnclassified":sum(r["Vista mínima"] is None for r in records),
                     "viewClassification":"Preliminary estimates; no confirmed exact views", "discountApplied":False,
                     "reservedPrices":"Retained by explicit user approval; not active offers or completed sales"}


def migrate(pdf, workbook, output, manifest):
    incoming, audit = extract(pdf)
    if len(PRICES) != 39 or sum(PRICES) != 29675000:
        raise ValueError("Invalid independent recommendation table")
    with zipfile.ZipFile(workbook) as archive:
        headers, entries, sheet = read_dados(archive)
        before = [r for _, r in entries]
        old_external = [r for r in before if r["Empreendimento"] not in ("The View","BelaFormosa")]
        if len(old_external) != 280:
            raise ValueError("Expected 280 existing external records; no data will be discarded")
        view = [r for r in before if r["Empreendimento"] == "The View"]
        if {r["Fração"] for r in view} != {f"Apartamento {i}" for i in range(1,40)} or len(view) != 39:
            raise ValueError("Invalid The View coverage")
        xml_rows = {int(r.get("r")):r for r in sheet.findall(f"{Q('sheetData')}/{Q('row')}")}
        for field in FIELDS:
            if field not in headers:
                headers.append(field)
                put_value(xml_rows[1], column_name(len(headers)), field, 70)
        cols=sheet.find(Q("cols"))
        if cols is not None:
            for field,width in zip(FIELDS,(10,18,12,12,24,58,26,18,58)):
                index=headers.index(field)+1
                column=next((c for c in cols if c.get("min")==str(index) and c.get("max")==str(index)),None)
                if column is None:
                    column=ET.SubElement(cols,Q("col"),{"min":str(index),"max":str(index)})
                column.set("width",str(width))
                column.set("customWidth","1")
        for number, record in entries:
            if record["Empreendimento"] in LOCALITIES:
                for field, value in zip(("Localidade", "Fonte localidade"), LOCALITIES[record["Empreendimento"]]):
                    put_value(xml_rows[number], column_name(headers.index(field)+1), value, 74)
            if record["Empreendimento"] == "The View":
                n = int(re.search(r"\d+",record["Fração"])[0])
                updates = {"Preço Recomendado":PRICES[n-1], "Versão Análise":"2026-10"}
                previous_reason = record.get("Justificação Técnica", "")
                prefix = "Preço recomendado da análise independente de outubro de 2026, conforme tabela técnica validada. Não substitui o preço comercial atual. "
                context_label = "Enquadramento anterior (setembro de 2026): "
                if previous_reason.startswith((prefix,"Preço recomendado definido pela gestão em outubro de 2026.")):
                    _, found, context = previous_reason.partition(context_label)
                    if not found:
                        raise ValueError("Unexpected recommendation provenance; explicit review required")
                    previous_reason = context
                updates["Justificação Técnica"] = prefix + context_label + previous_reason
                if n in (3,11):
                    updates["Garagem"] = "Sem estacionamento"
                for field, value in updates.items():
                    put_value(xml_rows[number], column_name(headers.index(field)+1), value)
        existing = {r["Fração"]:(n,r) for n,r in entries if r["Empreendimento"]=="BelaFormosa"}
        if existing and set(existing) != {r["Fração"] for r in incoming}:
            raise ValueError("Existing BelaFormosa records differ; explicit review required")
        for number, _ in existing.values():
            sheet.find(Q("sheetData")).remove(xml_rows.pop(number))
        next_row = max(n for n,r in entries if r["Empreendimento"]!="BelaFormosa")+1
        for number in range(next_row,next_row+len(incoming)):
            if number in xml_rows:
                sheet.find(Q("sheetData")).remove(xml_rows.pop(number))
        for record in incoming:
            number = next_row
            next_row += 1
            row = xml_rows.get(number)
            if row is None:
                row = ET.SubElement(sheet.find(Q("sheetData")), Q("row"), {"r":str(number),"ht":"72","customHeight":"1"})
            for index, field in enumerate(headers, 1):
                if field in record:
                    style = 95 if field in ("PVP","Sem Varanda/Terraço","Com Varanda/Terraço") else 97 if field in ("ABP","Varanda/Terraço","Área Total","Peso comparável") else 94
                    put_value(row, column_name(index), record[field], style)
        last_row = max(next_row-1,max(xml_rows))
        ref = f"A1:{column_name(len(headers))}{last_row}"
        dimension = sheet.find(Q("dimension"))
        if dimension is not None:
            dimension.set("ref", ref)
        table = ET.fromstring(archive.read("xl/tables/table1.xml"))
        if table.get("name") != "DadosCompset":
            raise ValueError("Missing canonical table")
        table.set("ref",ref)
        if table.find(Q("autoFilter")) is not None:
            table.find(Q("autoFilter")).set("ref",ref)
        columns = table.find(Q("tableColumns"))
        known = {c.get("name") for c in columns}
        for index, field in enumerate(headers,1):
            if field not in known:
                ET.SubElement(columns,Q("tableColumn"),{"id":str(index),"name":field})
        columns.set("count",str(len(headers)))
        changes = {dados_path(archive):ET.tostring(sheet,encoding="utf-8",xml_declaration=True),
                   "xl/tables/table1.xml":ET.tostring(table,encoding="utf-8",xml_declaration=True)}
        summary_path="xl/worksheets/sheet3.xml"
        summary=ET.fromstring(archive.read(summary_path))
        summary_rows={int(r.get("r")):r for r in summary.find(Q("sheetData"))}
        all_rows=old_external+view+incoming
        for number,value in ((4,len(all_rows)),(6,len(old_external)+len(incoming)),
                             (8,sum(r.get("Ano Referência")==2026 for r in all_rows)),(9,9)):
            put_value(summary_rows[number],"B",value)
        put_value(summary_rows[9],"C","BelaFormosa integrado; oito fontes concorrenciais anteriores preservadas.")
        ratios=[r["PVP"]/r["Área Total"] for r in incoming]
        for column,value in zip("ABCDEF",("BelaFormosa",216,round(median(ratios)),round(min(ratios)),round(max(ratios)),
                                          "Lista setembro 2026; 20 reservas, não vendas; vistas estimadas; estacionamento não incluído.")):
            template=next((c for c in summary_rows[20].findall(Q("c")) if c.get("r")==column+"20"),None)
            put_value(summary_rows[22],column,value,template.get("s") if template is not None else None)
        summary_rows[22].set("ht","44")
        summary_rows[22].set("customHeight","1")
        put_value(summary_rows[24],"A","Total recomendado The View",74)
        put_value(summary_rows[24],"B",sum(PRICES),73)
        put_value(summary_rows[24],"C","Análise independente · outubro 2026; não altera PVP ou preços comerciais atuais.",74)
        summary_rows[24].set("ht","32")
        summary_rows[24].set("customHeight","1")
        summary_cols=summary.find(Q("cols"))
        if summary_cols is not None:
            for index,width in enumerate((36,22,24,18,18,85),1):
                column=next((c for c in summary_cols if c.get("min")==str(index) and c.get("max")==str(index)),None)
                if column is None:
                    column=ET.SubElement(summary_cols,Q("col"),{"min":str(index),"max":str(index)})
                column.set("width",str(width))
                column.set("customWidth","1")
        for number in (*range(4,10),*range(13,23),24):
            row=summary_rows[number]
            row.set("ht","80" if number in (9,24) else "44")
            row.set("customHeight","1")
            for cell in row.findall(Q("c")):
                column=re.match(r"[A-Z]+",cell.get("r"))[0]
                cell.set("s","95" if (13<=number<=22 and column in "CDE") or (number==24 and column=="B") else "94")
        summary_rows[12].set("ht","36")
        summary_rows[12].set("customHeight","1")
        changes[summary_path]=ET.tostring(summary,encoding="utf-8",xml_declaration=True)
        with tempfile.NamedTemporaryFile(dir=workbook.parent,suffix=".xlsx",delete=False) as tmp:
            temporary = Path(tmp.name)
        try:
            with zipfile.ZipFile(temporary,"w") as target:
                for item in archive.infolist():
                    target.writestr(item,changes.get(item.filename,archive.read(item.filename)))
            with zipfile.ZipFile(temporary) as check:
                _, checked, _ = read_dados(check)
                after = [r for _,r in checked]
                assert len(after)==535
                without_geo = lambda r: {k:v for k,v in r.items() if k not in ("Localidade", "Fonte localidade")}
                assert [without_geo(r) for r in after if r["Empreendimento"] not in ("The View","BelaFormosa")]==[without_geo(r) for r in old_external]
                for original in view:
                    updated = next(r for r in after if r["Empreendimento"]=="The View" and r["Fração"]==original["Fração"])
                    assert {k:v for k,v in updated.items() if k not in ("Preço Recomendado","Versão Análise","Justificação Técnica","Garagem","Localidade","Fonte localidade")}=={k:v for k,v in original.items() if k not in ("Preço Recomendado","Versão Análise","Justificação Técnica","Garagem","Localidade","Fonte localidade")}
                    if original["Fração"] not in ("Apartamento 3","Apartamento 11"):
                        assert updated["Garagem"]==original["Garagem"]
        except Exception:
            temporary.unlink(missing_ok=True)
            raise
    try:
        os.replace(temporary,workbook)
    finally:
        temporary.unlink(missing_ok=True)
    generate(workbook,output)
    manifest.parent.mkdir(parents=True,exist_ok=True)
    manifest.write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(audit,ensure_ascii=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf",type=Path)
    parser.add_argument("--apply",action="store_true",help="Explicit local workbook/data.json update")
    args = parser.parse_args()
    if args.apply:
        migrate(args.pdf,ROOT/"data.xlsx",ROOT/"data.json",ROOT/"docs/belaformosa/source-manifest.json")
    else:
        _, audit = extract(args.pdf)
        print(json.dumps(audit,ensure_ascii=False,indent=2))
