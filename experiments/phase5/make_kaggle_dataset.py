"""Build the zip to upload to Kaggle as a Dataset, plus the notebook that runs there.

  .venv\\Scripts\\python.exe experiments\\phase5\\make_kaggle_dataset.py

Writes, into experiments/phase5/kaggle_upload/:
  perceiver_cpi_data.zip      upload this as a Kaggle Dataset (Kaggle unzips it for you)
  Perceiver_CPI_phase5.ipynb  upload this as a Kaggle Notebook

Step-by-step instructions for the user are in KAGGLE_GUIDE.md.
"""
import hashlib
import json
import shutil
import subprocess
import zipfile
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SPLITS = ROOT / 'data' / 'splits'
UPLOAD = HERE / 'kaggle_upload'
OUT = UPLOAD / 'perceiver_cpi_data.zip'

DATASETS = ['davis', 'metz', 'kiba']   # kiba is included now so it never needs re-uploading
PARTS = ['train2', 'novelval', 'train3', 'randomval', 'test']
SCRIPTS = ['run_experiment.py', 'train_quiet.py', 'evaluate.py',
           'protein_sensitivity.py', 'make_esm_bank.py']


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True).stdout.strip()


def main():
    files = {}
    for name in SCRIPTS:
        path = HERE / name
        if not path.exists():
            raise SystemExit(f'missing {path}')
        files[name] = path
    files.update({f'model_2d/{p.relative_to(ROOT / "model_2d").as_posix()}': p
                  for p in (ROOT / 'model_2d').rglob('*')
                  if p.is_file() and '__pycache__' not in p.parts})
    for dataset in DATASETS:
        for part in PARTS:
            path = SPLITS / dataset / 'novel_pair' / f'fold0_{part}.csv'
            if not path.exists():
                raise SystemExit(f'missing {path}. Run data/make_novel_val.py first.')
            files[f'data/splits/{dataset}/novel_pair/fold0_{part}.csv'] = path

    dirty = ' (with uncommitted changes)' if git('status', '--porcelain') else ''
    info = (f'Perceiver CPI, Phase 5 experiments\n'
            f'Built {datetime.now():%Y-%m-%d %H:%M} from git commit {git("rev-parse", "--short", "HEAD")}{dirty}\n')

    UPLOAD.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as zf:
        for name, path in sorted(files.items()):
            zf.write(path, name)
        zf.writestr('BUNDLE_INFO.txt', info)

    manifest = {name: hashlib.md5(path.read_bytes()).hexdigest()
                for name, path in files.items() if name.startswith('data/')}
    (UPLOAD / 'data_md5.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')

    for notebook in ('Perceiver_CPI_phase5.ipynb', 'Perceiver_CPI_stepB.ipynb'):
        if (HERE / notebook).exists():
            shutil.copy2(HERE / notebook, UPLOAD / notebook)
    print(info + f'Wrote {len(files) + 1} files to {OUT} ({OUT.stat().st_size / 1024 ** 2:.1f} MB)')
    print(f'Upload folder: {UPLOAD}')


if __name__ == '__main__':
    main()
