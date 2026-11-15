"""Collect the trained checkpoints the app serves into models/<dataset>/ and write their model cards.

  .venv\\Scripts\\python.exe models\\build_registry.py

Checkpoints stay out of git (*.pt is ignored), so this rebuilds models/ from experiments/ on any
machine. registry.json is committed and records exactly which run each served model came from.

WHICH MODEL EACH DATASET GETS, and why - decided before looking at any test score:
  davis  the two 400-epoch seeds from Phase 5 Step B, averaged. More epochs and an ensemble are
         improvements on the Phase 4 recipe on principle, not because the test set said so.
  metz   the Phase 4 baseline. The Phase 5 Step 1 Metz runs differ in how their validation set was
         built, not in quality, so picking between them would have meant picking on the test score.
  kiba   the Phase 4 baseline. Nothing since has retrained it.
Step C replaces metz and kiba with 400/200-epoch two-seed ensembles when those runs finish.
"""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / 'models'
P4 = ROOT / 'experiments' / 'phase4_baseline' / 'runs'
P5 = ROOT / 'experiments' / 'phase5' / 'runs'

SERVED = {
    'davis': {
        'runs': [P5 / 'davis_base_s0', P5 / 'davis_base_s1'],
        'why': 'Phase 5 Step B, 400 epochs, two seeds averaged',
        'unit': 'pKd',
        'test_mse': 0.622, 'test_ci': None,
        'note': 'Averaging the two seeds improved test MSE from 0.643 (mean of the single runs) '
                'to 0.622.',
    },
    'metz': {
        'runs': [P4 / 'metz'],
        'why': 'Phase 4 baseline, 150 epochs, single model',
        'unit': 'pKi',
        'test_mse': 0.762, 'test_ci': 0.634,
        'note': 'Phase 5 Step 1 trained two more Metz models, but they differ in how the '
                'validation set was built rather than in quality, so choosing between them would '
                'have meant choosing on the test score. Step C replaces this with a 400-epoch '
                'two-seed ensemble.',
    },
    'kiba': {
        'runs': [P4 / 'kiba'],
        'why': 'Phase 4 baseline, 150 epochs, single model',
        'unit': 'KIBA score',
        'test_mse': 0.575, 'test_ci': 0.565,
        'note': 'Not retrained since Phase 4. Step C replaces this with a 200-epoch two-seed '
                'ensemble.',
    },
}

PAPER = {'davis': (0.463, 0.638), 'kiba': (0.522, 0.638), 'metz': (0.658, 0.675)}
GUESS_AVERAGE = {'davis': 0.751, 'kiba': 0.553, 'metz': 0.910}

# Plain-language bands. Only the "strong" cut-off is a published convention; the second cut-off is
# our own and is stated as such, per CLAUDE.md section 6. Edit here to change them everywhere.
BANDS = {
    # pKd/pKi 7 = 100 nM. >= 7 is the usual "binder" cut-off for Davis in the DTA literature
    # (DeepDTA and successors binarise Davis at pKd >= 7). 6 = 1 uM is our own moderate/weak line.
    'davis': {'strong': 7.0, 'moderate': 6.0,
              'source': 'pKd >= 7 (Kd <= 100 nM) is the standard binder cut-off used to binarise '
                        'Davis in the DTA literature. The moderate line at pKd 6 (1 uM) is our '
                        'own, following normal pharmacology practice.',
              'floor_note': 'Davis records non-binding as exactly 5.0, so about 70% of its labels '
                            'sit at the bottom of the scale.'},
    'metz': {'strong': 7.0, 'moderate': 6.0,
             'source': 'No binarisation threshold is standard for Metz. We apply the same '
                       'pharmacology convention as Davis: pKi 7 = 100 nM, pKi 6 = 1 uM. This is '
                       'our assumption, not a published cut-off.'},
    # KIBA is its own composite score, not a p-value, so the Davis logic does not carry over.
    'kiba': {'strong': 12.1, 'moderate': 11.1,
             'source': 'KIBA score >= 12.1 is the standard binder cut-off in the DTA literature '
                       '(the transformed equivalent of the original KIBA <= 3.0). The moderate '
                       'line at 11.1 is the lower edge of the crowded band identified in the '
                       'Perceiver CPI paper, and is our own choice.'},
}


def card(dataset, spec, copied):
    paper_mse, paper_ci = PAPER[dataset]
    ci = f'{spec["test_ci"]:.3f}' if spec['test_ci'] else 'not recomputed for the ensemble'
    return f"""# Model card: {dataset}

**Serves:** `/predict` with `model={dataset}`.
**Predicts:** {spec['unit']}. Higher means stronger binding.

## Where it came from

{spec['why']}. Source runs:

{chr(10).join(f'- `{run.relative_to(ROOT).as_posix()}` -> `{name}`' for run, name in copied)}

{spec['note']}

## How it was trained

- Architecture: Perceiver CPI exactly as published (Nguyen et al. 2023, Bioinformatics 39(1),
  btac731). Our only code changes are compatibility fixes plus two optional flags, all listed in
  `model_2d/CHANGES.md`; this model uses the defaults.
- Data: `data/{dataset}.csv`, split **novel pair, fold 0** - the test set shares no compound and no
  protein with training. This is the hardest and most realistic setting: a new drug against a new
  protein.
- Settings: the repo's published ones (batch size 50, dropout 0.1, mean aggregation, LAMB), label
  weighting per the paper (CLAUDE.md decisions D1/D2), no label scaling.

## How good it is, honestly

| | This model | Paper (5-fold, ensemble of 3) | Always guess the training average |
|---|---|---|---|
| Test MSE | **{spec['test_mse']:.3f}** | {paper_mse:.3f} | {GUESS_AVERAGE[dataset]:.3f} |
| Test CI | {ci} | {paper_ci:.3f} | - |

**It is worse than the published paper.** We trained one fold instead of five and, for Metz and
KIBA, a single model instead of an ensemble of three, and the paper's hyperparameters were tuned by
Bayesian optimisation and never published. The comparison is therefore indicative, not like for like.

**Two limitations that matter when reading a prediction:**

1. **The model is much better at telling compounds apart than proteins.** Hold a compound fixed and
   vary the protein, and the ordering it produces is close to random (`experiments/phase5/
   protein_sensitivity.md`). Treat a change of protein with more caution than a change of compound.
2. **The +/- is not a confidence interval.** It is the spread of 30 predictions made with dropout
   left on. It tracks real error only loosely, and on Davis the true value falls inside +/-2 spread
   about 33-63% of the time, not 95%. The app shows it as a relative low/medium/high label for that
   reason.

## Scope

Trained on kinase inhibitors and kinase sequences. A compound or protein far outside that family is
out of scope, and the answer should not be trusted; `/predict` warns when the protein is unlike the
training proteins.
"""


def scope_thresholds(compounds, proteins):
    """How similar an input must be before we stop calling it an extrapolation.

    Derived from the data rather than guessed: we take the 10th percentile of how similar each
    training entry is to its nearest *other* training entry. In words - "we warn when your input is
    less like this dataset than 90% of the dataset is like itself".

    This matters because a guessed threshold is badly wrong here. Davis kinases have a median
    3-mer similarity to their nearest neighbour of only 0.22, so a plausible-sounding cut-off of
    0.5 would have flagged almost every real kinase. Haemoglobin, which genuinely is out of scope,
    scores 0.046.
    """
    import numpy as np
    from rdkit import Chem, DataStructs, RDLogger
    from rdkit.Chem import AllChem
    RDLogger.DisableLog('rdApp.*')

    fingerprints = []
    for smiles in compounds:
        molecule = Chem.MolFromSmiles(smiles)
        if molecule is not None:
            fingerprints.append(AllChem.GetMorganFingerprintAsBitVect(molecule, 2, nBits=2048))
    nearest = []
    for i, fingerprint in enumerate(fingerprints):
        similarities = DataStructs.BulkTanimotoSimilarity(fingerprint, fingerprints)
        similarities[i] = -1.0
        nearest.append(max(similarities))
    compound_cut = float(np.percentile(nearest, 10)) if len(nearest) > 1 else 0.0

    kmers = [{p[i:i + 3] for i in range(len(p) - 2)} for p in proteins]
    nearest = []
    for i, a in enumerate(kmers):
        nearest.append(max((len(a & b) / len(a | b) for j, b in enumerate(kmers) if j != i),
                           default=0.0))
    protein_cut = float(np.percentile(nearest, 10)) if len(nearest) > 1 else 0.0
    return {'compound': round(compound_cut, 3), 'protein': round(protein_cut, 3),
            'basis': '10th percentile of each training entry\'s similarity to its nearest other '
                     'training entry. Compounds: Tanimoto on Morgan r2 2048-bit fingerprints. '
                     'Proteins: Jaccard overlap of 3-mers.'}


def write_scope(dataset, folder):
    """The compounds and proteins this dataset contains, so /predict can tell a user when their
    input is nothing like anything the model has seen. Small enough to commit, which keeps the
    backend working without the (git-ignored) split files."""
    import pandas as pd
    data = pd.read_csv(ROOT / 'data' / f'{dataset}.csv')
    compounds = sorted(data['smiles'].unique().tolist())
    proteins = sorted(data['sequence'].unique().tolist())
    (folder / 'scope.json').write_text(
        json.dumps({'compounds': compounds, 'proteins': proteins}), encoding='utf-8')
    return compounds, proteins


def main():
    registry = {}
    for dataset, spec in SERVED.items():
        folder = MODELS / dataset
        folder.mkdir(parents=True, exist_ok=True)
        for old in folder.glob('*.pt'):
            old.unlink()
        copied = []
        for i, run in enumerate(spec['runs']):
            source = run / 'fold_0' / 'model_0' / 'model.pt'
            if not source.exists():
                raise SystemExit(f'missing checkpoint {source}')
            name = f'model_{i}.pt'
            shutil.copy2(source, folder / name)
            copied.append((run, name))
        (folder / 'model_card.md').write_text(card(dataset, spec, copied), encoding='utf-8')
        compounds, proteins = write_scope(dataset, folder)
        thresholds = scope_thresholds(compounds, proteins)
        print(f'       scope: {len(compounds)} compounds, {len(proteins)} proteins; '
              f'warn below Tanimoto {thresholds["compound"]} / 3-mer {thresholds["protein"]}')
        registry[dataset] = {
            'unit': spec['unit'],
            'bands': BANDS[dataset],
            'scope': {'compounds': len(compounds), 'proteins': len(proteins)},
            'scope_thresholds': thresholds,
            'checkpoints': [name for _, name in copied],
            'source_runs': [run.relative_to(ROOT).as_posix() for run in spec['runs']],
            'test_mse': spec['test_mse'], 'test_ci': spec['test_ci'],
            'paper_mse': PAPER[dataset][0], 'paper_ci': PAPER[dataset][1],
            'guess_average_mse': GUESS_AVERAGE[dataset],
            'why': spec['why'],
        }
        total = sum((folder / name).stat().st_size for _, name in copied) / 1024 ** 2
        print(f'{dataset:6s} {len(copied)} checkpoint(s), {total:.1f} MB -> {folder}')
    (MODELS / 'registry.json').write_text(json.dumps(registry, indent=2) + '\n', encoding='utf-8')
    print(f'\nWrote {MODELS / "registry.json"}')


if __name__ == '__main__':
    main()
