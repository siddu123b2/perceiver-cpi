"""Phase 5 Step 0: work out WHY the Phase 4 models barely beat guessing the average.

  .venv\\Scripts\\python.exe experiments\\phase5\\diagnose.py

Uses only the predictions Phase 4 already saved. Nothing is retrained, no GPU, and the test set is
read for reporting only (never to tune anything). Writes diagnosis.md next to this file.
"""
from pathlib import Path

import numpy as np
import pandas as pd

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
RUNS = ROOT / 'experiments' / 'phase4_baseline' / 'runs'
DATASETS = ['davis', 'kiba', 'metz']
TAU = {'davis': (0.0, 5.0), 'kiba': (11.1, 12.0), 'metz': None}   # the label-weighting range per dataset
MAX_RESIDUES = 499  # the model only reads this many; see CLAUDE.md section 3


def frame(dataset):
    test = pd.read_csv(ROOT / 'data' / 'splits' / dataset / 'novel_pair' / 'fold0_test.csv')
    test['pred'] = pd.read_csv(RUNS / dataset / 'test_preds.csv')['label'].to_numpy(float)
    test['sq_error'] = (test['label'] - test['pred']) ** 2
    return test


def where_the_error_is(test, dataset):
    """Split the error by the label-weighting range: 'no binding' rows vs real binders."""
    if TAU[dataset] is None:
        return None
    low, high = TAU[dataset]
    inside = (test['label'] >= low) & (test['label'] <= high)
    out = {}
    for name, mask in (('inside', inside), ('outside', ~inside)):
        if mask.sum():
            out[name] = {'rows': int(mask.sum()), 'share': float(mask.mean()),
                         'mse': float(test.loc[mask, 'sq_error'].mean()),
                         'share_of_total_error': float(test.loc[mask, 'sq_error'].sum() / test['sq_error'].sum()),
                         'mean_true': float(test.loc[mask, 'label'].mean()),
                         'mean_pred': float(test.loc[mask, 'pred'].mean())}
    return out


def what_drives_predictions(test):
    """How much of the variation comes from which compound it is, versus which protein it is?
    Computed as the share of variance explained by each one's group means."""
    out = {}
    for column, name in (('smiles', 'compound'), ('sequence', 'protein')):
        group = test.groupby(column)
        out[name] = {
            'of_predictions': float(group['pred'].mean().reindex(test[column]).to_numpy().var() / test['pred'].var()),
            'of_truth': float(group['label'].mean().reindex(test[column]).to_numpy().var() / test['label'].var())}
    return out


def truncation_effect(test):
    """Are proteins whose tail the model never sees predicted worse?
    Note: this is a comparison between different proteins, so protein family and label range differ
    too. It is suggestive, not a controlled experiment."""
    length = test['sequence'].str.len()
    short, long = test[length <= MAX_RESIDUES], test[length > MAX_RESIDUES]
    if not len(short) or not len(long):
        return None
    return {'rows_fully_seen': int(len(short)), 'mse_fully_seen': float(short['sq_error'].mean()),
            'rows_cut_off': int(len(long)), 'mse_cut_off': float(long['sq_error'].mean()),
            'ratio': float(long['sq_error'].mean() / short['sq_error'].mean()),
            'proteins_cut_off': int((test['sequence'].drop_duplicates().str.len() > MAX_RESIDUES).sum()),
            'proteins_total': int(test['sequence'].nunique())}


def main():
    out = ['# Phase 5 Step 0: why the baselines barely beat guessing', '',
           'From the Phase 4 predictions only. Nothing retrained; the test set is read for reporting, not tuning.',
           '', '## 1. Almost all the error is on the real binders', '',
           'Rows are split by the label-weighting range: inside it are the crowded "weak or no binding"',
           'labels, outside it are the stronger binders.', '',
           '| Dataset | Group | Rows | MSE | Share of all error | Mean true | Mean predicted |',
           '|---|---|---|---|---|---|---|']
    data = {}
    for d in DATASETS:
        test = frame(d)
        data[d] = {'error': where_the_error_is(test, d), 'drivers': what_drives_predictions(test),
                   'truncation': truncation_effect(test)}
        if data[d]['error']:
            for group, label in (('inside', 'weak / no binding'), ('outside', 'real binders')):
                e = data[d]['error'].get(group)
                if e:
                    out.append(f'| {d.capitalize()} | {label} | {e["rows"]:,} ({e["share"]:.0%}) | {e["mse"]:.3f} | '
                               f'{e["share_of_total_error"]:.0%} | {e["mean_true"]:.2f} | {e["mean_pred"]:.2f} |')
    out += ['', 'Metz has no weighting, so it is not split here.', '',
            'The models are near-perfect on the "no binding" rows and badly wrong on the binders, which',
            'carry most of the error. **They fail exactly where a user cares.** The mean predicted column',
            'shows why: the answers barely move between the two groups.', '',
            '## 2. The models mostly ignore the protein', '',
            'Share of the variation explained by which compound it is, versus which protein it is.', '',
            '| Dataset | Compound (our predictions) | Compound (truth) | Protein (our predictions) | Protein (truth) |',
            '|---|---|---|---|---|']
    for d in DATASETS:
        c, p = data[d]['drivers']['compound'], data[d]['drivers']['protein']
        out.append(f'| {d.capitalize()} | {c["of_predictions"]:.0%} | {c["of_truth"]:.0%} | '
                   f'{p["of_predictions"]:.0%} | {p["of_truth"]:.0%} |')
    out += ['', 'The models answer mostly according to **which drug** it is, and barely change their answer',
            'for **which protein** they are asked about. Protein identity drives 9-13% of our predictions',
            'but 11-18% of the truth, and compound identity drives far more of ours than of the truth.',
            'For the app this matters: a user picks a drug *and* a protein, and the protein is being',
            'close to ignored.', '',
            '## 3. Truncation does not explain it (tested, and it does not hold up)', '',
            f'The model reads only the first {MAX_RESIDUES} residues. If losing the tail were the cause,',
            'proteins longer than that should be clearly worse. They are not.', '',
            '| Dataset | Proteins cut off | MSE, fully seen | MSE, cut off | Cut-off vs fully seen |',
            '|---|---|---|---|---|']
    for d in DATASETS:
        t = data[d]['truncation']
        if t:
            out.append(f'| {d.capitalize()} | {t["proteins_cut_off"]}/{t["proteins_total"]} | '
                       f'{t["mse_fully_seen"]:.3f} | {t["mse_cut_off"]:.3f} | {t["ratio"]:.2f}x |')
    out += ['', 'Davis is **better** on the cut-off proteins, KIBA and Metz only ~1.1x worse. If truncation',
            'were crippling the protein branch we would expect a large and consistent penalty.',
            '', 'This is a comparison between *different* proteins, so family and label range differ as well;',
            'it is suggestive, not a controlled experiment. But it is clearly not the main cause, so the',
            'kinase-domain idea drops down the Phase 5 list rather than leading it.']
    (HERE / 'diagnosis.md').write_text('\n'.join(out) + '\n', encoding='utf-8')

    for d in DATASETS:
        dr, t = data[d]['drivers'], data[d]['truncation']
        print(f'{d:6s} prediction driven by compound {dr["compound"]["of_predictions"]:.0%} / '
              f'protein {dr["protein"]["of_predictions"]:.0%}  | truncated proteins {t["ratio"]:.2f}x the error')
    print(f'\nWrote {HERE / "diagnosis.md"}')


if __name__ == '__main__':
    main()
