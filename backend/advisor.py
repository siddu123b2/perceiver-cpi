"""Recommend which of the three models to use for a given compound and protein.

Deliberately NOT a language model. Everything here is measured against the training sets we already
have on disk, so the recommendation is reproducible, explainable, and cannot invent anything.

The logic is the one a chemist would apply by hand: a model is trustworthy on inputs that resemble
what it was trained on, so score each dataset by how familiar this particular pair looks to it.

  compound familiarity  highest Tanimoto similarity (Morgan r2, 2048 bits) to that dataset's
                        compounds, read against the dataset's own floor - the 10th percentile of
                        how similar its training compounds are to each other.
  protein familiarity   the same idea using 3-mer overlap on sequences.

Reading each similarity against that dataset's own floor matters. A raw 0.3 Tanimoto is unremarkable
in KIBA, whose compounds sit at 0.33 to each other, but is comfortably inside the distribution for
Davis, whose 68 compounds are far more scattered (floor 0.19). Comparing raw numbers across datasets
would quietly favour whichever dataset happens to be most self-similar.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'model_2d'))

import predict_api   # noqa: E402

# A protein that is out of family matters more than an unusual compound: the models are far more
# sensitive to compound identity, so an unfamiliar protein is the likelier source of a bad answer.
COMPOUND_WEIGHT = 0.45
PROTEIN_WEIGHT = 0.55


def _standing(similarity, floor):
    """Where this similarity sits relative to the dataset's own floor.

    1.0 means 'as typical as the training data is to itself'; below 1.0 means less familiar than
    90% of the training set, which is where the extrapolation warning fires.
    """
    if floor <= 0:
        return 0.0
    return float(similarity) / float(floor)


def advise(smiles, sequence):
    """Rank the three models for this pair. Raises predict_api.InvalidInput on unusable input."""
    registry = predict_api.registry()
    # validate once, against any model, so the error message is the same one /predict would give
    smiles, sequence, warnings = predict_api.check_inputs(smiles, sequence, next(iter(registry)))

    options = []
    for name, spec in registry.items():
        compound = predict_api._closest_compound(name, smiles)
        protein = predict_api._closest_protein(name, sequence)
        floors = spec['scope_thresholds']
        c_standing = _standing(compound, floors['compound'])
        p_standing = _standing(protein, floors['protein'])
        score = COMPOUND_WEIGHT * min(c_standing, 3.0) + PROTEIN_WEIGHT * min(p_standing, 3.0)

        reasons = []
        if c_standing >= 1.0:
            reasons.append(f'compound is a normal fit for this set ({compound:.2f} vs a '
                           f'{floors["compound"]:.2f} floor)')
        else:
            reasons.append(f'compound is less like this set than most of its own members '
                           f'({compound:.2f} vs {floors["compound"]:.2f})')
        if p_standing >= 1.0:
            reasons.append(f'protein is well inside the set ({protein:.2f} vs '
                           f'{floors["protein"]:.2f})')
        else:
            reasons.append(f'protein is outside the usual range ({protein:.2f} vs '
                           f'{floors["protein"]:.2f})')

        options.append({
            'model': name,
            'unit': spec['unit'],
            'fit_score': round(score, 3),
            'compound_similarity': round(compound, 3),
            'protein_similarity': round(protein, 3),
            'compound_in_range': c_standing >= 1.0,
            'protein_in_range': p_standing >= 1.0,
            'trained_on': spec['scope'],
            'test_mse': spec['test_mse'],
            'reasons': reasons,
        })

    options.sort(key=lambda o: o['fit_score'], reverse=True)
    best = options[0]
    runner_up = options[1]

    if best['compound_in_range'] and best['protein_in_range']:
        confidence = 'good'
        summary = (f'{best["model"].upper()} is the best fit: both your compound and your protein '
                   f'sit inside what it was trained on.')
    elif best['protein_in_range'] or best['compound_in_range']:
        confidence = 'partial'
        side = 'protein' if best['protein_in_range'] else 'compound'
        other = 'compound' if side == 'protein' else 'protein'
        summary = (f'{best["model"].upper()} is the closest match, but only on the {side}. Your '
                   f'{other} is unlike anything in any of the three training sets, so treat the '
                   f'number as an extrapolation.')
    else:
        confidence = 'poor'
        summary = ('None of the three models has seen anything much like this pair. '
                   f'{best["model"].upper()} is nominally closest, but the prediction is an '
                   f'extrapolation on both sides and should not be relied on.')

    margin = best['fit_score'] - runner_up['fit_score']
    if margin < 0.15 and confidence != 'poor':
        summary += (f' {runner_up["model"].upper()} is an almost equally good fit, so comparing '
                    f'both is reasonable — but remember their scales differ.')

    return {
        'recommended': best['model'],
        'confidence': confidence,
        'summary': summary,
        'margin': round(margin, 3),
        'options': options,
        'warnings': warnings,
        'method': 'Similarity to each training set, measured against that set\'s own 10th-percentile '
                  'floor. No language model is involved; the same inputs always give the same answer.',
    }
