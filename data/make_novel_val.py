"""Build a novel-pair VALIDATION set, so training picks the epoch that generalises.

  .venv\\Scripts\\python.exe data\\make_novel_val.py

Why (Phase 5 Step 0, CLAUDE.md): the Phase 3 validation set is 100% compounds and proteins that are
also in training, while the test set is 0%. Training keeps the epoch with the best validation score,
so it was selecting the model that memorises best, not the one that handles new inputs best.

This builds a second validation set the same way the test set is built: whole compounds AND whole
proteins are held out, so nothing in it was ever seen during training.

Written per dataset, next to the Phase 3 files:
  data/splits/<dataset>/novel_pair/fold0_train2.csv     reduced training set
  data/splits/<dataset>/novel_pair/fold0_novelval.csv   novel-pair validation set

The Phase 3 files are not touched, so the paper-style comparison still works. The TEST set is not
read, not changed and not involved.
"""
import hashlib
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SPLITS = ROOT / 'data' / 'splits'
DATASETS = ['davis', 'kiba', 'metz']
HOLD_OUT = 0.20  # of the training compounds and of the training proteins; see the size table in summary


def fold0(dataset, part):
    return SPLITS / dataset / 'novel_pair' / f'fold0_{part}.csv'


def build(dataset):
    # Everything fold 0 is allowed to train on. The test set is never read here.
    pool = pd.concat([pd.read_csv(fold0(dataset, 'train')), pd.read_csv(fold0(dataset, 'val'))],
                     ignore_index=True)

    # Hold out the last block of compounds and of proteins, sorted alphabetically. Same rule as the
    # repo's fold scheme, so it is deterministic and needs no random seed.
    compounds, proteins = sorted(pool['smiles'].unique()), sorted(pool['sequence'].unique())
    held_compounds = set(compounds[-max(1, int(len(compounds) * HOLD_OUT)):])
    held_proteins = set(proteins[-max(1, int(len(proteins) * HOLD_OUT)):])

    new_compound = pool['smiles'].isin(held_compounds)
    new_protein = pool['sequence'].isin(held_proteins)
    # Novel pair: both sides new -> validation; both sides seen -> training; mixed rows are unused,
    # exactly as the Phase 3 test set is built.
    validation = pool[new_compound & new_protein]
    training = pool[~new_compound & ~new_protein]

    training.to_csv(fold0(dataset, 'train2'), index=False)
    validation.to_csv(fold0(dataset, 'novelval'), index=False)
    return pool, training, validation


def check(dataset, pool, training, validation):
    """Prove the validation set really is novel, and that no row was duplicated or invented."""
    test = pd.read_csv(fold0(dataset, 'test'))
    pair = lambda df: set(zip(df['smiles'], df['sequence']))
    problems = []
    if set(training['smiles']) & set(validation['smiles']):
        problems.append('a compound appears in both training and validation')
    if set(training['sequence']) & set(validation['sequence']):
        problems.append('a protein appears in both training and validation')
    if pair(validation) & pair(test):
        problems.append('a smiles+sequence pair appears in both validation and the TEST set')
    if pair(training) & pair(test):
        problems.append('a smiles+sequence pair appears in both training and the TEST set')
    if len(training) + len(validation) > len(pool):
        problems.append('rows were duplicated')
    # the user's Phase 3 rule: identical smiles+sequence rows are never split across sides
    if pair(training) & pair(validation):
        problems.append('the same smiles+sequence pair is on both sides')
    return problems


def main():
    lines = ['# Novel-pair validation sets (Phase 5)', '',
             'Built by `data/make_novel_val.py`. Whole compounds and whole proteins are held out, so the',
             'validation set contains nothing the model saw in training, exactly like the test set.',
             'The Phase 3 files are unchanged and the test set was not involved.', '',
             f'Held out: the last {HOLD_OUT:.0%} of training compounds and the last {HOLD_OUT:.0%} of training proteins,',
             'sorted alphabetically (the same deterministic rule the repo uses for folds).', '',
             '| Dataset | Rows available | New training | Novel validation | Unused | Test (for scale) |',
             '|---|---|---|---|---|---|']
    manifest, failed = {}, False
    for dataset in DATASETS:
        pool, training, validation = build(dataset)
        problems = check(dataset, pool, training, validation)
        test_rows = len(pd.read_csv(fold0(dataset, 'test')))
        lines.append(f'| {dataset.capitalize()} | {len(pool):,} | {len(training):,} | {len(validation):,} | '
                     f'{len(pool) - len(training) - len(validation):,} | {test_rows:,} |')
        for part in ('train2', 'novelval'):
            path = fold0(dataset, part)
            manifest[f'{dataset}/novel_pair/{part}'] = {
                'rows': int(len(pd.read_csv(path))),
                'md5': hashlib.md5(path.read_bytes()).hexdigest()}
        print(f'{dataset:6s} train {len(training):6,}  novel-val {len(validation):5,}  '
              f'(test {test_rows:,})  checks: {"FAILED -> " + "; ".join(problems) if problems else "all pass"}')
        failed |= bool(problems)

    lines += ['', '**CHECKS FAILED — see the script output. Do not use these files.**'] if failed else \
             ['', 'Every check passed: no compound and no protein is shared between the new training set',
              'and the novel validation set, and neither overlaps the test set.']
    (SPLITS / 'novel_val_summary.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    (SPLITS / 'novel_val_manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'\nWrote {SPLITS / "novel_val_summary.md"} and novel_val_manifest.json')
    if failed:
        raise SystemExit('Leakage checks failed; the files above must not be used.')


if __name__ == '__main__':
    main()
