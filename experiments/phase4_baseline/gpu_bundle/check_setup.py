"""Check that this machine is ready to train, and estimate the time.
(Cell 5 of the Colab notebook; step 6 of RUN_ON_GPU_LAPTOP.md.)

  python check_setup.py                  all checks + a 1-epoch timing test (about 5 minutes)
  python check_setup.py --skip-timing    all checks + a short test run only (used when resuming)

It checks Python, the data files, the packages, the GPU(s) and CPU cores, then does a short real training
run. Ends with "ALL CHECKS PASSED" or a PROBLEM message.
"""
import hashlib
import json
import os
import platform
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from train_all import DATASETS, EPOCHS, PARALLEL_MIN_CPUS, ROOT, split_file, train_command

ALLOW_CPU = '--allow-cpu' in sys.argv  # only for testing these scripts on a computer without a GPU
SKIP_TIMING = '--skip-timing' in sys.argv  # used when resuming on Colab: no need to measure the speed again


def step(number, text):
    print(f'\n[{number}/5] {text}')


def fail(message):
    print(f'\nPROBLEM: {message}\nOn a laptop: see "Troubleshooting" in RUN_ON_GPU_LAPTOP.md. '
          f'On Colab: please send this message to the student.')
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
    if sys.version_info < (3, 10):
        fail('this needs Python 3.10 or newer; 3.12 is what we tested (see step 4 of the instructions).')
    if sys.version_info[:2] != (3, 12):
        print('  Note: we tested with Python 3.12. This version should work too; the test run in step 5 will tell.')

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

    step(4, 'GPU and CPU')
    if torch.cuda.is_available():
        for i in range(torch.cuda.device_count()):
            gpu = torch.cuda.get_device_properties(i)
            x = torch.randn(2000, 2000, device=f'cuda:{i}')
            (x @ x).sum().item()
            print(f'  GPU {i}: {gpu.name}, {gpu.total_memory / 1024 ** 3:.0f} GB memory. A test calculation worked.')
    elif ALLOW_CPU:
        print('  No GPU found; continuing on the CPU because --allow-cpu was given (testing only).')
    else:
        fail('PyTorch cannot see a GPU. On Colab: Runtime -> Change runtime type -> GPU, then Run all. '
             'On a laptop: check the driver (step 3 of RUN_ON_GPU_LAPTOP.md) and that requirements-gpu.txt '
             'was installed.')
    cores = os.cpu_count() or 1
    together = cores >= PARALLEL_MIN_CPUS
    print(f'  {cores} CPU cores, so train_all.py will train the three datasets '
          + ('AT THE SAME TIME.' if together else 'one after another.'))

    step(5, 'Test training run on Davis' + ('' if SKIP_TIMING else ', then 1 full epoch to measure the speed (a few minutes)'))
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        tmp = Path(tmp)
        small = {}
        for part, rows in (('train', 200), ('val', 50), ('test', 50)):
            small[part] = tmp / f'{part}.csv'
            pd.read_csv(split_file('davis', part)).sample(rows, random_state=0).to_csv(small[part], index=False)
        startup = timed_run(train_command('davis', tmp / 'small', epochs=1, files=small, resume=False))
        print(f'  A short test training run worked ({startup:.0f} s).')
        if SKIP_TIMING:
            print('\nALL CHECKS PASSED. Next step: run train_all.py')
            return
        full = timed_run(train_command('davis', tmp / 'full', epochs=1, resume=False))
    epoch = max(full - startup, 1)
    seconds_per_row = epoch / count_rows(split_file('davis', 'train'))
    print(f'  1 epoch of Davis took about {epoch:.0f} s (plus {startup:.0f} s of start-up).')

    print(f'\nEstimated training time ({EPOCHS} epochs each, if trained on its own):')
    hours = {}
    for dataset in DATASETS:
        rows = count_rows(split_file(dataset, 'train'))
        hours[dataset] = seconds_per_row * rows * EPOCHS / 3600
        print(f'  {dataset:6s} {rows:>7,} training rows  ~{hours[dataset]:4.1f} hours')
    if together:
        longest = max(hours.values())
        print(f'  all three at the same time: roughly {longest:.0f}-{1.5 * longest:.0f} hours '
              f'(about as long as the longest one, a bit more because they share the machine)')
    else:
        print(f'  one after another: about {sum(hours.values()):.0f} hours in total')
    print('  (Measured without the extra batch-preparing workers that Linux/Colab runs use, '
          'so these figures are on the safe side.)')
    print('\nALL CHECKS PASSED. Next step: run train_all.py')


if __name__ == '__main__':
    main()
