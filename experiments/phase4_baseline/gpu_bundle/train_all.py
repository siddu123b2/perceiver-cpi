"""Train Davis, Metz and KIBA: one model each, on novel-pair fold 0.
(Cell 6 of the Colab notebook; step 8 of RUN_ON_GPU_LAPTOP.md.)

  python train_all.py                train all three
  python train_all.py metz           train only the datasets you name
  python train_all.py --parallel     force: all at the same time
  python train_all.py --sequential   force: one after another, with live progress bars

Same time or one after another? The model is small, so one run leaves a powerful GPU mostly idle; the slow
part is preparing batches on the CPU. On a machine with 6+ CPU cores the three datasets therefore train at the
same time (the default there), and finish in about the time of the longest one, KIBA. With several GPUs, each
run gets its own. On Linux (Colab) extra processes also prepare the batches. None of this changes the
results: every run is its own process with the same settings and fixed seed.

Safe to stop at any time (interrupt, disconnect, restart): run it again and every unfinished dataset carries on
from its last finished epoch; finished ones are skipped.

Settings = the Phase 4 decisions in CLAUDE.md: the repo README settings (150 epochs, batch 50,
dropout 0.1, aggregation mean), seed 0, one model, and label weighting D1/D2 below.
"""
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# Results folder. The Colab notebook points this at Google Drive, so results survive a disconnect.
RUNS = Path(os.environ.get('PERCEIVER_RUNS', ROOT / 'runs'))
DATASETS = ['davis', 'metz', 'kiba']
EPOCHS = 150
PARALLEL_MIN_CPUS = 6  # enough CPU cores to keep three runs busy

# Label weighting (paper section 3.1, decisions D1/D2): weight alpha inside the crowded label range tau,
# beta outside it. alpha also sets the protein CNN's residual scale, so it stays 0.5 everywhere.
WEIGHTING = {
    'davis': ['--tau', '0', '5', '--alpha', '0.5', '--beta', '5'],     # the paper's Davis example
    'metz': ['--alpha', '0.5', '--beta', '0.5'],                       # same weight for every row = no weighting
    'kiba': ['--tau', '11.1', '12', '--alpha', '0.5', '--beta', '5'],  # paper: 71.96% of KIBA lies in 11.1-12
}


def split_file(dataset, part):
    return ROOT / 'data' / 'splits' / dataset / 'novel_pair' / f'fold0_{part}.csv'


def train_command(dataset, save_dir, epochs=EPOCHS, files=None, resume=True, num_workers=0):
    """The train.py command for one dataset. `files` can replace the train/val/test files (timing test)."""
    files = files or {part: split_file(dataset, part) for part in ('train', 'val', 'test')}
    return [sys.executable, str(ROOT / 'train_quiet.py'),  # = model_2d/train.py without RDKit's warning flood
            '--data_path', str(files['train']), '--separate_val_path', str(files['val']),
            '--separate_test_path', str(files['test']),
            '--dataset_type', 'regression', '--target_columns', 'label', '--metric', 'mse',
            '--epochs', str(epochs), '--ensemble_size', '1', '--num_folds', '1',
            '--batch_size', '50', '--dropout', '0.1', '--aggregation', 'mean',
            '--seed', '0', '--pytorch_seed', '0', '--num_workers', str(num_workers),
            '--save_dir', str(save_dir), '--save_preds'] + WEIGHTING[dataset] + (['--resume'] if resume else [])


def data_workers(n_runs):
    """Extra processes per run that prepare batches. Linux only: on Windows each one re-imports PyTorch,
    which costs more than it saves. Batch order is decided in the main process, so results don't change."""
    if sys.platform == 'win32':
        return 0
    return max(0, min(4, (os.cpu_count() or 1) // n_runs - 1))


def one_gpu(index, gpus):
    """Environment for a run that sees just one GPU (only matters with several). Picked from the GPUs this
    script may use, so on a shared server it never touches anyone else's; and a run that always sees one GPU
    can resume on any machine (its saved random-number state is for exactly one GPU)."""
    env = dict(os.environ)
    if gpus > 1:
        allowed = [g.strip() for g in os.environ.get('CUDA_VISIBLE_DEVICES', '').split(',') if g.strip()]
        allowed = allowed or [str(i) for i in range(gpus)]
        env['CUDA_VISIBLE_DEVICES'] = allowed[index % len(allowed)]
    return env


def keep_awake():
    """Ask Windows not to go to sleep while this script runs (the screen may still switch off)."""
    if sys.platform == 'win32':
        import ctypes
        ES_CONTINUOUS, ES_SYSTEM_REQUIRED = 0x80000000, 0x00000001
        ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED)


def option(name, default):
    """Read `--name value` from the command line (only used to test these scripts)."""
    return type(default)(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default


def finished(dataset):
    return (RUNS / dataset / 'test_scores.csv').exists()


def current_epoch(dataset):
    """The epoch a run is working on, from its log (train.py writes 'Epoch N' as each epoch starts)."""
    log = RUNS / dataset / 'verbose.log'
    if not log.exists():
        return None
    epochs = [int(line.split()[1]) for line in log.read_text(errors='replace').splitlines()
              if line.startswith('Epoch ') and line.split()[1].isdigit()]
    return epochs[-1] if epochs else None


def run_one_after_another(todo, epochs, gpus):
    workers = data_workers(1)
    failed = []
    for i, dataset in enumerate(todo, start=1):
        print(f'\n=== Training {dataset} ({i} of {len(todo)}) ===')
        print(f'The progress bar shows: epochs done/{epochs} [time so far < time left].', flush=True)
        result = subprocess.run(train_command(dataset, RUNS / dataset, epochs, num_workers=workers),
                                cwd=ROOT / 'model_2d', env=one_gpu(0, gpus))
        if result.returncode != 0:
            failed.append(dataset)
            break
        print(f'\n{dataset} finished.')
    return failed


def run_at_same_time(todo, epochs, gpus):
    workers = data_workers(len(todo))
    every = option('--status-every', 300)  # seconds between progress lines
    print(f'Training {", ".join(todo)} at the same time ({os.cpu_count()} CPU cores, {gpus} GPU(s), '
          f'{workers} batch-preparing workers per run).\nA progress line appears every '
          f'{f"{every // 60} min" if every >= 60 else f"{every} s"}; '
          f'full logs are in runs/<dataset>/console.log.', flush=True)
    processes, logs = {}, {}
    for i, dataset in enumerate(todo):
        (RUNS / dataset).mkdir(parents=True, exist_ok=True)
        env = one_gpu(i, gpus)  # with several GPUs, each run gets its own
        env['TQDM_DISABLE'] = '1'  # no training progress bars in the log files
        env['TQDM_MININTERVAL'] = '60'  # the prediction bars train.py keeps on: at most one update a minute
        logs[dataset] = open(RUNS / dataset / 'console.log', 'a', encoding='utf-8')
        processes[dataset] = subprocess.Popen(train_command(dataset, RUNS / dataset, epochs, num_workers=workers),
                                              cwd=ROOT / 'model_2d', stdout=logs[dataset],
                                              stderr=subprocess.STDOUT, env=env)
    start = time.time()
    first = {dataset: current_epoch(dataset) for dataset in todo}
    next_line = start + every
    try:
        while any(p.poll() is None for p in processes.values()):
            time.sleep(5)
            if time.time() >= next_line:
                next_line += every
                print(status_line(todo, processes, first, start, epochs), flush=True)
    except KeyboardInterrupt:
        for p in processes.values():
            p.terminate()
        raise
    finally:
        for log in logs.values():
            log.close()
    print(status_line(todo, processes, first, start, epochs), flush=True)
    return [dataset for dataset, p in processes.items() if p.returncode != 0 or not finished(dataset)]


def status_line(todo, processes, first, start, epochs):
    elapsed = time.time() - start
    parts = []
    for dataset in todo:
        if finished(dataset):
            parts.append(f'{dataset} done')
        elif processes[dataset].poll() is not None:
            parts.append(f'{dataset} STOPPED (see runs/{dataset}/console.log)')
        else:
            epoch = current_epoch(dataset)
            text = f'{dataset} epoch {0 if epoch is None else epoch + 1}/{epochs}'
            done_here = (epoch or 0) - (first[dataset] if first[dataset] is not None else 0)
            if epoch is not None and done_here > 0:
                text += f' (~{(epochs - epoch) * elapsed / done_here / 3600:.1f} h left)'
            parts.append(text)
    return f'[{time.strftime("%H:%M")}, {elapsed / 3600:.1f} h] ' + ' | '.join(parts)


def main():
    import torch
    epochs = option('--epochs', EPOCHS)
    if not torch.cuda.is_available() and '--allow-cpu' not in sys.argv:
        sys.exit('STOP: PyTorch cannot see a GPU, and training on the CPU would take days.\n'
                 'On Colab: Runtime -> Change runtime type -> GPU. Then run check_setup.py.')
    keep_awake()

    todo = [d for d in ([a for a in sys.argv[1:] if a in DATASETS] or DATASETS) if not finished(d)]
    for dataset in DATASETS:
        if finished(dataset):
            print(f'{dataset}: already finished, skipping.')
    if not todo:
        print('\nALL DONE. Next step: pack_results.py')
        return

    gpus = torch.cuda.device_count()
    together = len(todo) > 1 and ('--parallel' in sys.argv or
                                  ('--sequential' not in sys.argv and (os.cpu_count() or 1) >= PARALLEL_MIN_CPUS))
    try:
        failed = run_at_same_time(todo, epochs, gpus) if together else run_one_after_another(todo, epochs, gpus)
    except KeyboardInterrupt:
        sys.exit('\nStopped. Run the same command again to continue: each dataset resumes from its last '
                 'finished epoch.')

    for dataset in DATASETS:
        if finished(dataset):
            print(f'\n{dataset} test scores:\n{(RUNS / dataset / "test_scores.csv").read_text()}')
    if failed:
        sys.exit(f'\nNot finished: {", ".join(failed)} (see the output above or runs/<dataset>/console.log).\n'
                 'Run the same command again to continue; if the same error comes back, send the last 30 lines '
                 'of the log to the student.')
    print('\nALL DONE. Next step: pack_results.py')


if __name__ == '__main__':
    main()
