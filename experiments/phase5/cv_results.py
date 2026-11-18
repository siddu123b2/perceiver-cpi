"""Step D: the 5-fold cross-validation result for Davis and Metz.

  python cv_results.py        ->  cv_results.md

Every number we had reported until now came from fold 0. The paper reports a 5-fold mean and
standard deviation, so a single fold could not be compared with it honestly. This runs all five.

Fold 0 is the Phase 4 baseline; folds 1-4 are Step D. All five use identical settings - the
standard fold{k}_train / fold{k}_val split, 150 epochs, one model, seed 0 - so they are comparable
with each other and with the paper's protocol, apart from the paper's ensemble of three.

Note that these are NOT the models the app serves. The served Davis model is a two-seed,
400-epoch ensemble on fold 0 (test MSE 0.622); this script measures the plain Phase 4 recipe.
"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE if (HERE / 'data' / 'splits').exists() else HERE.parent.parent
RUNS = HERE / 'runs'
PHASE4 = ROOT / 'experiments' / 'phase4_baseline' / 'runs'

sys.path.insert(0, str(HERE))
from protein_sensitivity import measure   # noqa: E402

PAPER = {
    'davis': {'mse': 0.463, 'mse_sd': 0.013, 'ci': 0.638, 'ci_sd': 0.028},
    'metz': {'mse': 0.658, 'mse_sd': 0.016, 'ci': 0.675, 'ci_sd': 0.012},
}


def fold_dir(dataset, fold):
    return PHASE4 / dataset if fold == 0 else RUNS / f'{dataset}_cv{fold}'


def read(path):
    rows = (path / 'test_scores.csv').read_text().splitlines()
    mse, ci = float(rows[1].split(',')[1]), float(rows[2].split(',')[1])
    best_val, best_epoch = None, None
    for line in (path / 'verbose.log').read_text(errors='ignore').splitlines():
        if 'best validation mse' in line:
            parts = line.split()
            best_val, best_epoch = float(parts[parts.index('=') + 1]), int(parts[-1])
    return mse, ci, best_val, best_epoch


def collect(dataset):
    folds = {}
    for fold in range(5):
        path = fold_dir(dataset, fold)
        if not (path / 'test_scores.csv').exists():
            print(f'{dataset} fold {fold}: missing, skipped')
            continue
        mse, ci, best_val, best_epoch = read(path)
        sensitivity = measure(path / 'test_preds.csv', dataset, 'test', fold=fold)
        folds[fold] = {'mse': mse, 'ci': ci, 'best_val': best_val, 'best_epoch': best_epoch,
                       'rank': sensitivity['rank_corr'], 'captured': sensitivity['captured'],
                       'compounds': sensitivity['compounds'], 'rows': sensitivity['rows']}
    return folds


def stats(values):
    a = np.array(values, dtype=float)
    return float(a.mean()), float(a.std(ddof=1)) if len(a) > 1 else 0.0


def main():
    everything = {}
    lines = ['# Step D: 5-fold cross-validation', '',
             'Until now every number in this project came from **fold 0**. The paper reports a',
             '5-fold mean and standard deviation, so a single fold could not be set beside it',
             'honestly. These are all five folds, at identical settings (standard split, 150',
             'epochs, one model, seed 0). Fold 0 is the Phase 4 baseline; folds 1-4 are Step D.', '',
             '> These are **not** the models the app serves. The served Davis model is a two-seed,',
             '> 400-epoch ensemble on fold 0 (test MSE 0.622). This page measures the plain Phase 4',
             '> recipe, because that is what can be compared across folds and with the paper.', '']

    for dataset in ('davis', 'metz'):
        folds = collect(dataset)
        if not folds:
            continue
        everything[dataset] = folds
        mse_mean, mse_sd = stats([f['mse'] for f in folds.values()])
        ci_mean, ci_sd = stats([f['ci'] for f in folds.values()])
        rank_mean, rank_sd = stats([f['rank'] for f in folds.values()])
        cap_mean, _ = stats([f['captured'] for f in folds.values()])
        paper = PAPER[dataset]

        lines += [f'## {dataset.capitalize()}', '',
                  '| Fold | Test MSE | Test CI | Best epoch | Protein rank | Test compounds |',
                  '|---|---|---|---|---|---|']
        for fold, f in sorted(folds.items()):
            tag = ' (Phase 4)' if fold == 0 else ''
            lines.append(f'| {fold}{tag} | {f["mse"]:.3f} | {f["ci"]:.3f} | {f["best_epoch"]} | '
                         f'{f["rank"]:+.3f} | {f["compounds"]} |')
        lines += ['',
                  '| | MSE | CI |', '|---|---|---|',
                  f'| **Ours, 5-fold** | **{mse_mean:.3f} ± {mse_sd:.3f}** | {ci_mean:.3f} ± {ci_sd:.3f} |',
                  f'| Paper, 5-fold | {paper["mse"]:.3f} ± {paper["mse_sd"]:.3f} | {paper["ci"]:.3f} ± {paper["ci_sd"]:.3f} |',
                  f'| Fold 0 alone (what we reported before) | {folds[0]["mse"]:.3f} | {folds[0]["ci"]:.3f} |',
                  '',
                  f'Within-compound protein rank correlation across folds: '
                  f'**{rank_mean:+.3f} ± {rank_sd:.3f}**, capturing {cap_mean:.0%} of the true '
                  f'spread when the protein changes.', '']

    # ---- the two things worth saying out loud
    davis = everything.get('davis', {})
    metz = everything.get('metz', {})
    if davis and metz:
        d_mean, d_sd = stats([f['mse'] for f in davis.values()])
        m_mean, m_sd = stats([f['mse'] for f in metz.values()])
        d_rank, d_rank_sd = stats([f['rank'] for f in davis.values()])
        m_rank, m_rank_sd = stats([f['rank'] for f in metz.values()])
        lines += [
            '## What this changes (2026-11-18)', '',
            '**1. Fold 0 was an easy fold, and our earlier numbers were flattered by it.**',
            f'Davis goes from {davis[0]["mse"]:.3f} on fold 0 to **{d_mean:.3f}** averaged over five;',
            f'Metz from {metz[0]["mse"]:.3f} to **{m_mean:.3f}**. Every single-fold figure in this',
            'project should be read with that in mind.', '',
            '**2. Our fold-to-fold spread is an order of magnitude larger than the paper\'s.**',
            f'Davis ranges from {min(f["mse"] for f in davis.values()):.3f} to '
            f'{max(f["mse"] for f in davis.values()):.3f} (sd {d_sd:.3f}); the paper reports '
            f'± {PAPER["davis"]["mse_sd"]:.3f}. Metz sd {m_sd:.3f} against ± '
            f'{PAPER["metz"]["mse_sd"]:.3f}. That is 10-15x wider.',
            'Part of it is their ensemble of three per fold, which averages variance away, and part',
            'may be hyperparameters we do not have. But a gap this size is not fully explained by',
            'either, and we should say so rather than wave it through: under this split protocol,',
            'folds genuinely differ in difficulty, and a tight standard deviation is surprising.', '',
            '**3. The protein-sensitivity finding survives, and is now measured on five folds',
            'rather than one.**',
            f'Davis {d_rank:+.3f} ± {d_rank_sd:.3f}, Metz {m_rank:+.3f} ± {m_rank_sd:.3f}, against a',
            'ceiling of about +0.41. Holding the compound fixed and changing the protein, the',
            'ordering the model produces is still close to chance. This was the weakest-evidenced',
            'claim in the project - 14 compounds on a single fold - and it now rests on all five.', '']

    (HERE / 'cv_results.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    (HERE / 'cv_metrics.json').write_text(json.dumps(everything, indent=2) + '\n', encoding='utf-8')

    print(f'{"":8s} {"MSE":>16s} {"CI":>16s} {"protein rank":>16s}')
    for dataset, folds in everything.items():
        mse_mean, mse_sd = stats([f['mse'] for f in folds.values()])
        ci_mean, ci_sd = stats([f['ci'] for f in folds.values()])
        rank_mean, rank_sd = stats([f['rank'] for f in folds.values()])
        print(f'{dataset:8s} {mse_mean:7.3f} +/- {mse_sd:.3f} {ci_mean:7.3f} +/- {ci_sd:.3f} '
              f'{rank_mean:+8.3f} +/- {rank_sd:.3f}')
    print(f'\nWrote {HERE / "cv_results.md"}')


if __name__ == '__main__':
    main()
