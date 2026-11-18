"""Build a lookup from (compound, protein) to real experimental structures, using BindingDB.

  .venv\\Scripts\\python.exe data\\build_structure_index.py --source <BindingDB_All.csv>

Why this exists. The app can already say how strongly a pair binds; the obvious next question is
"what does it look like". Predicting a pose needs docking software, and docking needs a protein
structure. But for a great many pairs somebody has already solved the structure experimentally, and
BindingDB records the PDB entry. Looking that up costs nothing and gives a real structure rather
than a prediction - which is strictly better evidence when it exists.

Three levels of answer come out of this, best first:
  1. exact complex  - this compound bound to this protein, solved. BindingDB column 30.
  2. same target    - a solved structure of this protein, with some other ligand. Column 41.
  3. nothing        - hand over to docking.

Matching is on InChIKey for compounds (so the same molecule written two ways still matches) and on
the exact sequence for proteins, plus a first-180-residue key to catch the same protein recorded at
slightly different lengths.
"""
import argparse
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data' / 'structures'

SMILES_COL = 1
HET_COL = 29
COMPLEX_COL = 30
# target chains repeat every 12 columns from 40: sequence, pdb ids, then uniprot fields
CHAIN_START = 40
CHAIN_STRIDE = 12
CHAIN_COUNT = 6
SEQ_PREFIX = 180


def inchikey(smiles, cache):
    if smiles in cache:
        return cache[smiles]
    from rdkit import Chem
    key = None
    molecule = Chem.MolFromSmiles(smiles)
    if molecule is not None:
        try:
            key = Chem.MolToInchiKey(molecule)
        except Exception:
            key = None
    cache[smiles] = key
    return key


def split_ids(cell):
    """BindingDB separates multiple PDB ids with commas."""
    return [p.strip().lower() for p in cell.split(',') if p.strip() and len(p.strip()) == 4]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--limit', type=int, default=0, help='stop after N rows (for a quick test)')
    options = parser.parse_args()

    from rdkit import RDLogger
    RDLogger.DisableLog('rdApp.*')

    source = Path(options.source)
    if not source.exists():
        sys.exit(f'no such file: {source}')

    pair_to_pdb = {}                       # "<inchikey>|<sequence hash>" -> [pdb ids]
    compound_to_pdb = defaultdict(set)     # inchikey -> complexes containing it
    sequence_to_pdb = defaultdict(set)     # exact sequence -> pdb ids of that target
    prefix_to_pdb = defaultdict(set)       # first 180 residues -> pdb ids
    het_for_compound = {}
    cache = {}
    rows = kept = 0

    csv.field_size_limit(10 ** 7)
    with source.open(encoding='utf-8', errors='replace', newline='') as handle:
        reader = csv.reader(handle)
        next(reader, None)                 # header
        for row in reader:
            rows += 1
            if options.limit and rows > options.limit:
                break
            if rows % 200000 == 0:
                print(f'  {rows:,} rows, {kept:,} with a structure', flush=True)
            if len(row) <= CHAIN_START:
                continue

            complexes = split_ids(row[COMPLEX_COL]) if len(row) > COMPLEX_COL else []
            chains = []
            for i in range(CHAIN_COUNT):
                s = CHAIN_START + i * CHAIN_STRIDE
                if len(row) > s + 1 and row[s].strip():
                    chains.append((row[s].strip().upper(), split_ids(row[s + 1])))
            if not complexes and not any(ids for _, ids in chains):
                continue

            smiles = row[SMILES_COL].strip()
            key = inchikey(smiles, cache) if smiles else None
            kept += 1

            if key and complexes:
                compound_to_pdb[key].update(complexes)
                if len(row) > HET_COL and row[HET_COL].strip():
                    het_for_compound.setdefault(key, row[HET_COL].strip())

            for sequence, ids in chains:
                if ids:
                    sequence_to_pdb[sequence].update(ids)
                    prefix_to_pdb[sequence[:SEQ_PREFIX]].update(ids)
                if key and complexes:
                    pair_to_pdb.setdefault(f'{key}|{sequence[:SEQ_PREFIX]}', set()).update(complexes)

    OUT.mkdir(parents=True, exist_ok=True)
    trim = lambda d: {k: sorted(v)[:6] for k, v in d.items() if v}   # noqa: E731
    payload = {
        'pairs': trim(pair_to_pdb),
        'compounds': trim(compound_to_pdb),
        'sequences': trim(sequence_to_pdb),
        'prefixes': trim(prefix_to_pdb),
        'het': het_for_compound,
        'source_rows': rows,
        'rows_with_structure': kept,
    }
    target = OUT / 'bindingdb_structures.json'
    target.write_text(json.dumps(payload), encoding='utf-8')
    print(f'\nread {rows:,} rows, {kept:,} had a structure')
    print(f'  exact pairs : {len(payload["pairs"]):,}')
    print(f'  compounds   : {len(payload["compounds"]):,}')
    print(f'  sequences   : {len(payload["sequences"]):,}')
    print(f'  prefixes    : {len(payload["prefixes"]):,}')
    print(f'wrote {target} ({target.stat().st_size / 1024 ** 2:.1f} MB)')


if __name__ == '__main__':
    main()
