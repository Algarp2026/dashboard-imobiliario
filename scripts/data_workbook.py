"""Read Dados from data.xlsx; optionally reconcile one incoming compset workbook.

Normal updates: python scripts/data_workbook.py
The --reconcile operation is a one-time migration for the September 2026 workbook.
"""

import argparse
import json
import os
import posixpath
import re
import tempfile
import zipfile
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG = "http://schemas.openxmlformats.org/package/2006/relationships"
Q = lambda name: f"{{{NS}}}{name}"
ANALYSIS = (
    "Preço Recomendado", "Versão Análise", "Confiança Recomendação",
    "Justificação Técnica", "Segmento Análise", "Disponibilidade Análise",
)


def dados_path(archive):
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    sheet = next((s for s in workbook.findall(f"{Q('sheets')}/{Q('sheet')}")
                  if s.get("name") == "Dados"), None)
    if sheet is None:
        raise ValueError("Falta a folha Dados.")
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rid = sheet.get(f"{{{REL}}}id")
    target = next((r.get("Target") for r in rels.findall(f"{{{PKG}}}Relationship")
                   if r.get("Id") == rid), None)
    if not target:
        raise ValueError("Não foi encontrada a relação da folha Dados.")
    return posixpath.normpath(target.lstrip("/") if target.startswith("/")
                             else posixpath.join("xl", target))


def shared_strings(archive):
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    return ["".join(t.text or "" for t in si.iter(Q("t")))
            for si in root.findall(Q("si"))]


def cell_value(cell, strings):
    if cell is None:
        return None
    kind = cell.get("t")
    if kind == "inlineStr":
        return "".join(t.text or "" for t in cell.iter(Q("t")))
    value = cell.find(Q("v"))
    if value is None or value.text is None:
        return None
    if kind == "s":
        return strings[int(value.text)]
    if kind in ("str", "e", "d"):
        return value.text
    if kind == "b":
        return value.text == "1"
    number = float(value.text)
    return int(number) if number.is_integer() else number


def read_dados(archive):
    sheet = ET.fromstring(archive.read(dados_path(archive)))
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    properties = workbook.find(Q("workbookPr"))
    date_base = (datetime(1904, 1, 1) if properties is not None and
                 properties.get("date1904") in ("1", "true") else datetime(1899, 12, 30))
    strings = shared_strings(archive)
    xml_rows = sheet.findall(f"{Q('sheetData')}/{Q('row')}")
    if not xml_rows:
        raise ValueError("A folha Dados está vazia.")
    header_cells = {re.match(r"[A-Z]+", c.get("r")).group(): c
                    for c in xml_rows[0].findall(Q("c"))}
    headers = []
    for index in range(1, len(header_cells) + 1):
        name = cell_value(header_cells.get(column_name(index)), strings)
        if not name or name in headers:
            raise ValueError("Cabeçalhos vazios ou repetidos na folha Dados.")
        headers.append(name)
    for required in ("Empreendimento", "Fração", "PVP", "ABP", "Área Total"):
        if required not in headers:
            raise ValueError(f"Falta a coluna {required}.")
    rows = []
    for xml_row in xml_rows[1:]:
        cells = {re.match(r"[A-Z]+", c.get("r")).group(): c
                 for c in xml_row.findall(Q("c"))}
        values = [cell_value(cells.get(column_name(i)), strings)
                  for i in range(1, len(headers) + 1)]
        if not any(value is not None and value != "" for value in values):
            continue
        record = {}
        for header, value in zip(headers, values):
            if header == "Data de atualização" and isinstance(value, (int, float)):
                date = date_base + timedelta(days=value)
                value = date.date().isoformat() if date.time() == datetime.min.time() else date.isoformat()
            if value is not None or header not in ANALYSIS:
                record[header] = value
        rows.append((int(xml_row.get("r")), record))
    return headers, rows, sheet


def column_name(number):
    result = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        result = chr(65 + remainder) + result
    return result


def put_value(row, column, value, style=None):
    address = f"{column}{row.get('r')}"
    cell = next((c for c in row.findall(Q("c")) if c.get("r") == address), None)
    if cell is None:
        cell = ET.SubElement(row, Q("c"), {"r": address})
    if style is not None:
        cell.set("s", str(style))
    old = cell.find(Q("v"))
    if old is not None:
        cell.remove(old)
    inline = cell.find(Q("is"))
    if inline is not None:
        cell.remove(inline)
    if value is None:
        cell.attrib.pop("t", None)
    elif isinstance(value, (int, float)):
        cell.set("t", "n")
        ET.SubElement(cell, Q("v")).text = str(value)
    else:
        cell.set("t", "inlineStr")
        ET.SubElement(ET.SubElement(cell, Q("is")), Q("t")).text = str(value)


def reconcile(source, baseline, output):
    old_rows = json.loads(baseline.read_text(encoding="utf-8"))
    old_view = {r["Fração"]: r for r in old_rows if r.get("Empreendimento") == "The View"}
    if len(old_view) != 39 or any(not all(r.get(key) for key in ANALYSIS[:5]) for r in old_view.values()):
        raise ValueError("A base atual não contém as 39 análises técnicas esperadas.")
    with zipfile.ZipFile(source) as archive:
        headers, entries, sheet = read_dados(archive)
        new_view = [(number, r) for number, r in entries if r.get("Empreendimento") == "The View"]
        if len(new_view) != 39 or {r["Fração"] for _, r in new_view} != set(old_view):
            raise ValueError("As frações The View não correspondem à base atual.")
        if any(key in headers for key in ANALYSIS):
            raise ValueError("As colunas de análise já existem; migração cancelada.")
        header_row = sheet.find(f"{Q('sheetData')}/{Q('row')}")
        for index, key in enumerate(ANALYSIS, len(headers) + 1):
            put_value(header_row, column_name(index), key, 70)
        rows_by_number = {int(row.get("r")): row for row in sheet.findall(f"{Q('sheetData')}/{Q('row')}")}
        for number, current in new_view:
            row = rows_by_number[number]
            original = old_view[current["Fração"]]
            price = original["PVP"]
            put_value(row, "I", price)
            for col, denominator in (("K", current["ABP"]), ("L", current["Área Total"])):
                put_value(row, col, price / denominator if denominator else None)
            for index, key in enumerate(ANALYSIS, len(headers) + 1):
                if original.get(key) is not None:
                    put_value(row, column_name(index), original[key], 73 if key == ANALYSIS[0] else 74)
        cols = sheet.find(Q("cols"))
        for index, width in enumerate((18, 17, 21, 58, 19, 24), len(headers) + 1):
            ET.SubElement(cols, Q("col"), {"min": str(index), "max": str(index),
                                                 "width": str(width), "customWidth": "1"})
        table = ET.fromstring(archive.read("xl/tables/table1.xml"))
        if table.get("name") != "DadosCompset":
            raise ValueError("A tabela DadosCompset não foi encontrada.")
        table.set("ref", f"A1:{column_name(len(headers) + len(ANALYSIS))}{max(n for n, _ in entries)}")
        columns = table.find(Q("tableColumns"))
        columns.set("count", str(len(headers) + len(ANALYSIS)))
        for index, key in enumerate(ANALYSIS, len(headers) + 1):
            ET.SubElement(columns, Q("tableColumn"), {"id": str(index), "name": key})
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        calc = workbook.find(Q("calcPr"))
        if calc is None:
            calc = ET.SubElement(workbook, Q("calcPr"))
        calc.set("fullCalcOnLoad", "1")
        calc.set("forceFullCalc", "1")
        changes = {dados_path(archive): ET.tostring(sheet, encoding="utf-8", xml_declaration=True),
                   "xl/tables/table1.xml": ET.tostring(table, encoding="utf-8", xml_declaration=True),
                   "xl/workbook.xml": ET.tostring(workbook, encoding="utf-8", xml_declaration=True)}
        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=output.parent, suffix=".xlsx", delete=False) as tmp:
            temp_path = Path(tmp.name)
        try:
            with zipfile.ZipFile(temp_path, "w") as result:
                for item in archive.infolist():
                    result.writestr(item, changes.get(item.filename, archive.read(item.filename)))
            with zipfile.ZipFile(temp_path) as check:
                _, generated, _ = read_dados(check)
                if len(generated) != len(entries):
                    raise ValueError("A migração alterou o número de registos.")
                for (_, before), (_, after) in zip(entries, generated):
                    if before.get("Empreendimento") != "The View":
                        if before != {key: value for key, value in after.items() if key not in ANALYSIS}:
                            raise ValueError("A migração alterou dados de um concorrente.")
                    else:
                        original = old_view[before["Fração"]]
                        if after["PVP"] != original["PVP"] or any(
                            after.get(key) != original.get(key) for key in ANALYSIS
                        ):
                            raise ValueError("A migração não preservou preço/análise The View.")
            os.replace(temp_path, output)
        finally:
            temp_path.unlink(missing_ok=True)
    print(f"Excel reconciliado: {output} ({len(entries)} registos)")


def generate(workbook, output):
    with zipfile.ZipFile(workbook) as archive:
        _, entries, _ = read_dados(archive)
    rows = [record for _, record in entries]
    if not rows:
        raise ValueError("A folha Dados não tem registos.")
    payload = json.dumps(rows, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n"
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=output.parent, suffix=".json", delete=False) as tmp:
        tmp.write(payload)
        temp_path = Path(tmp.name)
    try:
        os.replace(temp_path, output)
    finally:
        temp_path.unlink(missing_ok=True)
    print(f"Exportados {len(rows)} registos para {output}")
    for development, count in sorted(Counter(r["Empreendimento"] for r in rows).items()):
        print(f"  {development}: {count}")


def verify(workbook, output):
    with zipfile.ZipFile(workbook) as archive:
        _, entries, _ = read_dados(archive)
    expected = [record for _, record in entries]
    actual = json.loads(output.read_text(encoding="utf-8"))
    if actual != expected:
        raise ValueError("data.json não corresponde à folha Dados de data.xlsx.")
    print(f"data.json confere com Dados: {len(expected)} registos")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gerar data.json a partir da folha Dados do Excel")
    parser.add_argument("--reconcile", type=Path, help="Excel anexo a migrar (operação única)")
    parser.add_argument("--baseline-json", type=Path, default=ROOT / "data.json")
    parser.add_argument("--check", action="store_true", help="Verificar sem escrever ficheiros")
    args = parser.parse_args()
    if args.reconcile and args.check:
        parser.error("--reconcile e --check não podem ser usados em conjunto")
    if args.reconcile:
        reconcile(args.reconcile, args.baseline_json, ROOT / "data.xlsx")
    elif args.check:
        verify(ROOT / "data.xlsx", ROOT / "data.json")
    else:
        generate(ROOT / "data.xlsx", ROOT / "data.json")
