"""Run model_2d/train.py (unchanged) with RDKit's warnings switched off. train_all.py starts training through this.

Why: the repo makes Morgan fingerprints with an RDKit function that today's RDKit calls deprecated. Every call
prints "DEPRECATION WARNING: please use MorganGenerator", once per molecule per epoch: about 18 million lines
for the three runs, which would flood the Colab output and fill the log files on Google Drive.
Only the logging changes: the fingerprints and results are the same. RDKit errors are still shown.
"""
import runpy
import sys
from pathlib import Path

from rdkit import RDLogger

MODEL_DIR = Path(__file__).resolve().parent / 'model_2d'

if __name__ == '__main__':  # guard: worker processes may import this file again
    RDLogger.DisableLog('rdApp.warning')
    sys.path.insert(0, str(MODEL_DIR))
    sys.argv[0] = str(MODEL_DIR / 'train.py')
    runpy.run_path(sys.argv[0], run_name='__main__')
