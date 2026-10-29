"""Step 8 of RUN_ON_GPU_LAPTOP.md: train Davis -> Metz -> KIBA (one model each, novel-pair fold 0).

  .venv\\Scripts\\python.exe train_all.py           train all three, in this order
  .venv\\Scripts\\python.exe train_all.py metz      train only the datasets you name

Safe to stop at any time (Ctrl+C, power cut, restart): run the same command again and it carries on
from the last finished epoch. Datasets that already finished are skipped.

Settings = the Phase 4 decisions in CLAUDE.md: the repo README settings (150 epochs, batch 50,
dropout 0.1, aggregation mean), seed 0, one model, and label weighting D1/D2 below.
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUNS = ROOT / 'runs'
DATASETS = ['davis', 'metz', 'kiba']
EPOCHS = 150

# Label weighting (paper section 3.1, decisions D1/D2): weight alpha inside the crowded label range tau,
# beta outside it. alpha also sets the protein CNN's residual scale, so it stays 0.5 everywhere.
WEIGHTING = {
    'davis': ['--tau', '0', '5', '--alpha', '0.5', '--beta', '5'],     # the paper's Davis example
    'metz': ['--alpha', '0.5', '--beta', '0.5'],                       # same weight for every row = no weighting
    'kiba': ['--tau', '11.1', '12', '--alpha', '0.5', '--beta', '5'],  # paper: 71.96% of KIBA lies in 11.1-12
}


def split_file(dataset, part):
    return ROOT / 'data' / 'splits' / dataset / 'novel_pair' / f'fold0_{part}.csv'


def train_command(dataset, save_dir, epochs=EPOCHS, files=None, resume=True):
    """The train.py command for one dataset. `files` can replace the train/val/test files (timing test)."""
    files = files or {part: split_file(dataset, part) for part in ('train', 'val', 'test')}
    return [sys.executable, 'train.py',
            '--data_path', str(files['train']), '--separate_val_path', str(files['val']),
            '--separate_test_path', str(files['test']),
            '--dataset_type', 'regression', '--target_columns', 'label', '--metric', 'mse',
            '--epochs', str(epochs), '--ensemble_size', '1', '--num_folds', '1',
            '--batch_size', '50', '--dropout', '0.1', '--aggregation', 'mean',
            '--seed', '0', '--pytorch_seed', '0', '--num_workers', '0',
            '--save_dir', str(save_dir), '--save_preds'] + WEIGHTING[dataset] + (['--resume'] if resume else [])


def keep_awake():
    """Ask Windows not to go to sleep while this script runs (the screen may still switch off)."""
    if sys.platform == 'win32':
        import ctypes
        ES_CONTINUOUS, ES_SYSTEM_REQUIRED = 0x80000000, 0x00000001
        ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED)


def option(name, default):
    """Read `--name value` from the command line (only used to test these scripts)."""
    return type(default)(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default


def main():
    import torch
    named = [a for a in sys.argv[1:] if a in DATASETS]
    datasets = named or DATASETS
    epochs = option('--epochs', EPOCHS)
    if not torch.cuda.is_available() and '--allow-cpu' not in sys.argv:
        sys.exit('STOP: PyTorch cannot see the NVIDIA GPU, and training on the CPU would take days.\n'
                 'Run check_setup.py and see "Troubleshooting" in RUN_ON_GPU_LAPTOP.md.')
    keep_awake()

    for i, dataset in enumerate(datasets, start=1):
        save_dir = RUNS / dataset
        if (save_dir / 'test_scores.csv').exists():
            print(f'\n{dataset}: already finished, skipping.')
            continue
        print(f'\n=== Training {dataset} ({i} of {len(datasets)}) ===')
        print(f'The progress bar shows: epochs done/{epochs} [time so far < time left]. Leave this window open.',
              flush=True)
        try:
            result = subprocess.run(train_command(dataset, save_dir, epochs), cwd=ROOT / 'model_2d')
        except KeyboardInterrupt:
            sys.exit(f'\nStopped. To continue later, run the same command again: it resumes {dataset} '
                     f'from the last finished epoch.')
        if result.returncode != 0:
            sys.exit(f'\nTraining {dataset} stopped with an error (see above). Run the same command again to '
                     f'continue; if the same error comes back, copy the last 30 lines to Claude.')
        print(f'\n{dataset} finished. Test scores:')
        print((save_dir / 'test_scores.csv').read_text())

    print('\nALL DONE. Next step: .venv\\Scripts\\python.exe pack_results.py')


if __name__ == '__main__':
    main()
