"""Local canonical workbook tests; no Google services or customer records."""
import copy
import hashlib
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
import uuid
import zipfile
from xml.etree import ElementTree as ET
from pathlib import Path
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import update_belaformosa as migration
from data_workbook import Q, read_dados, verify


class WorkbookTests(unittest.TestCase):
    def setUp(self):
        base=Path(os.environ.get("THE_VIEW_TEST_TMPDIR",tempfile.gettempdir())).resolve()
        folder=base/("the-view-workbook-"+uuid.uuid4().hex)
        folder.mkdir(mode=0o777)
        def cleanup():
            assert not folder.is_symlink() and folder.resolve().parent==base
            for name in ("data.xlsx","data.json","source.json"):
                (folder/name).unlink(missing_ok=True)
            folder.rmdir()
        if os.environ.get("THE_VIEW_KEEP_TEST_TMPDIR")!="1":
            self.addCleanup(cleanup)
        self.workbook=folder/"data.xlsx"
        self.output=folder/"data.json"
        self.manifest=folder/"source.json"
        self.original=subprocess.check_output(["git","show","658da6f:data.xlsx"],cwd=ROOT)
        self.workbook.write_bytes(self.original)
        self.expected=json.loads((ROOT/"data.json").read_text(encoding="utf-8"))
        self.incoming=[copy.deepcopy(r) for r in self.expected if r["Empreendimento"]=="BelaFormosa"]
        for record in self.incoming:
            record.setdefault("Vista mínima",None)
            record.setdefault("Vista máxima",None)

    def apply(self):
        with patch.object(migration,"extract",return_value=(self.incoming,{"records":216})):
            migration.migrate(Path("not-used.pdf"),self.workbook,self.output,self.manifest)

    def test_canonical_values_and_native_parts_preserved(self):
        self.apply()
        verify(self.workbook,self.output)
        self.assertTrue(json.loads(self.output.read_text(encoding="utf-8"))==self.expected,"Canonical records differ")
        with zipfile.ZipFile(io.BytesIO(self.original)) as original,zipfile.ZipFile(self.workbook) as current:
            self.assertEqual(original.namelist(),current.namelist())
            allowed={"xl/worksheets/sheet1.xml","xl/tables/table1.xml","xl/worksheets/sheet3.xml"}
            self.assertEqual({name for name in original.namelist() if original.read(name)!=current.read(name)},allowed)
            _,entries,sheet=read_dados(current)
            self.assertEqual(len(entries),535)
            self.assertEqual([n for n,_ in entries],list(range(2,537)))
            if sheet.find(Q("dimension")) is not None:
                self.assertEqual(sheet.find(Q("dimension")).get("ref"),"A1:AP536")
            self.assertEqual(ET.fromstring(current.read("xl/tables/table1.xml")).get("ref"),"A1:AP536")

    def test_repeated_import_has_no_additions_or_changes(self):
        self.apply()
        digest=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
        before=(digest(self.workbook),digest(self.output))
        self.apply()
        self.assertEqual((digest(self.workbook),digest(self.output)),before)

    def test_source_validation_failure_preserves_original(self):
        with patch.object(migration,"extract",side_effect=ValueError("Invalid source")):
            with self.assertRaises(ValueError):
                migration.migrate(Path("invalid.pdf"),self.workbook,self.output,self.manifest)
        self.assertEqual(self.workbook.read_bytes(),self.original)
        self.assertFalse(self.output.exists())


if __name__=="__main__":
    unittest.main()
