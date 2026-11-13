"""Run model_2d/train.py (unchanged) with RDKit's warnings switched off.

Why: the repo builds Morgan fingerprints with a function today's RDKit calls deprecated, and it
prints a warning per molecule per epoch - millions of lines over a full run, which floods the
notebook and fills the log files. Only logging changes; the fingerprints and results are identical
(checked 2026-11-03, max difference 0.0). RDKit *errors* are still shown.

Same idea as experiments/phase4_baseline/gpu_bundle/train_quiet.py, but it also works from the repo,
where model_2d is two levels up instead of alongside.
"""
import runpy
import sys
from pathlib import Path

from rdkit import RDLogger

HERE = Path(__file__).resolve().parent
MODEL_DIR = HERE / 'model_2d' if (HERE / 'model_2d').exists() else HERE.parent.parent / 'model_2d'

if __name__ == '__main__':  # guard: data-loader workers may import this file again
    RDLogger.DisableLog('rdApp.warning')
    sys.path.insert(0, str(MODEL_DIR))
    sys.argv[0] = str(MODEL_DIR / 'train.py')
    runpy.run_path(sys.argv[0], run_name='__main__')
