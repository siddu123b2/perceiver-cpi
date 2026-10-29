"""Build perceiver_gpu_bundle.zip: everything the borrowed NVIDIA laptop needs for Phase 4.

Run from the project root (after data/make_splits.py):
  .venv\\Scripts\\python.exe experiments\\phase4_baseline\\make_bundle.py

The zip holds one folder, perceiver_gpu/, with:
  RUN_ON_GPU_LAPTOP.md, check_setup.py, train_all.py, pack_results.py   (from gpu_bundle/)
  model_2d/                                   the model code, incl. requirements-gpu.txt
  data/splits/manifest.json + the 9 novel-pair fold-0 files for Davis, KIBA and Metz
  BUNDLE_INFO.txt                             date and git commit, so results can be traced back
"""
import hashlib
import json
import subprocess
import zipfile
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SPLITS = ROOT / 'data' / 'splits'
OUT = HERE / 'perceiver_gpu_bundle.zip'
TOP = 'perceiver_gpu'


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True).stdout.strip()


def main():
    manifest = json.loads((SPLITS / 'manifest.json').read_text(encoding='utf-8'))
    split_files = [f'{d}/novel_pair/fold0_{p}.csv' for d in ('davis', 'kiba', 'metz') for p in ('train', 'val', 'test')]
    for rel in split_files:
        if hashlib.md5((SPLITS / rel).read_bytes()).hexdigest() != manifest[rel]['md5']:
            raise SystemExit(f'{rel} does not match manifest.json; rebuild with data/make_splits.py first.')

    files = {f'{TOP}/{p.name}': p for p in (HERE / 'gpu_bundle').iterdir() if p.is_file()}
    files.update({f'{TOP}/model_2d/{p.relative_to(ROOT / "model_2d").as_posix()}': p
                  for p in (ROOT / 'model_2d').rglob('*') if p.is_file() and '__pycache__' not in p.parts})
    files[f'{TOP}/data/splits/manifest.json'] = SPLITS / 'manifest.json'
    files.update({f'{TOP}/data/splits/{rel}': SPLITS / rel for rel in split_files})

    dirty = ' (with uncommitted changes)' if git('status', '--porcelain') else ''
    info = f'Built {datetime.now():%Y-%m-%d %H:%M} from git commit {git("rev-parse", "--short", "HEAD")}{dirty}\n'
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as zf:
        for name, path in sorted(files.items()):
            zf.write(path, name)
        zf.writestr(f'{TOP}/BUNDLE_INFO.txt', info)
    print(f'{info}Wrote {len(files) + 1} files to {OUT} ({OUT.stat().st_size / 1024 ** 2:.1f} MB)')


if __name__ == '__main__':
    main()
