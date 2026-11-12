"""Phase 5 experiments: train one model per named experiment and save everything needed to judge it.

  python run_experiment.py                 run every experiment that is not finished
  python run_experiment.py davis_A         run only the ones you name
  python run_experiment.py --list          show the experiments and exit

Runs on Kaggle, Colab, a GPU laptop or (slowly) a CPU. Results go to $PERCEIVER_RUNS, or ./runs.
Safe to stop and restart: finished experiments are skipped and an interrupted one resumes from its
last finished epoch.

THE EXPERIMENT (Phase 5 Step 1)
Step 0 found we were choosing models with the wrong yardstick: the Phase 3 validation set is 100%
compounds and proteins that are also in training, while the test set is 0%, so keeping the
best-validation epoch selected for memorising rather than for handling new inputs.

  A  train2 + novelval    validation = unseen compounds AND unseen proteins (built like the test set)
  B  train3 + randomval   validation = random pairs, all entities seen (the Phase 3/paper style)

Both validation sets are the same size and B trains on only ~7% fewer rows, so the runs differ
almost only in what the validation set measures.

ON THE TEST SET: training never sees it. This script does run the trained model on it at the end,
because chemprop reports it, but choosing between A and B from those numbers spends one look at the
test set. That is disclosed in results.md. Everything else is judged on validation.
"""
import os
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
# Works both in the repo and inside the flat Kaggle/Colab bundle, where model_2d sits next to this file.
ROOT = HERE if (HERE / 'model_2d').exists() else HERE.parent.parent
MODEL_DIR = ROOT / 'model_2d'
SPLITS = ROOT / 'data' / 'splits'
RUNS = Path(os.environ.get('PERCEIVER_RUNS', HERE / 'runs'))
EPOCHS = 150

# Label weighting, unchanged from Phase 4 (CLAUDE.md decisions D1/D2)
WEIGHTING = {
    'davis': ['--tau', '0', '5', '--alpha', '0.5', '--beta', '5'],
    'metz': ['--alpha', '0.5', '--beta', '0.5'],
    'kiba': ['--tau', '11.1', '12', '--alpha', '0.5', '--beta', '5'],
}

EXPERIMENTS = {
    'davis_A': {'dataset': 'davis', 'train': 'train2', 'val': 'novelval',
                'why': 'new yardstick: validation is unseen compounds and proteins'},
    'davis_B': {'dataset': 'davis', 'train': 'train3', 'val': 'randomval',
                'why': 'control: validation is random pairs, all entities seen'},
    'metz_A': {'dataset': 'metz', 'train': 'train2', 'val': 'novelval',
               'why': 'new yardstick: validation is unseen compounds and proteins'},
    'metz_B': {'dataset': 'metz', 'train': 'train3', 'val': 'randomval',
               'why': 'control: validation is random pairs, all entities seen'},
}
# KIBA is left out on purpose: it is ~4x the cost of the other two. Run the winner on it afterwards.


def split_file(dataset, part):
    return SPLITS / dataset / 'novel_pair' / f'fold0_{part}.csv'


def data_workers():
    """Extra processes that prepare batches. Windows re-imports torch in each one, which costs more
    than it saves. Kaggle gives 4 cores, so keep 1 spare for the main process."""
    if sys.platform == 'win32':
        return 0
    return max(0, min(4, (os.cpu_count() or 1) - 1))


def command(name, epochs):
    spec = EXPERIMENTS[name]
    dataset = spec['dataset']
    return [sys.executable, str(HERE / 'train_quiet.py'),
            '--data_path', str(split_file(dataset, spec['train'])),
            '--separate_val_path', str(split_file(dataset, spec['val'])),
            '--separate_test_path', str(split_file(dataset, 'test')),
            '--dataset_type', 'regression', '--target_columns', 'label', '--metric', 'mse',
            '--epochs', str(epochs), '--ensemble_size', '1', '--num_folds', '1',
            '--batch_size', '50', '--dropout', '0.1', '--aggregation', 'mean',
            '--seed', '0', '--pytorch_seed', '0', '--num_workers', str(data_workers()),
            '--save_dir', str(RUNS / name), '--save_preds', '--resume'] + WEIGHTING[dataset]


def finished(name):
    return (RUNS / name / 'test_scores.csv').exists()


def option(flag, default):
    return type(default)(sys.argv[sys.argv.index(flag) + 1]) if flag in sys.argv else default


def main():
    if '--list' in sys.argv:
        for name, spec in EXPERIMENTS.items():
            print(f'  {name:9s} train={spec["train"]:7s} val={spec["val"]:10s}  {spec["why"]}')
        return

    epochs = option('--epochs', EPOCHS)
    named = [a for a in sys.argv[1:] if a in EXPERIMENTS]
    todo = [n for n in (named or EXPERIMENTS) if not finished(n)]

    for name in (named or EXPERIMENTS):
        if finished(name):
            print(f'{name}: already finished, skipping.')
    if not todo:
        print('\nALL DONE. Next step: evaluate.py')
        return

    missing = [str(p) for n in todo for p in
               (split_file(EXPERIMENTS[n]['dataset'], EXPERIMENTS[n][k]) for k in ('train', 'val'))
               if not p.exists()]
    if missing:
        sys.exit('STOP: these split files are missing. Run data/make_novel_val.py first:\n  ' +
                 '\n  '.join(missing))

    print(f'Running {len(todo)} experiment(s): {", ".join(todo)}  ({epochs} epochs each, '
          f'{data_workers()} batch-preparing workers)\n', flush=True)
    started, failed = time.time(), []
    for i, name in enumerate(todo, start=1):
        spec = EXPERIMENTS[name]
        print(f'\n=== {name} ({i} of {len(todo)}): {spec["why"]} ===', flush=True)
        # Keep the progress bar but let it redraw at most once a minute. In a notebook every redraw is
        # a new output line, and at full speed 150 epochs would write hundreds of thousands of them,
        # which bloats the saved notebook and can make the browser tab unusable.
        env = dict(os.environ, TQDM_MININTERVAL='60')
        if subprocess.run(command(name, epochs), cwd=MODEL_DIR, env=env).returncode != 0:
            failed.append(name)
            break
        print(f'{name} finished after {(time.time() - started) / 3600:.1f} h in total.', flush=True)

    for name in EXPERIMENTS:
        if finished(name):
            print(f'\n{name} test scores:\n{(RUNS / name / "test_scores.csv").read_text()}')
    if failed:
        sys.exit(f'\nNot finished: {", ".join(failed)}. Run the same command again to continue.')
    print('\nALL DONE. Next step: evaluate.py')


if __name__ == '__main__':
    main()
