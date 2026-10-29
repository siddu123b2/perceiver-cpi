"""Phase 2 test: check the cleaned datasets against the CLAUDE.md section 3 rules.

Run from the project root (after data/prepare_datasets.py):
  .venv\\Scripts\\python.exe data\\check_datasets.py                data checks only
  .venv\\Scripts\\python.exe data\\check_datasets.py --with-model   also train the real model for 1 epoch
                                                                   on 500 rows of each file
Exits with code 1 if any check fails.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import pandas as pd
from rdkit import Chem, RDLogger
from tape import TAPETokenizer

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / 'reference' / 'data'
DATA_DIR = ROOT / 'data'
RENAME = {'compound_iso_smiles': 'smiles', 'target_sequence': 'sequence', 'affinity': 'label'}
PAIR = ['smiles', 'sequence']

# Paper Table 1 row counts, and the compound/protein counts of the raw files (cleaning must not lose any).
EXPECTED = {
    'davis': {'rows': 30_056, 'compounds': 68, 'sequences': 379},
    'kiba': {'rows': 117_657, 'compounds': 2_068, 'sequences': 229},
    'metz': {'rows': 35_259, 'compounds': 1_423, 'sequences': 170},
}

RDLogger.DisableLog('rdApp.*')
tokenizer = TAPETokenizer(vocab='unirep')
failures = []


def check(label, passed, detail=''):
    print(f'  [{"PASS" if passed else "FAIL"}] {label}' + (f' ({detail})' if detail else ''))
    if not passed:
        failures.append(label)


def check_dataset(name, df, raw):
    expected = EXPECTED[name]
    check('header is smiles,sequence,label', list(df.columns) == ['smiles', 'sequence', 'label'], list(df.columns))
    check('row count', len(df) == expected['rows'], f'{len(df):,}, expected {expected["rows"]:,}')
    check('no missing values', not df.isna().any().any())
    check('no compound lost', df.smiles.nunique() == expected['compounds'], f'{df.smiles.nunique():,}')
    check('no protein lost', df.sequence.nunique() == expected['sequences'], f'{df.sequence.nunique():,}')

    bad_smiles = [s for s in df.smiles.unique() if Chem.MolFromSmiles(s) is None]
    check('every SMILES parses in RDKit', not bad_smiles, f'{len(bad_smiles)} bad')

    # Encode every sequence exactly as the model does; any unknown letter raises an error.
    unknown = []
    for sequence in df.sequence.unique():
        try:
            tokenizer.encode(list(sequence))
        except KeyError:
            unknown.append(sequence)
    check('every sequence encodes with TAPE', not unknown, f'{len(unknown)} failed')

    check('labels inside the raw range', df.label.between(raw.label.min(), raw.label.max()).all(),
          f'{df.label.min():.3f} to {df.label.max():.3f}')

    if name == 'kiba':
        check('no repeated smiles+sequence pairs', not df.duplicated(subset=PAIR).any())
        # Recompute the rule from the raw file: drop exact duplicates, then the mean label per pair.
        expected_labels = raw.drop_duplicates().groupby(PAIR)['label'].mean()
        cleaned_labels = df.set_index(PAIR)['label']
        same_pairs = set(expected_labels.index) == set(cleaned_labels.index)
        check('same set of pairs as the raw file', same_pairs)
        if same_pairs:
            diff = (cleaned_labels - expected_labels.reindex(cleaned_labels.index)).abs().max()
            check('every label = mean of its raw rows after dropping exact duplicates', diff < 1e-9,
                  f'max difference {diff:.1e}')
        log = pd.read_csv(DATA_DIR / 'logs' / 'kiba_merged_pairs.csv')
        n_repeated = (raw.groupby(PAIR).size() > 1).sum()
        check('merge log lists every repeated pair', len(log) == n_repeated, f'{len(log)} pairs')
        check('merge log accounts for every removed row', (log.raw_rows - 1).sum() == len(raw) - len(df),
              f'{(log.raw_rows - 1).sum()} rows')
    else:
        identical = df.reset_index(drop=True).equals(raw.reset_index(drop=True))
        check('identical to the raw file apart from column names', identical)

    if name == 'davis':
        x_rows = df.sequence.str.contains('X')
        x_id = tokenizer.convert_token_to_id('X')
        check('rows with X are kept and X has its own token', x_rows.sum() == 68 and x_id != 0,
              f'{x_rows.sum()} rows, X -> token {x_id}')


def check_model_reads(name, df):
    """Train the real model (model_2d/train.py) for 1 epoch on 500 rows, to prove it reads our format."""
    sample = df.sample(n=500, random_state=0)
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        path = Path(tmp) / f'{name}_sample.csv'
        sample.to_csv(path, index=False)
        command = [sys.executable, 'train.py', '--data_path', str(path), '--dataset_type', 'regression',
                   '--target_columns', 'label', '--metric', 'mse', '--epochs', '1', '--ensemble_size', '1',
                   '--num_folds', '1', '--batch_size', '50', '--seed', '0', '--save_dir', str(Path(tmp) / 'ckpt')]
        result = subprocess.run(command, cwd=ROOT / 'model_2d', capture_output=True,
                                encoding='utf-8', errors='replace')
    output = result.stdout + result.stderr
    score = next((line.strip() for line in output.splitlines() if 'Overall test mse' in line), '')
    check('model_2d/train.py trains 1 epoch on a 500-row sample', result.returncode == 0 and bool(score),
          score or output.strip().splitlines()[-1])


def main():
    with_model = '--with-model' in sys.argv
    for name in EXPECTED:
        print(f'\n{name}')
        df = pd.read_csv(DATA_DIR / f'{name}.csv')
        raw = pd.read_csv(RAW_DIR / f'{name}.csv').rename(columns=RENAME)
        check_dataset(name, df, raw)
        if with_model:
            check_model_reads(name, df)

    print(f'\n{"ALL CHECKS PASSED" if not failures else f"{len(failures)} CHECK(S) FAILED: {failures}"}')
    sys.exit(1 if failures else 0)


if __name__ == '__main__':
    main()
