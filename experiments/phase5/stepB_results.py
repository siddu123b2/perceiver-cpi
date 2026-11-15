"""Phase 5 Step B: does a pretrained protein encoder (ESM-2) make the model read the protein?

  python stepB_results.py        ->  stepB_results.md

Four Davis runs, all 400 epochs on the same train2/novelval split: the paper's learned protein
encoder and an ESM-2 encoder, two seeds each. Two seeds because Step 1 showed that a single run
cannot be told apart from luck.

HOW THIS IS JUDGED. The decision is made on VALIDATION (fold0_novelval: compounds and proteins that
training never saw, built the same way as the test set). Validation predictions come from
validation_preds.py, which re-runs each saved checkpoint - nothing is retrained. The test numbers
are shown too, because chemprop computes them at the end of every run, but they are reported, not
used to pick a winner.
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
ROOT = HERE if (HERE / 'data' / 'splits').exists() else HERE.parent.parent
RUNS = HERE / 'runs'
MIN_PROTEINS = 5

sys.path.insert(0, str(HERE))
from protein_sensitivity import measure   # noqa: E402

GROUPS = {'paper encoder (learned)': ['davis_base_s0', 'davis_base_s1'],
          'ESM-2 encoder': ['davis_esm_s0', 'davis_esm_s1']}


def best_validation(name):
    """The validation MSE and epoch the training run itself kept, straight from its own log."""
    for line in (RUNS / name / 'verbose.log').read_text(errors='ignore').splitlines():
        if 'best validation mse' in line:
            parts = line.split()
            return float(parts[parts.index('=') + 1]), int(parts[-1])
    return None, None


def test_scores(name):
    rows = (RUNS / name / 'test_scores.csv').read_text().splitlines()
    return float(rows[1].split(',')[1]), float(rows[2].split(',')[1])


def ceiling(part):
    """Best within-compound rank correlation a per-protein average could reach on this split.
    It uses that split's own labels, so it is an upper bound, not a target."""
    data = pd.read_csv(ROOT / 'data' / 'splits' / 'davis' / 'novel_pair' / f'fold0_{part}.csv')
    data['oracle'] = data.groupby('sequence')['label'].transform('mean')
    enough = data.groupby('smiles').filter(lambda g: len(g) >= MIN_PROTEINS)
    ranks = enough.groupby('smiles').apply(
        lambda g: g['label'].corr(g['oracle'], method='spearman'), include_groups=False)
    return float(ranks.mean())


def collect():
    results = {}
    for group, names in GROUPS.items():
        for name in names:
            folder = RUNS / name
            if not (folder / 'test_scores.csv').exists():
                print(f'{name}: not finished, skipped.')
                continue
            val_mse, epoch = best_validation(name)
            test_mse, test_ci = test_scores(name)
            row = {'group': group, 'val_mse': val_mse, 'best_epoch': epoch,
                   'test_mse': test_mse, 'test_ci': test_ci}
            if (folder / 'val_preds.csv').exists():
                v = measure(folder / 'val_preds.csv', 'davis', 'novelval')
                row.update(val_captured=v['captured'], val_rank=v['rank_corr'],
                           val_compounds=v['compounds'], val_mse_check=v['mse'])
            t = measure(folder / 'test_preds.csv', 'davis', 'test')
            row.update(test_captured=t['captured'], test_rank=t['rank_corr'])
            results[name] = row
    return results


def mean(results, names, key):
    values = [results[n][key] for n in names if n in results and results[n].get(key) is not None]
    return float(np.mean(values)) if values else float('nan')


def main():
    results = collect()
    if not results:
        raise SystemExit(f'no finished Step B runs under {RUNS}')
    (HERE / 'stepB_metrics.json').write_text(json.dumps(results, indent=2) + '\n', encoding='utf-8')

    val_ceiling, test_ceiling = ceiling('novelval'), ceiling('test')
    lines = [
        '# Step B: does a pretrained protein encoder help?', '',
        'Four Davis runs, 400 epochs each, same split (`train2` train / `novelval` validation),',
        'two seeds per group. The only difference between the groups is the protein encoder.', '',
        '**Judged on validation.** `novelval` holds compounds and proteins that training never saw,',
        'built the same way as the test set. The test numbers below are reported, not used to',
        'choose. "Protein rank correlation" holds the compound fixed, varies the protein, and asks',
        'whether the model orders those proteins correctly; 0.00 means no better than shuffling.',
        '',
        '## Validation - what the decision rests on', '',
        '| Run | Validation MSE | Best epoch | Protein spread captured | Protein rank correlation |',
        '|---|---|---|---|---|']
    for name, r in results.items():
        lines.append(f'| {name} | {r["val_mse"]:.3f} | {r["best_epoch"]} | '
                     f'{r.get("val_captured", float("nan")):.0%} | '
                     f'**{r.get("val_rank", float("nan")):+.3f}** |')
    lines += ['', '| Group, mean of 2 seeds | Validation MSE | Protein rank correlation |',
              '|---|---|---|']
    for group, names in GROUPS.items():
        lines.append(f'| {group} | {mean(results, names, "val_mse"):.3f} | '
                     f'**{mean(results, names, "val_rank"):+.3f}** |')
    lines += ['', f'The ceiling for protein ranking on this validation set is '
                  f'**{val_ceiling:+.3f}**: what a model that knew every protein\'s true average '
                  f'affinity would score. Everything above that is compound-protein interaction, '
                  f'which no per-protein term can reach.', '',
              '## Test - reported, not used to choose', '',
              '| Run | Test MSE | Test CI | Protein spread captured | Protein rank correlation |',
              '|---|---|---|---|---|']
    for name, r in results.items():
        lines.append(f'| {name} | {r["test_mse"]:.3f} | {r["test_ci"]:.3f} | '
                     f'{r["test_captured"]:.0%} | **{r["test_rank"]:+.3f}** |')
    lines += ['', '| Group, mean of 2 seeds | Test MSE | Protein rank correlation |', '|---|---|---|']
    for group, names in GROUPS.items():
        lines.append(f'| {group} | {mean(results, names, "test_mse"):.3f} | '
                     f'**{mean(results, names, "test_rank"):+.3f}** |')
    lines += ['', f'Ceiling for protein ranking on the test set: **{test_ceiling:+.3f}**.', '',
              'For context, earlier runs on the same split with the learned encoder: davis_A',
              '(150 epochs) test MSE 0.644, protein rank -0.050; Phase 4 (150 epochs, paper-style',
              'validation) 0.716 and +0.021. The paper reports 0.463 MSE on Davis novel pair,',
              '5-fold with an ensemble of 3.', '']

    base, esm = GROUPS['paper encoder (learned)'], GROUPS['ESM-2 encoder']
    lines += [
        '## Reading (2026-11-15)', '',
        '**ESM moves protein ranking off zero, and this is the first thing in Phase 5 that has.**',
        f'Validation {mean(results, base, "val_rank"):+.3f} to '
        f'{mean(results, esm, "val_rank"):+.3f}, test '
        f'{mean(results, base, "test_rank"):+.3f} to {mean(results, esm, "test_rank"):+.3f}. '
        'Both seeds move the same way on both splits, and the two groups do not overlap: the worse',
        'ESM seed still beats the better baseline seed. Spread captured rises the same way, from',
        f'{mean(results, base, "val_captured"):.0%} to {mean(results, esm, "val_captured"):.0%} on '
        f'validation and {mean(results, base, "test_captured"):.0%} to '
        f'{mean(results, esm, "test_captured"):.0%} on test.', '',
        '**But ESM costs accuracy on the test set.** Test MSE '
        f'{mean(results, base, "test_mse"):.3f} to {mean(results, esm, "test_mse"):.3f}, again with',
        'no overlap between the groups. Validation MSE says the opposite '
        f'({mean(results, base, "val_mse"):.3f} to {mean(results, esm, "val_mse"):.3f}), and the',
        'test set should be believed on this one: training keeps the epoch with the best validation',
        'MSE, so validation MSE is the number we optimised and is biased low. Test MSE is not.',
        'The rank-correlation finding does not have that problem, because nothing selected for it,',
        'and validation and test agree on it.', '',
        '**It is a partial fix, as the Step A feasibility check predicted.** '
        f'{mean(results, esm, "test_rank") / test_ceiling:.0%} of the test ceiling '
        f'({mean(results, esm, "test_rank"):+.3f} of {test_ceiling:+.3f}), and the model still',
        'moves only about a third as far as it should when the protein changes. Useful, not solved.',
        '',
        '**Sample sizes are small - treat the exact values as rough.** The rank correlation averages',
        f'over {results[esm[0]]["val_compounds"]} compounds on validation and 14 on test, and each',
        'group is 2 seeds. The direction is consistent across 4 independent comparisons',
        '(2 splits x 2 seeds), which is what makes it believable; the precise numbers are not.', '']
    (HERE / 'stepB_results.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')

    print(f'{"run":16s} {"val MSE":>8s} {"val rank":>9s} {"test MSE":>9s} {"test rank":>10s}')
    for name, r in results.items():
        print(f'{name:16s} {r["val_mse"]:8.3f} {r.get("val_rank", float("nan")):+9.3f} '
              f'{r["test_mse"]:9.3f} {r["test_rank"]:+10.3f}')
    print(f'\nceiling: validation {val_ceiling:+.3f}, test {test_ceiling:+.3f}')
    print(f'Wrote {HERE / "stepB_results.md"}')


if __name__ == '__main__':
    main()
