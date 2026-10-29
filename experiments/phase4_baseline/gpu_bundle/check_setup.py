"""Step 6 of RUN_ON_GPU_LAPTOP.md: check that this laptop is ready to train, and estimate the time.

  .venv\\Scripts\\python.exe check_setup.py

It checks Python, the data files, the packages and the GPU, then trains for 1 epoch to measure the speed.
Takes about 5 minutes. Ends with "ALL CHECKS PASSED" or a PROBLEM message.
"""
import hashlib
import json
import platform
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from train_all import DATASETS, EPOCHS, ROOT, split_file, train_command

ALLOW_CPU = '--allow-cpu' in sys.argv  # only for testing these scripts on a computer without a GPU


def step(number, text):
    print(f'\n[{number}/5] {text}')


def fail(message):
    print(f'\nPROBLEM: {message}\nSee "Troubleshooting" in RUN_ON_GPU_LAPTOP.md.')
    sys.exit(1)


def count_rows(path):
    with open(path, encoding='utf-8') as f:
        return sum(1 for _ in f) - 1  # minus the header line


def timed_run(command):
    start = time.time()
    result = subprocess.run(command, cwd=ROOT / 'model_2d', capture_output=True, encoding='utf-8', errors='replace')
    if result.returncode != 0:
        print(result.stdout[-3000:] + result.stderr[-3000:])
        fail('the test training run crashed (output above).')
    return time.time() - start


def main():
    step(1, 'Python version')
    print(f'  Python {platform.python_version()}')
    if sys.version_info[:2] != (3, 12):
        fail('this needs Python 3.12 (see step 4 of the instructions).')

    step(2, 'Data files (comparing each file with its fingerprint)')
    manifest = json.loads((ROOT / 'data' / 'splits' / 'manifest.json').read_text(encoding='utf-8'))
    for dataset in DATASETS:
        for part in ('train', 'val', 'test'):
            path = split_file(dataset, part)
            key = path.relative_to(ROOT / 'data' / 'splits').as_posix()
            if not path.exists() or hashlib.md5(path.read_bytes()).hexdigest() != manifest[key]['md5']:
                fail(f'{key} is missing or damaged. Unzip the bundle again.')
    print('  All 9 files are present and unchanged.')

    step(3, 'Packages')
    try:
        import pandas as pd
        import rdkit  # noqa: F401
        import tape  # noqa: F401
        import torch
    except ImportError as error:
        fail(f'a package is missing ({error}). Repeat step 5 of the instructions.')
    print(f'  PyTorch {torch.__version__}, built for CUDA {torch.version.cuda}')

    step(4, 'NVIDIA GPU')
    if torch.cuda.is_available():
        gpu = torch.cuda.get_device_properties(0)
        x = torch.randn(2000, 2000, device='cuda')
        (x @ x).sum().item()
        print(f'  Found {gpu.name} with {gpu.total_memory / 1024 ** 3:.1f} GB memory. A test calculation on it worked.')
    elif ALLOW_CPU:
        print('  No GPU found; continuing on the CPU because --allow-cpu was given (testing only).')
    else:
        if torch.version.cuda is None:
            fail('the CPU-only PyTorch is installed. Repeat step 5 with model_2d\\requirements-gpu.txt.')
        fail('PyTorch cannot see the NVIDIA GPU. Check the driver (step 3 of the instructions).')

    step(5, 'Timing test: 1 short and 1 full training epoch on Davis (a few minutes)')
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        tmp = Path(tmp)
        small = {}
        for part, rows in (('train', 200), ('val', 50), ('test', 50)):
            small[part] = tmp / f'{part}.csv'
            pd.read_csv(split_file('davis', part)).sample(rows, random_state=0).to_csv(small[part], index=False)
        startup = timed_run(train_command('davis', tmp / 'small', epochs=1, files=small, resume=False))
        full = timed_run(train_command('davis', tmp / 'full', epochs=1, resume=False))
    epoch = max(full - startup, 1)
    seconds_per_row = epoch / count_rows(split_file('davis', 'train'))
    print(f'  1 epoch of Davis took about {epoch:.0f} s (plus {startup:.0f} s of start-up).')

    print(f'\nEstimated training time ({EPOCHS} epochs each):')
    total = 0
    for dataset in DATASETS:
        rows = count_rows(split_file(dataset, 'train'))
        hours = seconds_per_row * rows * EPOCHS / 3600
        total += hours
        print(f'  {dataset:6s} {rows:>7,} training rows  ~{hours:4.1f} hours')
    print(f'  total                          ~{total:4.1f} hours')
    print('\nALL CHECKS PASSED. Next step: .venv\\Scripts\\python.exe train_all.py')


if __name__ == '__main__':
    main()
