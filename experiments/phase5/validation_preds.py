"""Predict on the novel-pair validation set for each finished Phase 5 run.

Training writes per-row predictions for the TEST set only, but Phase 5 chooses between experiments
on VALIDATION (CLAUDE.md), and protein sensitivity needs one prediction per row. So this regenerates
them from each run's saved checkpoint. Nothing is retrained and no training file is modified.

  python validation_preds.py                 every run that does not have val_preds.csv yet
  python validation_preds.py davis_esm_s0    only the ones you name
  python validation_preds.py --force         redo them all

Two details the ESM runs need:
  * the checkpoint stores the bank path from the machine it trained on (/kaggle/working/...), so a
    copy of the checkpoint is written to a temporary file with that path pointed at our local bank;
  * PredictArgs already defines protein_encoder, so update_prediction_args() will NOT copy it from
    the checkpoint - it has to be passed on the command line.
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import torch

HERE = Path(__file__).resolve().parent
ROOT = HERE if (HERE / 'data' / 'splits').exists() else HERE.parent.parent
RUNS = HERE / 'runs'
BANK = HERE / 'esm_bank_davis.npz'

sys.path.insert(0, str(HERE))
from run_experiment import EXPERIMENTS   # noqa: E402


def patched_checkpoint(source: Path, folder: Path) -> Path:
    """A copy of the checkpoint whose saved esm_bank path points at our local copy."""
    state = torch.load(source, map_location='cpu', weights_only=False)
    state['args'].esm_bank = str(BANK)
    target = folder / 'model_local_bank.pt'
    torch.save(state, target)
    return target


def run(name: str, spec: dict, folder: Path) -> bool:
    checkpoint = folder / 'fold_0' / 'model_0' / 'model.pt'
    if not checkpoint.exists():
        print(f'{name}: no checkpoint at {checkpoint}, skipping.')
        return False
    val_path = ROOT / 'data' / 'splits' / spec['dataset'] / 'novel_pair' / f"fold0_{spec['val']}.csv"
    out = folder / 'val_preds.csv'

    with tempfile.TemporaryDirectory() as tmp:
        extra = []
        if spec['encoder'] == 'esm':
            if not BANK.exists():
                sys.exit(f'{name} needs the ESM bank at {BANK}. Build it with make_esm_bank.py davis')
            checkpoint = patched_checkpoint(checkpoint, Path(tmp))
            extra = ['--protein_encoder', 'esm', '--esm_bank', str(BANK)]
        command = [sys.executable, str(ROOT / 'model_2d' / 'predict.py'),
                   '--test_path', str(val_path), '--preds_path', str(out),
                   '--checkpoint_path', str(checkpoint),
                   '--num_workers', '0', '--batch_size', '50'] + extra
        result = subprocess.run(command, cwd=ROOT / 'model_2d', capture_output=True, text=True)
    if result.returncode != 0 or not out.exists():
        print(f'{name}: FAILED\n{result.stdout[-1500:]}\n{result.stderr[-1500:]}')
        return False
    print(f'{name}: wrote {out.relative_to(HERE)} ({len(out.read_text().strip().splitlines()) - 1} lines, '
          f'validation = {spec["val"]}, encoder = {spec["encoder"]})')
    return True


def main():
    named = [a for a in sys.argv[1:] if not a.startswith('-')]
    force = '--force' in sys.argv
    done = 0
    for name, spec in EXPERIMENTS.items():
        folder = RUNS / name
        if named and name not in named:
            continue
        if not folder.exists():
            continue
        if (folder / 'val_preds.csv').exists() and not force:
            print(f'{name}: already done, skipping (use --force to redo).')
            continue
        done += run(name, spec, folder)
    print(f'\n{done} run(s) predicted.')


if __name__ == '__main__':
    main()
