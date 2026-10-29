"""Phase 3 test: check every split for data leakage and for the paper's setting rules.

Run from the project root (after data/make_splits.py):
  .venv\\Scripts\\python.exe data\\check_splits.py               all checks (~3 min: re-aligns proteins)
  .venv\\Scripts\\python.exe data\\check_splits.py --with-model  also train the real model for 1 epoch
                                                                on Davis novel-pair fold 0
Exits with code 1 if any check fails. Similarities are recomputed here with separate code
(RDKit's MorganGenerator, a fresh aligner), so a bug in make_splits.py can't hide itself.
"""
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import pandas as pd
from Bio import Align
from Bio.Align import substitution_matrices
from rdkit import Chem, DataStructs, RDLogger
from rdkit.Chem import rdFingerprintGenerator

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / 'data'
SPLIT_DIR = DATA_DIR / 'splits'
SETTINGS = {
    'davis': ['novel_pair', 'novel_compound', 'novel_protein', 'novel_hard_pair'],
    'kiba': ['novel_pair'],
    'metz': ['novel_pair'],
}
N_FOLDS = 5
HARD_CUTOFF = 0.3
COLUMNS = ['smiles', 'sequence', 'label']

RDLogger.DisableLog('rdApp.*')
morgan = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
aligner = Align.PairwiseAligner(mode='global')
aligner.substitution_matrix = substitution_matrices.load('BLOSUM62')
aligner.open_gap_score, aligner.extend_gap_score = -10, -0.5
aligner.open_end_gap_score, aligner.extend_end_gap_score = 0, 0

failures = []
n_checks = 0


def check(label, passed, detail=''):
    global n_checks
    n_checks += 1
    if not passed:
        failures.append(label)
        print(f'  [FAIL] {label}' + (f' ({detail})' if detail else ''))


def pairs(frame):
    return set(zip(frame.smiles, frame.sequence))


def load_fold(dataset, setting, k):
    return [pd.read_csv(SPLIT_DIR / dataset / setting / f'fold{k}_{part}.csv') for part in ('train', 'val', 'test')]


def check_fold(where, full, train, val, test, setting):
    training = pd.concat([train, val])
    for name, frame in [('train', train), ('val', val), ('test', test)]:
        check(f'{where} {name}: header is smiles,sequence,label', list(frame.columns) == COLUMNS)
    check(f'{where}: test set is not empty', len(test) > 0)

    # Every row must come from the cleaned dataset (no row invented or copied twice).
    split_counts = pd.concat([training, test]).value_counts(subset=COLUMNS)
    extra = split_counts.sub(full.value_counts(subset=COLUMNS), fill_value=0)
    check(f'{where}: every row comes from the cleaned data', (extra <= 0).all(), f'{(extra > 0).sum()} extra')

    # The same smiles+sequence input never sits on two sides (user rule, all settings).
    check(f'{where}: no smiles+sequence pair in both training and test', not pairs(training) & pairs(test),
          f'{len(pairs(training) & pairs(test))} shared')
    check(f'{where}: no smiles+sequence pair in both train and val', not pairs(train) & pairs(val),
          f'{len(pairs(train) & pairs(val))} shared')

    shared_compounds = set(training.smiles) & set(test.smiles)
    shared_proteins = set(training.sequence) & set(test.sequence)
    if setting in ('novel_compound', 'novel_pair', 'novel_hard_pair'):
        check(f'{where}: no test compound in train/val', not shared_compounds, f'{len(shared_compounds)} shared')
    if setting in ('novel_protein', 'novel_pair', 'novel_hard_pair'):
        check(f'{where}: no test protein in train/val', not shared_proteins, f'{len(shared_proteins)} shared')
    if setting in ('novel_compound', 'novel_protein'):
        check(f'{where}: train + val + test = the whole dataset', len(training) + len(test) == len(full))

    val_share = len(val) / len(training)
    check(f'{where}: validation is ~20% of training', 0.185 <= val_share <= 0.215, f'{val_share:.3f}')


def check_hard_fold(where, train, val, test, pair_train, pair_val, pair_test):
    check(f'{where}: train identical to novel pair', train.equals(pair_train))
    check(f'{where}: val identical to novel pair', val.equals(pair_val))
    leftover = test.value_counts(subset=COLUMNS).sub(pair_test.value_counts(subset=COLUMNS), fill_value=0)
    check(f'{where}: test rows are a subset of the novel-pair test rows', (leftover <= 0).all())

    training = pd.concat([train, val])
    train_fps = [morgan.GetFingerprint(Chem.MolFromSmiles(s)) for s in training.smiles.unique()]
    worst_compound = max(max(DataStructs.BulkTanimotoSimilarity(morgan.GetFingerprint(Chem.MolFromSmiles(s)),
                                                                  train_fps))
                         for s in test.smiles.unique())
    check(f'{where}: every test compound < {HARD_CUTOFF} Tanimoto to all training compounds',
          worst_compound < HARD_CUTOFF, f'highest {worst_compound:.3f}')

    worst_protein = max(aligner.align(q[:500], t[:500])[0].counts().identities / 500
                        for q in test.sequence.unique() for t in training.sequence.unique())
    check(f'{where}: every test protein < {HARD_CUTOFF} identity to all training proteins',
          worst_protein < HARD_CUTOFF, f'highest {worst_protein:.3f}')
    return worst_compound, worst_protein


def check_setting(dataset, setting, full):
    test_compounds, test_proteins, notes = [], [], []
    for k in range(N_FOLDS):
        where = f'{dataset}/{setting}/fold{k}'
        train, val, test = load_fold(dataset, setting, k)
        check_fold(where, full, train, val, test, setting)
        if setting == 'novel_hard_pair':
            worst = check_hard_fold(where, train, val, test, *load_fold(dataset, 'novel_pair', k))
            notes.append(f'fold{k} highest similarity: compound {worst[0]:.2f}, protein {worst[1]:.2f}')
        test_compounds.append(set(test.smiles))
        test_proteins.append(set(test.sequence))

    # Across folds: nothing is tested twice; in compound/protein settings everything is tested once.
    if setting != 'novel_protein':
        check(f'{dataset}/{setting}: no compound is in two test folds',
              sum(map(len, test_compounds)) == len(set().union(*test_compounds)))
    if setting != 'novel_compound':
        check(f'{dataset}/{setting}: no protein is in two test folds',
              sum(map(len, test_proteins)) == len(set().union(*test_proteins)))
    if setting == 'novel_compound':
        check(f'{dataset}/{setting}: every compound is tested in exactly one fold',
              set().union(*test_compounds) == set(full.smiles))
    if setting == 'novel_protein':
        check(f'{dataset}/{setting}: every protein is tested in exactly one fold',
              set().union(*test_proteins) == set(full.sequence))
    return notes


def check_manifest():
    manifest = json.loads((SPLIT_DIR / 'manifest.json').read_text(encoding='utf-8'))
    expected = {f'{d}/{s}/fold{k}_{p}.csv' for d, ss in SETTINGS.items() for s in ss
                for k in range(N_FOLDS) for p in ('train', 'val', 'test')}
    check('manifest lists exactly the expected split files', set(manifest) == expected,
          f'{len(manifest)} listed, {len(expected)} expected')
    bad = [f for f in manifest if not (SPLIT_DIR / f).exists()
           or hashlib.md5((SPLIT_DIR / f).read_bytes()).hexdigest() != manifest[f]['md5']]
    check('every split file exists and matches its MD5 fingerprint', not bad, f'{len(bad)} missing or changed: {bad[:3]}')


def check_model_reads():
    """Train the real model for 1 epoch on Davis novel-pair fold 0, using the split files as they are."""
    fold = SPLIT_DIR / 'davis' / 'novel_pair'
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        command = [sys.executable, 'train.py', '--data_path', str(fold / 'fold0_train.csv'),
                   '--separate_val_path', str(fold / 'fold0_val.csv'),
                   '--separate_test_path', str(fold / 'fold0_test.csv'),
                   '--dataset_type', 'regression', '--target_columns', 'label', '--metric', 'mse',
                   '--epochs', '1', '--ensemble_size', '1', '--num_folds', '1', '--batch_size', '50',
                   '--seed', '0', '--num_workers', '0', '--save_dir', str(Path(tmp) / 'ckpt')]
        result = subprocess.run(command, cwd=ROOT / 'model_2d', capture_output=True,
                                encoding='utf-8', errors='replace')
    output = result.stdout + result.stderr
    found = [line.strip() for line in output.splitlines() if 'Overall test mse' in line or 'Elapsed time' in line]
    check('model_2d/train.py trains 1 epoch on Davis novel-pair fold 0', result.returncode == 0 and len(found) == 2,
          ' | '.join(found) or output.strip().splitlines()[-1])
    print(f'  model run: {" | ".join(found)}')


def main():
    check_manifest()
    for dataset, settings in SETTINGS.items():
        full = pd.read_csv(DATA_DIR / f'{dataset}.csv')
        for setting in settings:
            before = n_checks, len(failures)
            notes = check_setting(dataset, setting, full)
            done, failed = n_checks - before[0], len(failures) - before[1]
            print(f'{dataset}/{setting}: {done} checks, {"all passed" if not failed else f"{failed} FAILED"}')
            for note in notes:
                print(f'  {note}')
    if '--with-model' in sys.argv:
        check_model_reads()

    print(f'\n{n_checks} checks: ' + ('ALL PASSED' if not failures else f'{len(failures)} FAILED'))
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
