"""Phase 3: build the 5-fold train/val/test splits for every setting the paper used.

Reads   data/{davis,kiba,metz}.csv                                (from prepare_datasets.py)
Writes  data/splits/<dataset>/<setting>/fold{k}_{train,val,test}.csv
        data/splits/summary.md              size of every fold + novel-hard similarity numbers
        data/splits/manifest.json           row count and MD5 fingerprint of every split file
        data/splits/davis_protein_identity.npz   cached protein similarities (slow to compute)

Settings (paper section 3.2; Davis gets all four, KIBA and Metz only novel pair):
  novel_compound   no compound appears in both training and test
  novel_protein    no protein sequence appears in both training and test
  novel_pair       neither the compound nor the protein of a test row appears in training.
                   Rows that mix a test compound with a training protein (or the reverse) are unused.
  novel_hard_pair  novel_pair, keeping only test rows whose compound AND protein are < 0.3 similar
                   to every training compound / protein
"Training" means train + val: the validation set is cut out of the training data.

Decisions the paper leaves open (CLAUDE.md section 4, approved 2026-10-29):
  1. Folds: sort the unique SMILES / sequences alphabetically and cut them into 5 blocks of 20%;
     fold k tests block k. This is what the repo's prepare_data_for_setting.py does.
  2. Validation: a random 20% of each fold's training pairs (seeded). Rows with the same
     smiles+sequence stay together, so the same input is never in both train and val.
  3. Novel-hard: both the compound and the protein must be < 0.3 (highest similarity to any training one).
  4. Protein similarity: global alignment of the first 500 residues (BLOSUM62, gap open 10,
     gap extend 0.5, free end gaps = EMBOSS needle defaults); identical positions / 500.
  Compound similarity: Tanimoto on Morgan radius-2, 2048-bit fingerprints (the model's own ECFP).

Run from the project root:  .venv\\Scripts\\python.exe data\\make_splits.py   (~7 min the first time)
"""
import hashlib
import json
import time
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
from Bio import Align
from Bio.Align import substitution_matrices
from rdkit import Chem, DataStructs, RDLogger
from rdkit.Chem import AllChem

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / 'data'
SPLIT_DIR = DATA_DIR / 'splits'
IDENTITY_CACHE = SPLIT_DIR / 'davis_protein_identity.npz'

SETTINGS = {
    'davis': ['novel_pair', 'novel_compound', 'novel_protein', 'novel_hard_pair'],
    'kiba': ['novel_pair'],
    'metz': ['novel_pair'],
}
N_FOLDS = 5
TEST_SHARE = 0.2      # each test block holds 20% of the compounds / proteins
VAL_SHARE = 0.2       # validation = 20% of each fold's training pairs
SEED = 0              # fold k uses seed SEED + k for its validation split
HARD_CUTOFF = 0.3
PROTEIN_LENGTH = 500  # the paper compares proteins over their first 500 residues
PAIR = ['smiles', 'sequence']

RDLogger.DisableLog('rdApp.*')

ALIGNER = Align.PairwiseAligner(mode='global')
ALIGNER.substitution_matrix = substitution_matrices.load('BLOSUM62')
ALIGNER.open_gap_score, ALIGNER.extend_gap_score = -10, -0.5
ALIGNER.open_end_gap_score, ALIGNER.extend_end_gap_score = 0, 0


# ---------- similarity ----------

def morgan(smiles):
    """The same fingerprint the model computes (chemprop/data/data.py, add_features)."""
    return AllChem.GetMorganFingerprintAsBitVect(Chem.MolFromSmiles(smiles), radius=2, nBits=2048)


def protein_identity(a, b):
    """Share of the 500 positions where the two aligned proteins have the same amino acid."""
    alignment = ALIGNER.align(a[:PROTEIN_LENGTH], b[:PROTEIN_LENGTH])[0]
    return alignment.counts().identities / PROTEIN_LENGTH


def identity_table(sequences):
    """All-against-all protein identity, cached on disk because it takes ~6 minutes for Davis."""
    sequences = sorted(sequences)
    if IDENTITY_CACHE.exists():
        cache = np.load(IDENTITY_CACHE)
        if list(cache['sequences']) == sequences:
            return pd.DataFrame(cache['identity'], index=sequences, columns=sequences)

    n = len(sequences)
    matrix = np.eye(n)
    start = time.time()
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i, j] = matrix[j, i] = protein_identity(sequences[i], sequences[j])
        if i % 50 == 0:
            print(f'  protein identity: row {i + 1}/{n} ({time.time() - start:.0f} s)')
    np.savez_compressed(IDENTITY_CACHE, sequences=np.array(sequences), identity=matrix)
    return pd.DataFrame(matrix, index=sequences, columns=sequences)


# ---------- splitting ----------

def test_blocks(items):
    """Decision 1: sort the unique items and cut them into 5 consecutive blocks of 20%."""
    items = sorted(set(items))
    size = round(TEST_SHARE * len(items))
    return [set(items[k * size:(k + 1) * size]) for k in range(N_FOLDS)]


def split_validation(training, seed):
    """Decision 2: move a random 20% of the training pairs to validation, keeping repeats together."""
    pair_id = training.groupby(PAIR, sort=False).ngroup()
    n_pairs = pair_id.max() + 1
    val_ids = np.random.default_rng(seed).permutation(n_pairs)[:round(VAL_SHARE * n_pairs)]
    is_val = pair_id.isin(val_ids)
    return training[~is_val], training[is_val]


def keep_dissimilar(test, training, identity):
    """Decisions 3 + 4: keep test rows whose compound and protein are both < 0.3 similar to all training ones."""
    train_fps = [morgan(s) for s in training.smiles.unique()]
    compound_max = {s: max(DataStructs.BulkTanimotoSimilarity(morgan(s), train_fps)) for s in test.smiles.unique()}
    train_sequences = list(training.sequence.unique())
    protein_max = {q: identity.loc[q, train_sequences].max() for q in test.sequence.unique()}

    keep = (test.smiles.map(compound_max) < HARD_CUTOFF) & (test.sequence.map(protein_max) < HARD_CUTOFF)
    info = {
        'Novel-pair test rows': len(test),
        'Compounds kept': f'{sum(v < HARD_CUTOFF for v in compound_max.values())}/{len(compound_max)}',
        'Proteins kept': f'{sum(v < HARD_CUTOFF for v in protein_max.values())}/{len(protein_max)}',
    }
    return test[keep], info


def make_folds(df, setting, identity=None):
    compound_blocks = test_blocks(df.smiles)
    protein_blocks = test_blocks(df.sequence)
    for k in range(N_FOLDS):
        test_compound = df.smiles.isin(compound_blocks[k])
        test_protein = df.sequence.isin(protein_blocks[k])
        if setting == 'novel_compound':
            test, training = df[test_compound], df[~test_compound]
        elif setting == 'novel_protein':
            test, training = df[test_protein], df[~test_protein]
        else:  # novel_pair and novel_hard_pair
            test, training = df[test_compound & test_protein], df[~test_compound & ~test_protein]

        info = {}
        if setting == 'novel_hard_pair':
            test, info = keep_dissimilar(test, training, identity)
        train, val = split_validation(training, SEED + k)
        info = {'Unused rows': len(df) - len(training) - len(test), **info}
        yield k, train, val, test, info


# ---------- output ----------

def md5(path):
    return hashlib.md5(path.read_bytes()).hexdigest()


def summary_table(rows):
    columns = list(rows[0])
    lines = ['| ' + ' | '.join(columns) + ' |', '|' + '---|' * len(columns)]
    lines += ['| ' + ' | '.join(f'{v:,}' if isinstance(v, (int, np.integer)) else str(v) for v in row.values()) + ' |'
              for row in rows]
    return '\n'.join(lines)


SUMMARY_HEADER = f"""# Phase 3 splits

Generated by `data/make_splits.py` on {date.today()}. Re-run it to rebuild the split files (they are not in git).
`data/check_splits.py` checks every fold for leakage, and `manifest.json` holds an MD5 fingerprint of every file,
so a rebuild (e.g. on Colab) can be proven identical.

How the folds are made (decisions approved 2026-10-29, see CLAUDE.md section 4):
- **Folds:** unique SMILES and sequences are sorted alphabetically and cut into 5 blocks of 20%. Fold k tests block k, as the official repo does.
- **Validation:** a random 20% of each fold's training pairs (seed = fold number). Identical smiles+sequence rows stay together.
- **Novel pair:** a test row has a test-block compound *and* a test-block protein. A training row has neither. Rows that mix the two are unused, because they fit neither side.
- **Novel-hard pair:** novel pair, keeping only test rows whose compound has Tanimoto < {HARD_CUTOFF} to every training compound *and* whose protein has identity < {HARD_CUTOFF} to every training protein. Identity = identical positions / 500 after a global BLOSUM62 alignment of the first 500 residues. Train and val are the same as novel pair.
- Only the settings the paper reports are built: all four for Davis, novel pair for KIBA and Metz.

"""


def main():
    SPLIT_DIR.mkdir(parents=True, exist_ok=True)
    manifest, sections = {}, []

    for dataset, settings in SETTINGS.items():
        df = pd.read_csv(DATA_DIR / f'{dataset}.csv')
        identity = identity_table(df.sequence.unique()) if 'novel_hard_pair' in settings else None

        for setting in settings:
            out_dir = SPLIT_DIR / dataset / setting
            out_dir.mkdir(parents=True, exist_ok=True)
            rows = []
            for k, train, val, test, info in make_folds(df, setting, identity):
                for part, frame in [('train', train), ('val', val), ('test', test)]:
                    path = out_dir / f'fold{k}_{part}.csv'
                    frame.to_csv(path, index=False, lineterminator='\n')
                    manifest[path.relative_to(SPLIT_DIR).as_posix()] = {'rows': len(frame), 'md5': md5(path)}
                rows.append({'Fold': k, 'Train': len(train), 'Val': len(val), 'Test': len(test), **info,
                             'Test compounds': test.smiles.nunique(), 'Test proteins': test.sequence.nunique()})
            sections.append(f'## {dataset.capitalize()}: {setting.replace("_", " ")}\n\n{summary_table(rows)}\n')
            print(f'{dataset} {setting}: test rows per fold {[r["Test"] for r in rows]}')

    (SPLIT_DIR / 'manifest.json').write_text(json.dumps(manifest, indent=1) + '\n', encoding='utf-8')
    (SPLIT_DIR / 'summary.md').write_text(SUMMARY_HEADER + '\n'.join(sections), encoding='utf-8')
    print(f'Wrote {len(manifest)} split files, summary.md and manifest.json to {SPLIT_DIR}')


if __name__ == '__main__':
    main()
