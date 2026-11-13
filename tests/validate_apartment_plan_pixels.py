"""Verify decoded pixels, including hidden RGB and alpha, without changing assets."""
from pathlib import Path
from PIL import Image
import hashlib
import io
import json
import os
import zipfile

repo=Path(__file__).resolve().parent.parent
records=json.loads((repo/'tests/fixtures/apartment-plan-assets.json').read_text())
source=json.loads((repo/'tests/fixtures/apartment-plan-source.json').read_text())
archive=None
if os.environ.get('PLAN_SOURCE_ZIP'):
    archive_path=Path(os.environ['PLAN_SOURCE_ZIP'])
    assert hashlib.sha256(archive_path.read_bytes()).hexdigest()==source['sha256']
    archive=zipfile.ZipFile(archive_path)
for record in records:
    image=Image.open(repo/record['path']).convert('RGBA')
    assert image.size==(3000,2222)
    assert hashlib.sha256(image.tobytes()).hexdigest()==record['rgbaSha256']
    if archive:
        original=archive.read(record['source'])
        assert hashlib.sha256(original).hexdigest()==record['originalSha256']
        assert Image.open(io.BytesIO(original)).convert('RGBA').tobytes()==image.tobytes()
if archive:
    archive.close()
print(json.dumps({'images':len(records),'fractions':39,'losslessRGBA':True,'originalZIPCompared':bool(archive)}))
