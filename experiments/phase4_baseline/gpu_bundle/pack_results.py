"""Step 9 of RUN_ON_GPU_LAPTOP.md: pack the trained models and results into results_to_copy.zip.

  .venv\\Scripts\\python.exe pack_results.py

Leaves out the resume files (only needed while training) and TensorBoard files, and adds
environment.txt (Python, PyTorch, GPU and package versions) so the report can say what was used.
"""
import platform
import subprocess
import sys
import zipfile
from datetime import datetime

from train_all import DATASETS, ROOT, RUNS

SKIP = ('resume.pt', '.tmp')


def environment():
    import torch
    gpu = torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none'
    packages = subprocess.run([sys.executable, '-m', 'pip', 'freeze'], capture_output=True, text=True).stdout
    return (f'Packed: {datetime.now():%Y-%m-%d %H:%M}\nPython: {platform.python_version()}\n'
            f'Windows: {platform.platform()}\nPyTorch: {torch.__version__} (CUDA {torch.version.cuda})\n'
            f'GPU: {gpu}\n\npip freeze:\n{packages}')


def main():
    finished = [d for d in DATASETS if (RUNS / d / 'test_scores.csv').exists()]
    missing = [d for d in DATASETS if d not in finished]
    if missing:
        print(f'Note: not finished yet: {", ".join(missing)}. Packing what is there.')

    out = ROOT / 'results_to_copy.zip'
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(RUNS.rglob('*')):
            if path.is_file() and not path.name.endswith(SKIP) and not path.name.startswith('events.out.tfevents'):
                zf.write(path, path.relative_to(ROOT).as_posix())
        zf.writestr('runs/environment.txt', environment())
    print(f'Packed {", ".join(finished) or "nothing"} into:\n  {out}\n  ({out.stat().st_size / 1024 ** 2:.0f} MB)')
    print('Copy this file to your own laptop (step 10 of the instructions).')


if __name__ == '__main__':
    main()
