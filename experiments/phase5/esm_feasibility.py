"""Step A: before spending GPU hours, check whether ESM-2 protein features carry usable signal.

  .venv\\Scripts\\python.exe experiments\\phase5\\esm_feasibility.py [--model esm2_t12_35M_UR50D]

Phase 5 showed the trained models rank proteins no better than chance within a compound, and we
traced that to a protein encoder learned from scratch on only 303 Davis proteins. The proposed fix
is ESM-2, which was pretrained on millions of protein sequences.

Rather than assume it works, this fits two deliberately simple models on Davis fold 0 and compares
them on the NOVEL-PAIR VALIDATION set (the test set is not touched):

  compound only          ridge regression on the Morgan fingerprint
  compound + ESM         the same, with the protein's ESM-2 representation added

If the ESM features carry protein signal, the second model must (a) score better and (b) show
protein sensitivity above zero - meaning that holding the compound fixed and changing the protein
changes the answer in the right direction. If it does not, the idea is wrong and we have spent
30 minutes instead of 11 GPU hours.

A ridge model is additive: it can learn "this protein binds more on average" but not true
compound-protein interaction. That is deliberate. It is a floor, not a ceiling: whatever signal it
finds, the real network should be able to find at least as much.
"""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem
from sklearn.linear_model import Ridge, RidgeCV
from sklearn.preprocessing import StandardScaler

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
CACHE = HERE / 'esm_cache'
DATASET = 'davis'          # Metz cannot show protein gains: its ceiling barely moves (0.332 -> 0.326)
MAX_RESIDUES = 499         # the same truncation the model uses, so only the encoder differs
MIN_PROTEINS = 5           # compounds need at least this many proteins to measure sensitivity
MODEL_NAME = 'esm2_t12_35M_UR50D'   # what CS-DTA uses for strict cold-start

RDLogger.DisableLog('rdApp.warning')


def split(part):
    return pd.read_csv(ROOT / 'data' / 'splits' / DATASET / 'novel_pair' / f'fold0_{part}.csv')


def fingerprints(smiles_list):
    unique = sorted(set(smiles_list))
    table = {}
    for smiles in unique:
        molecule = Chem.MolFromSmiles(smiles)
        bits = AllChem.GetMorganFingerprintAsBitVect(molecule, 2, nBits=2048)
        table[smiles] = np.array(bits, dtype=np.float32)
    return table


def esm_features(sequences, model_name):
    """One vector per protein: ESM-2 per-residue states averaged over the first MAX_RESIDUES."""
    CACHE.mkdir(exist_ok=True)
    cache_file = CACHE / f'{DATASET}_{model_name}_{MAX_RESIDUES}.npz'
    unique = sorted(set(sequences))
    if cache_file.exists():
        stored = np.load(cache_file, allow_pickle=True)
        table = {s: v for s, v in zip(stored['sequences'], stored['vectors'])}
        if all(s in table for s in unique):
            print(f'  using cached ESM features for {len(table)} proteins')
            return table

    print(f'  loading {model_name} (downloads ~150 MB the first time)...')
    model, alphabet = torch.hub.load('facebookresearch/esm:main', model_name)
    model.eval()
    converter = alphabet.get_batch_converter()
    layer = model.num_layers

    vectors = []
    for i, sequence in enumerate(unique, start=1):
        clipped = sequence[:MAX_RESIDUES]
        _, _, tokens = converter([('p', clipped)])
        with torch.no_grad():
            out = model(tokens, repr_layers=[layer])['representations'][layer]
        # drop the start and stop tokens, then average over the residues
        vectors.append(out[0, 1:len(clipped) + 1].mean(0).numpy().astype(np.float32))
        if i % 50 == 0 or i == len(unique):
            print(f'    {i}/{len(unique)} proteins', flush=True)
    np.savez_compressed(cache_file, sequences=np.array(unique, dtype=object),
                        vectors=np.array(vectors, dtype=np.float32))
    return dict(zip(unique, vectors))


def build(frame, fp_table, esm_table, use_esm):
    compound = np.stack([fp_table[s] for s in frame['smiles']])
    if not use_esm:
        return compound
    protein = np.stack([esm_table[s] for s in frame['sequence']])
    return np.hstack([compound, protein])


def protein_sensitivity(frame, predictions):
    """Hold the compound fixed, vary the protein: do we move, and in the right order?"""
    scored = frame.assign(pred=predictions)
    enough = scored.groupby('smiles').filter(lambda g: len(g) >= MIN_PROTEINS)
    if not len(enough):
        return None
    by_compound = enough.groupby('smiles')
    ranks = by_compound.apply(lambda g: g['label'].corr(g['pred'], method='spearman'),
                              include_groups=False).dropna()
    return {'compounds': int(by_compound.ngroups),
            'captured': float(by_compound['pred'].std().mean() / by_compound['label'].std().mean()),
            'rank_corr': float(ranks.mean())}


def main():
    model_name = MODEL_NAME
    if '--model' in sys.argv:
        model_name = sys.argv[sys.argv.index('--model') + 1]

    train, validation = split('train2'), split('novelval')
    print(f'Davis fold 0: {len(train):,} training rows, {len(validation):,} novel-pair validation rows')
    print(f'  training proteins {train["sequence"].nunique()}, validation proteins '
          f'{validation["sequence"].nunique()} (none shared)')

    print('\nBuilding features...')
    fp_table = fingerprints(list(train['smiles']) + list(validation['smiles']))
    esm_table = esm_features(list(train['sequence']) + list(validation['sequence']), model_name)
    print(f'  Morgan fingerprint: 2048 bits | ESM-2 vector: {len(next(iter(esm_table.values())))} numbers')

    y_train = train['label'].to_numpy(float)
    y_validation = validation['label'].to_numpy(float)
    guess = float(np.mean((y_validation - y_train.mean()) ** 2))

    print(f'\n{"model":22s} {"val MSE":>8s} {"vs guessing":>12s} {"spread captured":>16s} {"rank corr":>10s}')
    print(f'{"always guess average":22s} {guess:8.3f} {"-":>12s} {"-":>16s} {"-":>10s}')
    results = {}
    for label, use_esm in (('compound only', False), ('compound + ESM-2', True)):
        # Scale first: Morgan bits are 0/1 while ESM values are continuous, and ridge penalises
        # every coefficient equally. Alpha is chosen by cross-validation on the TRAINING rows only.
        scaler = StandardScaler().fit(build(train, fp_table, esm_table, use_esm))
        model = RidgeCV(alphas=np.logspace(0, 5, 20)).fit(
            scaler.transform(build(train, fp_table, esm_table, use_esm)), y_train)
        predictions = model.predict(scaler.transform(build(validation, fp_table, esm_table, use_esm)))
        mse = float(np.mean((y_validation - predictions) ** 2))
        sensitivity = protein_sensitivity(validation, predictions)
        results[label] = (mse, sensitivity)
        print(f'{label:22s} {mse:8.3f} {(guess - mse) / guess:11.0%} '
              f'{sensitivity["captured"]:16.0%} {sensitivity["rank_corr"]:+10.3f}')

    # Test 2: do the ESM vectors separate these proteins at all? Hold out training proteins at
    # random, so the affinity averages on both sides come from the SAME compounds. Comparing
    # train-protein averages with validation-protein averages would change the compound set too,
    # which confounded an earlier version of this check.
    from sklearn.model_selection import KFold
    from scipy import stats
    averages = train.groupby('sequence')['label'].mean()
    matrix = np.stack([esm_table[s] for s in averages.index])
    truth = averages.to_numpy()
    predicted = np.zeros_like(truth)
    for inner_train, inner_test in KFold(5, shuffle=True, random_state=0).split(matrix):
        scaler = StandardScaler().fit(matrix[inner_train])
        model = RidgeCV(alphas=np.logspace(0, 5, 20)).fit(scaler.transform(matrix[inner_train]),
                                                          truth[inner_train])
        predicted[inner_test] = model.predict(scaler.transform(matrix[inner_test]))
    separation = float(stats.pearsonr(truth, predicted)[0])

    # Test 3: the ceiling. If a model knew every protein's true average affinity, how well could it
    # rank proteins within one compound? Anything above that needs real compound-protein interaction.
    scored = validation.copy()
    scored['protein_avg'] = scored.groupby('sequence')['label'].transform('mean')
    scored['compound_avg'] = scored.groupby('smiles')['label'].transform('mean')
    enough = scored.groupby('smiles').filter(lambda g: len(g) >= MIN_PROTEINS)
    ceiling = float(enough.groupby('smiles')
                    .apply(lambda g: g['label'].corr(g['protein_avg'], method='spearman'),
                           include_groups=False).dropna().mean())
    leftover = float((enough['label'] - (enough['compound_avg'] + enough['protein_avg']
                                         - enough['label'].mean())).var() / enough['label'].var())

    esm_mse, esm_sensitivity = results['compound + ESM-2']
    print(f'\nDoes ESM separate these proteins at all?')
    print(f'  predicting a protein average affinity from its ESM vector, holding out training')
    print(f'  proteins at random: correlation {separation:+.3f}')
    print(f'\nCeiling for any one-number-per-protein model on this validation set:')
    print(f'  rank correlation {ceiling:+.3f}, and {leftover:.0%} of the variation is left over as')
    print(f'  genuine compound-protein interaction that no such model can reach.')
    print(f'\nA plain additive ridge on ESM reached {esm_sensitivity["rank_corr"]:+.3f} of that '
          f'{ceiling:+.3f} ceiling.')
    print('The trained Phase 5 networks reached about -0.05, i.e. nothing.')

    if separation > 0.4 and esm_sensitivity['rank_corr'] > 0:
        print('\nGO. The ESM vectors clearly distinguish these proteins in a way that tracks affinity,')
        print('and even a crude additive model turns that into some protein ranking where the trained')
        print('networks have none. Worth testing in the real model. Expect a partial fix, not a cure:')
        print('most of the signal is interaction, which an additive protein term cannot reach.')
    else:
        print('\nNO-GO. The ESM vectors do not separate these proteins usefully. Rethink before')
        print('spending GPU hours.')


if __name__ == '__main__':
    main()
