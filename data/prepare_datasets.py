"""Phase 2: clean the raw Davis, KIBA and Metz datasets for Perceiver CPI.

Reads   reference/data/{davis,kiba,metz}.csv   columns: compound_iso_smiles, target_sequence, affinity
Writes  data/{davis,kiba,metz}.csv             columns: smiles, sequence, label  (what model_2d reads)
        data/logs/kiba_merged_pairs.csv        every KIBA pair that appeared more than once
        data/logs/<name>_dropped_rows.csv      rows with an invalid SMILES or sequence (only if any)
        data/prep_report.md                    before/after table

Rules (CLAUDE.md section 3):
  Davis  keep every row (the paper uses all 30,056).
  KIBA   drop exact duplicate rows, then give each repeated smiles+sequence pair the mean label.
  Metz   no changes.
  All    drop and log invalid SMILES (RDKit) and sequences with letters TAPE can't encode.
The three datasets are never merged: each one has its own label scale.

Run from the project root:  .venv\\Scripts\\python.exe data\\prepare_datasets.py
"""
from datetime import date
from pathlib import Path

import pandas as pd
from rdkit import Chem, RDLogger
from tape import TAPETokenizer

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / 'reference' / 'data'
OUT_DIR = ROOT / 'data'
LOG_DIR = OUT_DIR / 'logs'

DATASETS = ['davis', 'kiba', 'metz']
RENAME = {'compound_iso_smiles': 'smiles', 'target_sequence': 'sequence', 'affinity': 'label'}
PAIR = ['smiles', 'sequence']

# The model turns each amino acid into a number with TAPE's UniRep vocabulary.
# A letter outside that vocabulary would crash training, so we check for it here.
TAPE_LETTERS = {token for token in TAPETokenizer(vocab='unirep').vocab if len(token) == 1}
# TAPE adds a start and a stop token and the model keeps 500 tokens, so it sees at most 499 residues.
MAX_RESIDUES = 499

RDLogger.DisableLog('rdApp.*')


def load_raw(name):
    df = pd.read_csv(RAW_DIR / f'{name}.csv')
    assert list(df.columns) == list(RENAME), f'{name}: unexpected columns {list(df.columns)}'
    return df.rename(columns=RENAME)


def split_invalid(df):
    """Separate rows the model can't use: missing value, SMILES RDKit can't read, unknown amino-acid letter."""
    reason = pd.Series('', index=df.index)
    missing = df.isna().any(axis=1)
    reason[missing] = 'missing value'

    present = df[~missing]
    bad_smiles = {s for s in present.smiles.unique() if Chem.MolFromSmiles(s) is None}
    bad_sequences = {q for q in present.sequence.unique() if not set(q) <= TAPE_LETTERS}
    reason[~missing & df.smiles.isin(bad_smiles)] = 'invalid SMILES (RDKit)'
    reason[~missing & df.sequence.isin(bad_sequences)] = 'letter not in TAPE vocabulary'

    bad = reason != ''
    return df[~bad], df[bad].assign(reason=reason[bad])


def merge_repeated_pairs(df):
    """KIBA rule: drop exact duplicate rows, then average the label of each repeated pair.

    Returns the cleaned table (one row per pair, in order of first appearance)
    and a log with one row for every pair that appeared more than once.
    """
    deduplicated = df.drop_duplicates()
    merged = deduplicated.groupby(PAIR, sort=False, as_index=False)['label'].mean()

    raw = df.groupby(PAIR, sort=False)['label']
    used = deduplicated.groupby(PAIR, sort=False)['label']
    join = lambda labels: ';'.join(map(str, labels))
    log = pd.DataFrame({
        'raw_rows': raw.size(),
        'raw_labels': raw.agg(join),
        'labels_averaged': used.agg(join),
        'final_label': used.mean(),
    })
    log = log[log.raw_rows > 1].reset_index()
    return merged, log[['smiles', 'raw_rows', 'raw_labels', 'labels_averaged', 'final_label', 'sequence']]


def describe(df):
    pairs = df.groupby(PAIR)['label']
    sequences = pd.Series(df.sequence.unique())
    # If one pair has several different labels, no model can fit all of them: it can at best predict
    # their mean. This is the lowest MSE any model could reach on these rows.
    noise_floor = ((df.label - pairs.transform('mean')) ** 2).mean()
    return {
        'Rows': len(df),
        'Unique compounds (SMILES)': df.smiles.nunique(),
        'Unique protein sequences': len(sequences),
        'Unique compound-protein pairs': pairs.ngroups,
        'Exact duplicate rows': df.duplicated().sum(),
        'Pairs appearing more than once': (pairs.size() > 1).sum(),
        '... of which with different labels': (pairs.nunique() > 1).sum(),
        'Label min': df.label.min(),
        'Label mean': df.label.mean(),
        'Label max': df.label.max(),
        'Lowest possible MSE (label noise floor)': noise_floor,
        'Rows whose sequence contains X': df.sequence.str.contains('X').sum(),
        f'Sequences longer than {MAX_RESIDUES} residues (tail cut off)': (sequences.str.len() > MAX_RESIDUES).sum(),
    }


def fmt(value):
    return f'{value:,}' if pd.api.types.is_integer(value) else f'{value:.4f}'


def report_section(name, before, after, changes):
    lines = [f'## {name.capitalize()}', '']
    lines += [f'- {change}' for change in changes]
    lines += ['', '| | Raw file | Cleaned |', '|---|---|---|']
    lines += [f'| {key} | {fmt(before[key])} | {fmt(after[key])} |' for key in before]
    return '\n'.join(lines) + '\n'


REPORT_HEADER = f"""# Phase 2 data-cleaning report

Generated by `data/prepare_datasets.py` on {date.today()}. Re-run that script to rebuild this file and the cleaned CSVs.

- **Input:** `reference/data/{{davis,kiba,metz}}.csv` (columns `compound_iso_smiles, target_sequence, affinity`).
- **Output:** `data/{{davis,kiba,metz}}.csv` (columns `smiles, sequence, label`, the names the model code reads).
- **Rules:** CLAUDE.md section 3. Davis: keep every row. KIBA: drop exact duplicates, then average repeated pairs. Metz: no changes. All: drop invalid SMILES or sequences.
- The datasets are never merged or compared: Davis is pKd, KIBA is a KIBA score, and Metz is pKi.

How to read the tables:
- **Lowest possible MSE (label noise floor):** when the same compound-protein pair has different labels, even a perfect model can only predict their average. This is the MSE that remains in that best case.
- **Sequences longer than {MAX_RESIDUES} residues:** the model keeps 500 tokens, including TAPE's start and stop tokens, so only the first {MAX_RESIDUES} amino acids are used. This is the paper's design; nothing is removed here.
- **X:** an unknown amino acid. TAPE has a token for it, so these rows are kept.

"""


def main():
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    sections = []

    for name in DATASETS:
        raw = load_raw(name)
        clean, dropped = split_invalid(raw)
        changes = ['Renamed columns to `smiles, sequence, label`.']

        if len(dropped):
            dropped.to_csv(LOG_DIR / f'{name}_dropped_rows.csv', index=False, lineterminator='\n')
            changes.append(f'Dropped {len(dropped):,} unusable rows, listed in `logs/{name}_dropped_rows.csv`.')
        else:
            changes.append('Every SMILES is valid in RDKit and every sequence uses only TAPE letters: 0 rows dropped.')

        if name == 'kiba':
            n_exact = clean.duplicated().sum()
            clean, log = merge_repeated_pairs(clean)
            log.to_csv(LOG_DIR / 'kiba_merged_pairs.csv', index=False, lineterminator='\n')
            n_averaged = (log.labels_averaged.str.count(';') > 0).sum()
            changes.append(f'Dropped {n_exact:,} exact duplicate rows.')
            changes.append(f'Averaged the labels of {n_averaged:,} pairs that still had several different labels. '
                           f'All {len(log):,} repeated pairs are listed in `logs/kiba_merged_pairs.csv`.')
        elif name == 'davis':
            changes.append('Kept every row, including repeated pairs, as the paper does. Repeats come from kinase '
                           'variants that share an identical sequence. Phase 3 splits by sequence, so a repeat '
                           'can never land in both train and test.')
        else:
            changes.append('No other changes (the file has no duplicates).')

        clean.to_csv(OUT_DIR / f'{name}.csv', index=False, lineterminator='\n')
        sections.append(report_section(name, describe(raw), describe(clean), changes))
        print(f'{name}: {len(raw):,} raw rows -> {len(clean):,} cleaned rows, {len(dropped)} dropped as invalid')

    (OUT_DIR / 'prep_report.md').write_text(REPORT_HEADER + '\n'.join(sections), encoding='utf-8')
    print(f'Report written to {OUT_DIR / "prep_report.md"}')


if __name__ == '__main__':
    main()
