"""Can the model tell proteins apart at all? The question the app actually depends on.

  .venv\\Scripts\\python.exe experiments\\phase5\\protein_sensitivity.py

Overall MSE and CI can look respectable while a model is really just predicting a per-compound
average. That would be fatal for our app, where the user picks a compound AND a protein and expects
the answer to depend on both.

So we hold the compound fixed and vary the protein, over the test compounds that appear with at
least MIN_PROTEINS proteins, and ask two things:

  spread captured   how far our answers move when the protein changes, as a share of how far the
                    true labels move. 100% would be right; 0% means a flat answer per compound.
  rank correlation  within one compound, does our ordering of the proteins match the truth?
                    1.0 = perfect ordering, 0.0 = no better than shuffling them.

Writes protein_sensitivity.md next to this file.
"""
import os
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
# Works both in the repo and inside the flat Kaggle/Colab bundle, where data/ sits next to this file.
ROOT = HERE if (HERE / 'data' / 'splits').exists() else HERE.parent.parent
RUNS_DIR = Path(os.environ.get('PERCEIVER_RUNS', HERE / 'runs'))
DATASETS = ('davis', 'metz', 'kiba')
MIN_PROTEINS = 5


def find_runs():
    """Every finished run we can see, as (label, predictions file, dataset).

    Discovered rather than listed, so a new experiment appears here without editing this file, and
    so it works inside the Kaggle bundle, where only some of the runs are present.
    """
    found = []
    for dataset in DATASETS:
        path = ROOT / 'experiments' / 'phase4_baseline' / 'runs' / dataset / 'test_preds.csv'
        if path.exists():
            found.append((f'Phase 4 {dataset}', path, dataset))
    for folder in sorted(RUNS_DIR.glob('*')) if RUNS_DIR.exists() else []:
        dataset = next((d for d in DATASETS if folder.name.startswith(d)), None)
        if dataset and (folder / 'test_preds.csv').exists():
            found.append((folder.name, folder / 'test_preds.csv', dataset))
    return found


def measure(predictions_path, dataset):
    test = pd.read_csv(ROOT / 'data' / 'splits' / dataset / 'novel_pair' / 'fold0_test.csv')
    test['pred'] = pd.read_csv(predictions_path)['label'].to_numpy(float)
    enough = test.groupby('smiles').filter(lambda g: len(g) >= MIN_PROTEINS)
    by_compound = enough.groupby('smiles')
    true_spread = by_compound['label'].std().mean()
    our_spread = by_compound['pred'].std().mean()
    ranks = by_compound.apply(lambda g: g['label'].corr(g['pred'], method='spearman'),
                              include_groups=False)
    return {'compounds': int(by_compound.ngroups), 'rows': int(len(enough)),
            'true_spread': float(true_spread), 'our_spread': float(our_spread),
            'captured': float(our_spread / true_spread),
            'rank_corr': float(ranks.mean()), 'rank_corr_sd': float(ranks.std()),
            'mse': float(np.mean((test['label'] - test['pred']) ** 2))}


def headroom(dataset):
    """Ceilings. Each 'perfect' figure uses the TEST labels, so it is an upper bound nothing can
    reach, not a target. They show how much of the signal needs the protein and how much does not."""
    test = pd.read_csv(ROOT / 'data' / 'splits' / dataset / 'novel_pair' / 'fold0_test.csv')
    y = test['label'].to_numpy(float)
    overall = y.mean()
    per_compound = test.groupby('smiles')['label'].transform('mean').to_numpy()
    per_protein = test.groupby('sequence')['label'].transform('mean').to_numpy()
    return {'guess_average': float(np.mean((y - overall) ** 2)),
            'perfect_compound_only': float(np.mean((y - per_compound) ** 2)),
            'perfect_additive': float(np.mean((y - (per_compound + per_protein - overall)) ** 2))}


def main():
    runs = find_runs()
    if not runs:
        raise SystemExit(f'no finished runs with test_preds.csv under {RUNS_DIR}')
    results = {label: measure(path, dataset) for label, path, dataset in runs}

    out = ['# Can the model tell proteins apart?', '',
           'Overall MSE and CI can look reasonable while a model is really predicting one number per',
           'compound. The app needs the answer to depend on the protein too, so this measures exactly',
           'that: hold the compound fixed, vary the protein.', '',
           f'Over test compounds appearing with at least {MIN_PROTEINS} proteins.', '',
           '| Run | Test MSE | True spread | Our spread | Spread captured | Rank correlation within a compound |',
           '|---|---|---|---|---|---|']
    for label, r in results.items():
        out.append(f'| {label} | {r["mse"]:.3f} | {r["true_spread"]:.2f} | {r["our_spread"]:.2f} | '
                   f'{r["captured"]:.0%} | **{r["rank_corr"]:+.3f}** |')

    out += ['', '## What this said at Step 1 (2026-11-13)', '',
            '**The rank correlations are indistinguishable from zero, and some are negative.** Within a',
            'single compound, the order in which our models rank proteins is no better than shuffling',
            'them. The models move only 16-37% as far as they should when the protein changes.', '',
            'So the models behave close to "one number per compound". That matches the Step 0 finding',
            'that compound identity drives 69-95% of our predictions and protein identity only 3-14%.', '',
            '**This is the thing that matters for the app.** A user picks a drug *and* a protein. If the',
            'answer barely depends on the protein, the tool cannot do its job, however good the overall',
            'MSE looks.', '',
            '**It also means overall MSE and CI hide the problem.** A per-compound average scores',
            'respectably on both, because different compounds really do have different average',
            'affinities. Phase 5 davis_A improved MSE (0.716 to 0.644) while its protein sensitivity',
            'got *worse* (rank correlation +0.021 to -0.050). Optimising MSE alone is steering us away',
            'from what the app needs.', '',
            '**Keep this metric alongside MSE from now on.**', '',
            '## How much room is there, and how much of it needs the protein?', '',
            'Each "perfect" column uses the test labels, so it is a ceiling nothing can reach, not a',
            'target. Lower is better throughout.', '',
            '| Dataset | Our best | Guess the average | Perfect compound-only | Perfect compound + protein | Paper |',
            '|---|---|---|---|---|---|']
    best_ours = {'davis': 0.644, 'metz': 0.719}
    paper = {'davis': 0.463, 'metz': 0.658}
    for dataset in ('davis', 'metz'):
        if not (ROOT / 'data' / 'splits' / dataset / 'novel_pair' / 'fold0_test.csv').exists():
            continue
        h = headroom(dataset)
        out.append(f'| {dataset.capitalize()} | {best_ours[dataset]:.3f} | {h["guess_average"]:.3f} | '
                   f'{h["perfect_compound_only"]:.3f} | {h["perfect_additive"]:.3f} | {paper[dataset]:.3f} |')
    out += ['', 'Two things follow.', '',
            '**On Davis the protein genuinely matters, and the paper is using it.** Knowing the protein',
            'as well as the compound moves the ceiling from 0.541 to 0.420. The paper scores 0.463,',
            'which is *better than any compound-only model could ever be* (0.541). Ours is 0.644, worse',
            'than that ceiling. So the paper really does read the protein and we really do not.', '',
            '**On Metz almost all the signal is in the compound.** The ceiling barely moves when the',
            'protein is added (0.332 to 0.326). Yet we score 0.719, miles above 0.332, so our compound',
            'modelling alone has a lot of room. Metz is the wrong dataset to judge protein work on.', '',
            '**We are below the compound-only ceiling on both datasets**, so part of the gap needs no',
            'protein breakthrough at all.']
    (HERE / 'protein_sensitivity.md').write_text('\n'.join(out) + '\n', encoding='utf-8')

    print(f'{"run":16s} {"MSE":>6s} {"spread captured":>16s} {"rank corr":>10s}')
    for label, r in results.items():
        print(f'{label:16s} {r["mse"]:6.3f} {r["captured"]:15.0%} {r["rank_corr"]:+10.3f}')
    print(f'\nWrote {HERE / "protein_sensitivity.md"}')


if __name__ == '__main__':
    main()
