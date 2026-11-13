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
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
MIN_PROTEINS = 5

# (label, predictions file, dataset)
RUNS = [
    ('Phase 4 Davis', ROOT / 'experiments/phase4_baseline/runs/davis/test_preds.csv', 'davis'),
    ('Phase 5 davis_A', HERE / 'runs/davis_A/test_preds.csv', 'davis'),
    ('Phase 5 davis_B', HERE / 'runs/davis_B/test_preds.csv', 'davis'),
    ('Phase 4 Metz', ROOT / 'experiments/phase4_baseline/runs/metz/test_preds.csv', 'metz'),
    ('Phase 5 metz_A', HERE / 'runs/metz_A/test_preds.csv', 'metz'),
    ('Phase 5 metz_B', HERE / 'runs/metz_B/test_preds.csv', 'metz'),
]


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


def main():
    results = {label: measure(path, dataset) for label, path, dataset in RUNS
               if Path(path).exists()}

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

    out += ['', '## What this says', '',
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
            '**Keep this metric alongside MSE from now on.**']
    (HERE / 'protein_sensitivity.md').write_text('\n'.join(out) + '\n', encoding='utf-8')

    print(f'{"run":16s} {"MSE":>6s} {"spread captured":>16s} {"rank corr":>10s}')
    for label, r in results.items():
        print(f'{label:16s} {r["mse"]:6.3f} {r["captured"]:15.0%} {r["rank_corr"]:+10.3f}')
    print(f'\nWrote {HERE / "protein_sensitivity.md"}')


if __name__ == '__main__':
    main()
