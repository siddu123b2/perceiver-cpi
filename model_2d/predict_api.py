"""One function the app calls: predict(smiles, sequence, model) -> score, unit, confidence, band.

  from predict_api import predict, available_models
  predict('CC(=O)Oc1ccccc1C(=O)O', 'MKKFFDSRRE...', 'davis')

Models are loaded once and kept in memory, so the first call is slow (a few seconds per checkpoint)
and the rest are fast. Everything it serves comes from models/registry.json, built by
models/build_registry.py.

WHAT THE NUMBERS MEAN, and what they do not:

  score       the model's prediction, in that dataset's own unit (pKd, pKi or KIBA score). Higher is
              stronger binding. Never compare a score from one model with a score from another: the
              three datasets use different scales and were never merged.

  confidence  the spread of 30 predictions made with dropout left switched on (MC dropout). It is
              NOT a 95% confidence interval and must never be shown as one - measured coverage is
              33-63%, not 95% (CLAUDE.md, Phase 4). It is reported as a low/medium/high label whose
              cut-offs were calibrated on the VALIDATION set, never the test set.

  band        strong / moderate / weak, from published cut-offs where one exists. registry.json
              records the source and flags which half of each rule is our own assumption.

  warnings    the honest part. The model is far better at telling compounds apart than proteins
              (experiments/phase5/protein_sensitivity.md), only sees the first 499 residues, and was
              trained on kinases. Anything unusual about the input is reported here.

ONE PAIR AT A TIME vs THE BATCHED EVALUATION. The app scores a single pair per request, while every
number we report came from predicting the test set in batches of 50. These differ very slightly, and
the reason is in the original chemprop code: a molecule's graph is padded to the largest number of
bonds-per-atom *in its batch*, and the padding row's message is not exactly zero, so a molecule's
embedding shifts a little depending on what else is in the batch. Measured on 40 random Davis test
rows: mean difference 0.0067, max 0.0246, and test MSE moves from 0.3207 to 0.3216 (0.3%). That is
far below this model's error (RMSE 0.80), so we score one pair at a time and accept it. A given input
always returns the same answer.
"""
import json
import re
import sys
from functools import lru_cache
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

REGISTRY_PATH = ROOT / 'models' / 'registry.json'
MAX_RESIDUES = 499          # the model keeps 500 tokens, two of which are start and stop
N_SAMPLES = 30

# TAPE's UniRep vocabulary. X, B, Z and J share one token; U and O are not in it.
KNOWN_RESIDUES = set('ACDEFGHIKLMNPQRSTVWYXBZJ')


class InvalidInput(ValueError):
    """The user's input cannot be scored at all (as opposed to merely being unusual)."""


@lru_cache(maxsize=1)
def registry():
    if not REGISTRY_PATH.exists():
        raise FileNotFoundError(
            f'{REGISTRY_PATH} is missing. Build it with: python models/build_registry.py')
    return json.loads(REGISTRY_PATH.read_text(encoding='utf-8'))


def available_models():
    """What the app can offer in its dropdown, with the honest numbers for each."""
    return {name: {'unit': spec['unit'], 'bands': spec['bands'],
                   'test_mse': spec['test_mse'], 'paper_mse': spec['paper_mse'],
                   'guess_average_mse': spec['guess_average_mse'],
                   'trained_on': spec['scope'], 'description': spec['why']}
            for name, spec in registry().items()}


@lru_cache(maxsize=4)
def _load(name):
    """Load one dataset's checkpoints and its scope data. Cached, so this happens once."""
    import torch
    from mc_dropout import QUIET
    from chemprop.utils import load_args, load_checkpoint, load_scalers

    spec = registry()[name]
    folder = ROOT / 'models' / name
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    models = []
    for checkpoint in spec['checkpoints']:
        path = folder / checkpoint
        if not path.exists():
            raise FileNotFoundError(
                f'{path} is missing. Rebuild it with: python models/build_registry.py')
        models.append((load_checkpoint(path, device=device, logger=QUIET),
                       load_args(path), load_scalers(path)[0]))
    scope = json.loads((folder / 'scope.json').read_text(encoding='utf-8'))
    return models, scope, spec


@lru_cache(maxsize=4)
def _scope_fingerprints(name):
    """Morgan fingerprints of the training compounds, and 3-mer sets of the training proteins,
    for the 'is this anything like what you were trained on?' check."""
    from rdkit import Chem, RDLogger
    from rdkit.Chem import AllChem
    RDLogger.DisableLog('rdApp.*')
    _, scope, _ = _load(name)
    fingerprints = []
    for smiles in scope['compounds']:
        molecule = Chem.MolFromSmiles(smiles)
        if molecule is not None:
            fingerprints.append(AllChem.GetMorganFingerprintAsBitVect(molecule, 2, nBits=2048))
    kmers = [{protein[i:i + 3] for i in range(len(protein) - 2)} for protein in scope['proteins']]
    return fingerprints, kmers


def _closest_compound(name, smiles):
    """Highest Tanimoto similarity to any compound in this dataset, 0-1."""
    from rdkit import Chem
    from rdkit.Chem import AllChem, DataStructs
    fingerprints, _ = _scope_fingerprints(name)
    molecule = Chem.MolFromSmiles(smiles)
    query = AllChem.GetMorganFingerprintAsBitVect(molecule, 2, nBits=2048)
    return max(DataStructs.BulkTanimotoSimilarity(query, fingerprints), default=0.0)


def _closest_protein(name, sequence):
    """Highest 3-mer overlap (Jaccard) with any protein in this dataset, 0-1.

    A cheap stand-in for sequence alignment: good enough to tell 'a kinase much like the training
    ones' from 'something completely different', and fast enough to run on every request.
    """
    _, kmers = _scope_fingerprints(name)
    query = {sequence[i:i + 3] for i in range(len(sequence) - 2)}
    if not query:
        return 0.0
    return max((len(query & other) / len(query | other) for other in kmers), default=0.0)


def check_inputs(smiles, sequence, model):
    """Reject what cannot be scored; return warnings for what merely looks unusual."""
    from rdkit import Chem, RDLogger
    RDLogger.DisableLog('rdApp.*')

    if model not in registry():
        raise InvalidInput(f'Unknown model {model!r}. Choose one of: '
                           + ', '.join(sorted(registry())))
    if not isinstance(smiles, str) or not smiles.strip():
        raise InvalidInput('Please enter a compound as a SMILES string.')
    if not isinstance(sequence, str) or not sequence.strip():
        raise InvalidInput('Please enter a protein as an amino-acid sequence.')

    smiles = smiles.strip()
    if Chem.MolFromSmiles(smiles) is None:
        raise InvalidInput(f'{smiles!r} is not a valid SMILES string. Example: '
                           'CC(=O)Oc1ccccc1C(=O)O (aspirin).')

    sequence = re.sub(r'\s+', '', sequence).upper()
    if sequence.startswith('>'):
        raise InvalidInput('That looks like a FASTA file. Please paste only the sequence itself, '
                           'without the ">" description line.')
    unknown = sorted(set(sequence) - KNOWN_RESIDUES)
    if unknown:
        raise InvalidInput('The protein contains characters that are not amino acids: '
                           + ', '.join(unknown))
    if len(sequence) < 20:
        raise InvalidInput(f'The protein is only {len(sequence)} residues long. Real protein '
                           'targets are hundreds of residues; please check the input.')

    warnings = []
    if len(sequence) > MAX_RESIDUES:
        warnings.append(
            f'Only the first {MAX_RESIDUES} of {len(sequence)} residues are used. This is how the '
            f'published model works, but if the binding site lies beyond residue {MAX_RESIDUES} '
            f'the model cannot see it.')
    return smiles, sequence, warnings


def _band(score, bands):
    if score >= bands['strong']:
        return 'strong binder'
    if score >= bands['moderate']:
        return 'moderate binder'
    return 'weak binder'


def _confidence_label(spread, bands_spec):
    """low/medium/high, against cut-offs calibrated on the validation set (calibrate.py)."""
    cuts = bands_spec.get('confidence_cuts')
    if not cuts:
        return None
    return 'high' if spread <= cuts[0] else ('medium' if spread <= cuts[1] else 'low')


def predict(smiles, sequence, model='davis', n_samples=N_SAMPLES, seed=0):
    """Score one compound against one protein. Returns a dict ready to serialise as JSON."""
    from mc_dropout import predict_with_mc_dropout

    smiles, sequence, warnings = check_inputs(smiles, sequence, model)
    models, _, spec = _load(model)

    scores, samples = [], []
    for network, train_args, scaler in models:
        score, _, draws = predict_with_mc_dropout(
            network, train_args, [smiles], [sequence], scaler, n_samples=n_samples, seed=seed)
        scores.append(float(score[0]))
        samples.append(draws[:, 0])
    score = float(np.mean(scores))
    # Pooling the draws across checkpoints folds seed-to-seed disagreement into the spread as well
    # as dropout noise, so an ensemble that disagrees with itself reports a wider +/-.
    spread = float(np.concatenate(samples).std())

    compound_similarity = _closest_compound(model, smiles)
    protein_similarity = _closest_protein(model, sequence)
    # Thresholds come from the data (models/build_registry.py): the point below which an input is
    # less like this dataset than 90% of the dataset is like itself. Guessing here would be wrong -
    # Davis kinases sit at a median 3-mer similarity of only 0.22 to each other.
    cuts = spec['scope_thresholds']
    if compound_similarity < cuts['compound']:
        warnings.append(
            f'This compound is less like the {model} training compounds than almost all of them '
            f'are like each other (closest match {compound_similarity:.2f}, typical floor '
            f'{cuts["compound"]:.2f}). The prediction is an extrapolation.')
    if protein_similarity < cuts['protein']:
        warnings.append(
            f'This protein is less like the {model} training proteins than almost all of them are '
            f'like each other (closest match {protein_similarity:.2f}, typical floor '
            f'{cuts["protein"]:.2f}). The model was trained on kinases.')
    warnings.append(
        'The model distinguishes compounds far better than proteins: with the compound held fixed, '
        'its ranking of proteins is close to random. Treat the effect of changing the protein with '
        'particular caution.')

    return {
        'score': round(score, 3),
        'unit': spec['unit'],
        'confidence': round(spread, 3),
        'confidence_label': _confidence_label(spread, spec['bands']),
        'confidence_note': 'Spread of 30 predictions with dropout left on. This is NOT a 95% '
                           'confidence interval; it tracks real error only loosely.',
        'band': _band(score, spec['bands']),
        'band_source': spec['bands']['source'],
        'model': model,
        'model_quality': {'our_test_mse': spec['test_mse'], 'paper_test_mse': spec['paper_mse'],
                          'guess_average_mse': spec['guess_average_mse']},
        'similarity_to_training': {'compound': round(compound_similarity, 3),
                                   'protein': round(protein_similarity, 3),
                                   'in_scope_floor': {'compound': cuts['compound'],
                                                      'protein': cuts['protein']}},
        'warnings': warnings,
    }


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--smiles', required=True)
    parser.add_argument('--sequence', required=True)
    parser.add_argument('--model', default='davis', choices=sorted(registry()))
    options = parser.parse_args()
    print(json.dumps(predict(options.smiles, options.sequence, options.model), indent=2))
