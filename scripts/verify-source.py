"""Verify an exported source ZIP without extracting or executing its contents."""
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path, PurePosixPath

root = Path(__file__).resolve().parent.parent
version = sys.argv[1] if len(sys.argv) > 1 else json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
if not re.fullmatch(r'\d+\.\d+\.\d+', version):
    raise ValueError('Invalid version')
archive_path = root / 'release' / f'JECTIVE-Robotics-Studio-{version}-source.zip'
checked = 0
with zipfile.ZipFile(archive_path) as archive:
    names = archive.namelist()
    if len({name.casefold() for name in names}) != len(names):
        raise ValueError('Duplicate source paths')
    bad = archive.testzip()
    if bad:
        raise ValueError('ZIP CRC failure: ' + bad)
    for name in names:
        path = PurePosixPath(name)
        if path.is_absolute() or '..' in path.parts or '\\' in name or ':' in name:
            raise ValueError('Unsafe source path: ' + name)
        target = (root / name).resolve()
        if not target.is_relative_to(root):
            raise ValueError('Source path escapes workspace')
        if archive.read(name) != target.read_bytes():
            raise ValueError('Archive differs from current source: ' + name)
        checked += 1
    package = json.loads(archive.read('package.json'))
    lock = json.loads(archive.read('package-lock.json'))
    if package['version'] != version or lock['version'] != version or lock['packages']['']['version'] != version:
        raise ValueError('Version mismatch')
report = {'version': version, 'filesCompared': checked, 'crc': 'PASS', 'sourceBytes': 'PASS',
          'sizeBytes': archive_path.stat().st_size,
          'sha256': hashlib.sha256(archive_path.read_bytes()).hexdigest(),
          'scope': 'Every ZIP entry CRC and byte comparison against the current workspace; package/lock version equality. No execution or clean-machine build claim.'}
destination = root / 'evidence' / 'releases' / version / 'source-verification.json'
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(report, indent=2))
