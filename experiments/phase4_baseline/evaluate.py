"""Phase 4: score the three trained models and write results.md.

  .venv\\Scripts\\python.exe experiments\\phase4_baseline\\evaluate.py

Reads runs/<dataset>/test_preds.csv (the predictions the GPU run saved) and the true labels from
data/splits/<dataset>/novel_pair/fold0_test.csv, then reports MSE, RMSE, MAE, CI, Pearson, Spearman
and rm2 next to the paper's numbers.

CI is computed exactly as the repo does (lifelines concordance_index on label, prediction), so our
number matches the test_scores.csv the training run wrote.
"""
import ast
import json
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from lifelines.utils import concordance_index
from scipy import stats

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
RUNS = HERE / 'runs'
DATASETS = ['davis', 'kiba', 'metz']
UNITS = {'davis': 'pKd', 'kiba': 'KIBA score', 'metz': 'pKi'}

# Paper, Tables 4-6: 5-fold CV mean +/- std, novel pair setting
PAPER = {'davis': {'mse': (0.463, 0.013), 'ci': (0.638, 0.028)},
         'kiba': {'mse': (0.522, 0.010), 'ci': (0.638, 0.013)},
         'metz': {'mse': (0.658, 0.016), 'ci': (0.675, 0.012)}}

# Phase 2: identical pairs with different labels put a floor under the achievable MSE
NOISE_FLOOR = {'davis': 0.032, 'kiba': 0.000, 'metz': 0.000}


def rm2(y, f):
    """rm^2 of Roy et al., as used by DeepDTA and the CPI literature: how well predictions agree with
    the measurements when the fit is forced through the origin."""
    r2 = stats.pearsonr(y, f)[0] ** 2
    k = np.sum(y * f) / np.sum(f ** 2)                       # best scale through the origin
    r02 = 1 - np.sum((y - k * f) ** 2) / np.sum((y - y.mean()) ** 2)
    return r2 * (1 - np.sqrt(abs(r2 - r02)))


def split_path(dataset, part):
    return ROOT / 'data' / 'splits' / dataset / 'novel_pair' / f'fold0_{part}.csv'


def load(dataset):
    preds = pd.read_csv(RUNS / dataset / 'test_preds.csv')
    test = pd.read_csv(split_path(dataset, 'test'))
    smiles = preds['smiles'].map(lambda x: ast.literal_eval(x)[0])
    if len(preds) != len(test) or not (smiles.values == test['smiles'].values).all():
        raise SystemExit(f'{dataset}: predictions do not line up with the test split file.')
    return test, test['label'].to_numpy(float), preds['label'].to_numpy(float)


def metrics(y, f):
    return {'n': len(y), 'mse': float(np.mean((y - f) ** 2)), 'rmse': float(np.sqrt(np.mean((y - f) ** 2))),
            'mae': float(np.mean(np.abs(y - f))), 'ci': float(concordance_index(y, f)),
            'pearson': float(stats.pearsonr(y, f)[0]), 'spearman': float(stats.spearmanr(y, f)[0]),
            'rm2': float(rm2(y, f))}


def mc_dropout_facts(dataset):
    """Does the MC-dropout +/- actually warn us when a prediction is wrong?
    Needs runs/<dataset>/mc_dropout_test.csv (written by model_2d/mc_dropout.py)."""
    path = RUNS / dataset / 'mc_dropout_test.csv'
    if not path.exists():
        return None
    mc = pd.read_csv(path)
    error = (mc['label'] - mc['score']).abs()
    quarter = pd.qcut(mc['mc_dropout_std'], 4, labels=False)
    return {'spearman': float(stats.spearmanr(mc['mc_dropout_std'], error)[0]),
            'error_most_confident': float(error[quarter == 0].mean()),
            'error_least_confident': float(error[quarter == 3].mean()),
            'median_spread': float(mc['mc_dropout_std'].median()),
            'median_error': float(error.median()),
            # an honest +/- would cover about 95% of cases within two standard deviations
            'coverage_2sd': float((error <= 2 * mc['mc_dropout_std']).mean())}


def training_facts(dataset):
    """Best epoch and how often the run was interrupted, from the training log."""
    log = (RUNS / dataset / 'verbose.log').read_text(errors='replace')
    best = [line for line in log.splitlines() if 'best validation' in line]
    return {'best_epoch': int(best[-1].split('epoch ')[-1]) if best else None,
            'best_val_mse': float(best[-1].split('= ')[1].split(' ')[0]) if best else None,
            'resumes': log.count('Resuming model')}


def main():
    rows = {}
    for dataset in DATASETS:
        test, y, f = load(dataset)
        train_labels = pd.read_csv(split_path(dataset, 'train'))['label'].to_numpy(float)
        rows[dataset] = {**metrics(y, f), **training_facts(dataset),
                         'label_min': float(y.min()), 'label_max': float(y.max()),
                         # the score you get by ignoring the inputs and always guessing the training average
                         'baseline_mse': float(np.mean((y - train_labels.mean()) ** 2)),
                         'true_sd': float(y.std()), 'pred_sd': float(f.std()),
                         'test_compounds': int(test['smiles'].nunique()),
                         'test_proteins': int(test['sequence'].nunique()),
                         'mc_dropout': mc_dropout_facts(dataset)}
        # cross-check against the number the training run itself wrote
        written = float(pd.read_csv(RUNS / dataset / 'test_scores.csv').iloc[0]['Fold 0 mse'])
        rows[dataset]['mse_matches_run'] = abs(written - rows[dataset]['mse']) < 1e-6

    (HERE / 'metrics.json').write_text(json.dumps(rows, indent=2) + '\n', encoding='utf-8')

    environment = (RUNS / 'environment.txt').read_text(errors='replace').splitlines()
    gpu = next((l for l in environment if l.startswith('GPU:')), 'GPU: unknown')
    torch_line = next((l for l in environment if l.startswith('PyTorch:')), 'PyTorch: unknown')

    out = [f'# Phase 4 results: baseline, one model per dataset\n',
           f'Written by `evaluate.py` on {datetime.now():%Y-%m-%d}. '
           f'Trained on the college GPU ({gpu.split(": ")[1]}, {torch_line.split(": ")[1]}).\n',
           '## How to read this\n',
           'Each model was trained **once**, on **fold 0** of the novel-pair split, with **no ensemble**.',
           'The paper averaged **5 folds**, each an **ensemble of 3** models. So our numbers are expected to be',
           'a little worse, and the comparison is **not exact**. Lower MSE is better; higher CI, Pearson,',
           'Spearman and rm2 are better. Never compare scores between datasets: each uses its own scale.\n',
           '## Our numbers next to the paper\n',
           '| Dataset | Our MSE | Paper MSE (5-fold) | Our CI | Paper CI (5-fold) |',
           '|---|---|---|---|---|']
    for d in DATASETS:
        r, p = rows[d], PAPER[d]
        out.append(f'| {d.capitalize()} | {r["mse"]:.3f} | {p["mse"][0]:.3f} ± {p["mse"][1]:.3f} | '
                   f'{r["ci"]:.3f} | {p["ci"][0]:.3f} ± {p["ci"][1]:.3f} |')

    out += ['\n## All metrics\n',
            '| Dataset | Unit | Test rows | MSE | RMSE | MAE | CI | Pearson | Spearman | rm² |',
            '|---|---|---|---|---|---|---|---|---|---|']
    for d in DATASETS:
        r = rows[d]
        out.append(f'| {d.capitalize()} | {UNITS[d]} | {r["n"]:,} | {r["mse"]:.3f} | {r["rmse"]:.3f} | '
                   f'{r["mae"]:.3f} | {r["ci"]:.3f} | {r["pearson"]:.3f} | {r["spearman"]:.3f} | {r["rm2"]:.3f} |')

    out += ['\n## Is the model actually learning? (honest check)\n',
            'A model that ignores its inputs and always answers the training average still scores a',
            'certain MSE. Any useful model must beat it.\n',
            '| Dataset | Our MSE | Always guess the average | Better? | Spread of true labels | Spread of our predictions |',
            '|---|---|---|---|---|---|']
    for d in DATASETS:
        r = rows[d]
        gain = (r['baseline_mse'] - r['mse']) / r['baseline_mse'] * 100
        verdict = f'{gain:+.0f}%' if gain > 0 else f'**{gain:+.0f}% (worse)**'
        out.append(f'| {d.capitalize()} | {r["mse"]:.3f} | {r["baseline_mse"]:.3f} | {verdict} | '
                   f'{r["true_sd"]:.2f} | {r["pred_sd"]:.2f} |')
    out += ['\nTwo things stand out, and both say the same thing:\n',
            '1. The models barely beat the average, and on KIBA the model is **worse** than it.',
            '2. Our predictions vary much less than the real labels. The models are playing safe and',
            '   answering close to the average instead of committing to high or low values.\n',
            'So these baselines are weak. They are a real, reproducible starting point, not a working predictor yet.\n',
            '## Training\n',
            '| Dataset | Best epoch (of 150) | Validation MSE | Test MSE | Gap | Resumes |',
            '|---|---|---|---|---|---|']
    for d in DATASETS:
        r = rows[d]
        out.append(f'| {d.capitalize()} | {r["best_epoch"]} | {r["best_val_mse"]:.3f} | {r["mse"]:.3f} | '
                   f'{r["mse"] - r["best_val_mse"]:+.3f} | {r["resumes"]} |')
    out += ['\nThe model kept is the epoch with the lowest validation MSE, not the last epoch.',
            'The test set was used once, for the numbers above.\n',
            '**The validation score is far better than the test score on all three.** That is the novel-pair',
            'setting doing its job: validation contains compounds and proteins the model saw in training,',
            'while the test set contains only ones it has never seen. The models learned the training',
            'compounds and proteins well, but that knowledge does not carry over to new ones.\n']

    if all(rows[d]['mc_dropout'] for d in DATASETS):
        out += ['## Does the ± confidence mean anything?\n',
                'The ± is the spread of 30 predictions made with dropout left on (MC dropout). For it to be',
                'worth showing a user, a bigger ± must mean a bigger mistake.\n',
                '| Dataset | Avg error, most-confident 25% | Avg error, least-confident 25% | Rank agreement | True label inside ±2 spread |',
                '|---|---|---|---|---|']
        for d in DATASETS:
            m = rows[d]['mc_dropout']
            out.append(f'| {d.capitalize()} | {m["error_most_confident"]:.3f} | {m["error_least_confident"]:.3f} | '
                       f'{m["spearman"]:+.3f} | {m["coverage_2sd"]:.0%} |')
        out += ['\n**It works on Davis and not on the other two.** On Davis the predictions the model flags as',
                'uncertain really are about twice as wrong, so the ± is a useful warning. On KIBA and Metz the',
                'rank agreement is near zero: the ± says almost nothing about whether the answer is right.\n',
                '**And on all three the ± is far too small.** An honest ± would put the true label inside',
                '±2 spread about 95% of the time; ours manages 33-63%. MC dropout only measures how much the',
                'answer wobbles when parts of the network are switched off. It cannot see the larger problem',
                'above, that the model does not generalise to unseen compounds and proteins, so the model can',
                'be confidently wrong.\n',
                '**Phase 6 rule that follows: do not present this ± as a 95% confidence interval.** Either show',
                'it as a relative "high / medium / low confidence" label, or calibrate it first, fitting the',
                'calibration on the **validation** set and never the test set. The coverage above is reported,',
                'not tuned against.\n']

    out += ['## Why we are behind the paper, and what to try next\n',
            'Honest reasons, most likely first:\n',
            '1. **No ensemble.** The paper averages 3 models per fold; we trained 1. Averaging removes some',
            '   of each model\'s random error.',
            '2. **One fold, not 5.** Fold 0 may be harder than average. The paper reports the mean of 5.',
            '3. **Hyperparameters.** The paper tuned theirs with Bayesian optimisation but does not publish',
            '   the values, so we used the repo README settings.',
            '4. **Training was still improving.** On Davis and Metz the validation MSE was still falling at',
            '   epoch 150, so the runs were stopped too early. KIBA had levelled off by about epoch 90.\n',
            'Candidates for Phase 5, one at a time, judged on validation only:\n',
            '- train longer than 150 epochs (Davis and Metz had not finished improving);',
            '- train an ensemble of 3, as the paper does;',
            '- the protein-truncation ideas already in CLAUDE.md (only the first 499 residues are read).']
    (HERE / 'results.md').write_text('\n'.join(out) + '\n', encoding='utf-8')

    for d in DATASETS:
        r = rows[d]
        print(f'{d:6s} MSE {r["mse"]:.3f} (paper {PAPER[d]["mse"][0]:.3f})  '
              f'CI {r["ci"]:.3f} (paper {PAPER[d]["ci"][0]:.3f})  '
              f'Pearson {r["pearson"]:.3f}  rm2 {r["rm2"]:.3f}  '
              f'[matches run: {r["mse_matches_run"]}]')
    print(f'\nWrote {HERE / "results.md"} and metrics.json')


if __name__ == '__main__':
    main()
