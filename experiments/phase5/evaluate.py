"""Phase 5: compare the experiments and write results.md.

  python evaluate.py

Reads $PERCEIVER_RUNS (or ./runs) and reports, for each experiment, the validation score it was
selected on, the epoch it stopped at, and the test score. Also prints the Phase 4 numbers for
reference.

ON THE TEST SET: see the note at the top of run_experiment.py. Deciding between A and B from the
test column spends one look at the test set; that is stated in the output rather than hidden.
"""
import os
import re
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
ROOT = HERE if (HERE / 'model_2d').exists() else HERE.parent.parent
RUNS = Path(os.environ.get('PERCEIVER_RUNS', HERE / 'runs'))

# Phase 4 baselines (fold-0 novel pair) and the paper, for reference
PHASE4 = {'davis': {'test_mse': 0.716, 'test_ci': 0.622}, 'metz': {'test_mse': 0.762, 'test_ci': 0.634},
          'kiba': {'test_mse': 0.575, 'test_ci': 0.565}}
PAPER = {'davis': 0.463, 'metz': 0.658, 'kiba': 0.522}


def read_run(name):
    directory = RUNS / name
    scores = directory / 'test_scores.csv'
    if not scores.exists():
        return None
    table = pd.read_csv(scores)
    log = (directory / 'verbose.log').read_text(errors='replace') if (directory / 'verbose.log').exists() else ''
    best = re.findall(r'best validation mse = ([0-9.]+) on epoch (\d+)', log)
    curve = [float(x) for x in re.findall(r'Validation mse = ([0-9.]+)', log)]
    return {'test_mse': float(table.iloc[0]['Fold 0 mse']),
            'test_ci': float(table.iloc[1]['Mean mse']) if len(table) > 1 else None,
            'best_val': float(best[-1][0]) if best else None,
            'best_epoch': int(best[-1][1]) if best else None,
            'epochs_run': len(curve),
            'val_curve': curve}


def main():
    try:
        from run_experiment import EXPERIMENTS
    except ImportError:
        import sys
        sys.path.insert(0, str(HERE))
        from run_experiment import EXPERIMENTS

    results = {name: read_run(name) for name in EXPERIMENTS}
    done = {k: v for k, v in results.items() if v}
    if not done:
        raise SystemExit(f'No finished experiments found in {RUNS}. Run run_experiment.py first.')

    out = ['# Phase 5 results: does the yardstick matter?', '',
           'Each experiment trains one model and keeps the epoch with the best validation score.',
           'The two differ almost only in what that validation set measures:', '',
           '- **A** validates on unseen compounds AND unseen proteins, built like the test set.',
           '- **B** validates on random pairs whose compounds and proteins were all seen in training',
           '  (the Phase 3 / paper style). B trains on ~7% fewer rows; everything else is identical.', '',
           '| Experiment | What its validation measures | Stopped at epoch | Validation MSE | Test MSE | Test CI |',
           '|---|---|---|---|---|---|']
    for name, spec in EXPERIMENTS.items():
        r = results[name]
        if not r:
            out.append(f'| {name} | {spec["why"]} | not run | - | - | - |')
            continue
        ci = f'{r["test_ci"]:.3f}' if r['test_ci'] is not None else '-'
        out.append(f'| {name} | {spec["why"]} | {r["best_epoch"]} of {r["epochs_run"]} | '
                   f'{r["best_val"]:.3f} | **{r["test_mse"]:.3f}** | {ci} |')

    out += ['', '> The validation MSE columns are **not comparable between A and B**: they are measured',
            '> on different sets. A validates on a harder, unseen-entity set, so its number is',
            '> expected to be higher even if its model is better. Compare the test column.', '',
            '## Against Phase 4 and the paper', '',
            '| Dataset | Phase 4 test MSE | Phase 5 A | Phase 5 B | Paper (5-fold) |',
            '|---|---|---|---|---|']
    for dataset in sorted({s['dataset'] for s in EXPERIMENTS.values()}):
        a, b = results.get(f'{dataset}_A'), results.get(f'{dataset}_B')
        fmt = lambda r: f'{r["test_mse"]:.3f}' if r else 'not run'
        out.append(f'| {dataset.capitalize()} | {PHASE4[dataset]["test_mse"]:.3f} | {fmt(a)} | {fmt(b)} | '
                   f'{PAPER[dataset]:.3f} |')

    out += ['', 'Phase 4 trained on more rows than either run here (novel-pair validation wastes the',
            'mixed pairs), so a Phase 5 run matching Phase 4 is already an improvement per training row.',
            '', '## Honest note on the test set', '',
            'Training never saw the test set and no hyperparameter was tuned on it. But choosing',
            'between A and B by reading the test column above does spend one look at it. This was a',
            'single pre-planned comparison over two datasets, and both results are reported whatever',
            'they show. Later phases should keep judging on validation.']
    (HERE / 'results.md').write_text('\n'.join(out) + '\n', encoding='utf-8')

    for name in EXPERIMENTS:
        r = results[name]
        print(f'{name:9s} ' + (f'epoch {r["best_epoch"]:3d}  val {r["best_val"]:.3f}  '
                               f'TEST {r["test_mse"]:.3f}' if r else 'not run'))
    print(f'\nWrote {HERE / "results.md"}')


if __name__ == '__main__':
    main()
