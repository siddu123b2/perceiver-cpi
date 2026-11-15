"""Turn the raw MC-dropout spread into a low / medium / high label, calibrated on VALIDATION.

  .venv\\Scripts\\python.exe models\\calibrate_confidence.py

Writes `confidence_cuts` into each dataset's entry in models/registry.json: the 33rd and 67th
percentile of the spread over that model's own validation rows. A new prediction whose spread is
below the first cut is called "high" confidence, above the second "low", otherwise "medium".

WHY A LABEL AND NOT A +/- INTERVAL. Phase 4 measured the coverage of this spread: the true value
falls inside +/-2 spread only 33-63% of the time, not the ~95% an interval would imply, and on Metz
and KIBA the spread barely tracks the real error at all (rank agreement +0.03 and +0.08, against
+0.39 on Davis). So it must never be presented as a confidence interval. A relative label is
defensible: it only claims "this prediction is less settled than most", which is what it measures.

WHICH SPLIT. Each model's own validation set, read from the training run's args.json, so this never
touches the test set. The test set is for final reporting only (CLAUDE.md section 4).
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'model_2d'))

N_SAMPLES = 30
SEED = 0
MAX_ROWS = 800   # see below


def validation_path(dataset, source_run):
    """The validation file this model was actually trained against."""
    args = json.loads((ROOT / source_run / 'args.json').read_text(encoding='utf-8'))
    name = Path(args['separate_val_path']).name          # recorded on the training machine
    local = ROOT / 'data' / 'splits' / dataset / 'novel_pair' / name
    if not local.exists():
        raise SystemExit(f'{dataset}: cannot find its validation file {name} at {local}')
    return local


def main():
    from rdkit import RDLogger
    RDLogger.DisableLog('rdApp.*')
    from mc_dropout import load_model, predict_with_mc_dropout

    registry_path = ROOT / 'models' / 'registry.json'
    registry = json.loads(registry_path.read_text(encoding='utf-8'))
    cuts = {}

    for dataset, spec in registry.items():
        path = validation_path(dataset, spec['source_runs'][0])
        data = pd.read_csv(path)
        # All we need from this split are two percentiles, and 800 rows pin those down to within a
        # couple of percent. Using every row would mean 30 dropout passes over KIBA's 15,346
        # validation rows - about half an hour of CPU for no extra accuracy.
        total_rows = len(data)
        if total_rows > MAX_ROWS:
            data = data.sample(MAX_ROWS, random_state=SEED).reset_index(drop=True)
        spreads = []
        for checkpoint in spec['checkpoints']:
            model, train_args, scaler = load_model(str(ROOT / 'models' / dataset / checkpoint), 'cpu')
            _, spread, _ = predict_with_mc_dropout(
                model, train_args, list(data['smiles']), list(data['sequence']), scaler,
                n_samples=N_SAMPLES, seed=SEED)
            spreads.append(spread)
        spread = np.mean(spreads, axis=0)
        low, high = (float(np.percentile(spread, 33)), float(np.percentile(spread, 67)))
        cuts[dataset] = {
            'confidence_cuts': [round(low, 4), round(high, 4)],
            'confidence_calibration': {
                'split': path.name, 'rows': int(len(data)), 'of_rows': int(total_rows),
                'mc_samples': N_SAMPLES, 'seed': SEED,
                'note': 'Tertiles of the MC-dropout spread on the validation set. A relative '
                        'label only - this is not a confidence interval.'}}
        print(f'{dataset:6s} {len(data):5d} of {total_rows:5d} validation rows   spread: '
              f'min {spread.min():.3f}  33% {low:.3f}  67% {high:.3f}  max {spread.max():.3f}')

    # Re-read before writing: build_registry.py may have rewritten the file while this was running
    # (it takes minutes), and only these two keys belong to this script.
    registry = json.loads(registry_path.read_text(encoding='utf-8'))
    for dataset, values in cuts.items():
        registry[dataset]['bands'].update(values)
    registry_path.write_text(json.dumps(registry, indent=2) + '\n', encoding='utf-8')
    print(f'\nWrote confidence_cuts into {registry_path}')


if __name__ == '__main__':
    main()
