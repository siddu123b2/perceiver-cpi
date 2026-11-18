"""Find a real, experimentally solved structure for a compound-protein pair.

The affinity model says how strongly a pair binds. The next question is always what it looks like.
Rather than predict a pose, this first asks whether anybody has already solved one: BindingDB
records, for each measurement, the PDB entry of the ligand-target complex where one exists.

Three answers, best first:

  exact_complex  this compound bound to this protein has been crystallised. The viewer can show
                 the real thing, and the ligand is identified by its PDB chemical id.
  same_target    this protein has been solved, with some other ligand bound. Useful context - it
                 shows the real fold and the real pocket - but the compound on screen is not the
                 one the user asked about, and the app must say so.
  none           nothing on record. This is where docking takes over.

Built by data/build_structure_index.py. Compounds are matched on InChIKey, so the same molecule
written two different ways still matches; proteins on the exact sequence first, then on their first
180 residues, which catches the same protein recorded at slightly different lengths.
"""
import json
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX_PATH = ROOT / 'data' / 'structures' / 'bindingdb_structures.json'
SEQ_PREFIX = 180


@lru_cache(maxsize=1)
def index():
    if not INDEX_PATH.exists():
        return None
    return json.loads(INDEX_PATH.read_text(encoding='utf-8'))


@lru_cache(maxsize=512)
def _inchikey(smiles):
    from rdkit import Chem, RDLogger
    RDLogger.DisableLog('rdApp.*')
    molecule = Chem.MolFromSmiles(smiles)
    if molecule is None:
        return None
    try:
        return Chem.MolToInchiKey(molecule)
    except Exception:
        return None


def find(smiles, sequence):
    """Best available structure for this pair. Never raises - a missing index just means 'none'."""
    data = index()
    if data is None:
        return {'level': 'none', 'pdb_ids': [], 'ligand_code': None,
                'detail': 'Structure index not built. Run data/build_structure_index.py.'}

    sequence = ''.join(sequence.split()).upper()
    key = _inchikey(smiles)
    prefix = sequence[:SEQ_PREFIX]

    # 1. the exact complex
    if key:
        hit = data['pairs'].get(f'{key}|{prefix}')
        if hit:
            return {
                'level': 'exact_complex',
                'pdb_ids': hit,
                'ligand_code': data['het'].get(key),
                'detail': 'This compound bound to this protein has been solved experimentally.',
            }

    # 2. the same protein, someone else's ligand
    ids = data['sequences'].get(sequence) or data['prefixes'].get(prefix)
    if ids:
        return {
            'level': 'same_target',
            'pdb_ids': ids,
            'ligand_code': None,
            'detail': 'This protein has been solved, bound to a different ligand. '
                      'The structure is real; the molecule shown in it is not the one you entered.',
        }

    # 3. the compound alone, bound to something else - weakest, but still a real pose of the molecule
    if key:
        ids = data['compounds'].get(key)
        if ids:
            return {
                'level': 'same_compound',
                'pdb_ids': ids,
                'ligand_code': data['het'].get(key),
                'detail': 'This compound has been solved bound to a different protein.',
            }

    return {'level': 'none', 'pdb_ids': [], 'ligand_code': None,
            'detail': 'No solved structure on record for either side of this pair.'}


def stats():
    data = index()
    if data is None:
        return {'available': False}
    return {
        'available': True,
        'exact_pairs': len(data['pairs']),
        'compounds': len(data['compounds']),
        'proteins': len(data['sequences']),
        'source_rows': data.get('source_rows'),
    }
