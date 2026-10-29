"""MC dropout: a rough ± for Perceiver CPI predictions, without training an ensemble.

In simple words:
  During training, dropout randomly switches off 10% of the model's internal connections.
  Normally dropout is OFF when predicting, so the model always gives the same answer.
  MC ("Monte Carlo") dropout leaves it ON and predicts the same input many times (default 30).
  The answers differ a little; their standard deviation is the ±. A wide spread means the model is unsure.

The score itself is the normal prediction (dropout off), so it matches the reported test metrics.
This is our own file (Phase 4 decision, CLAUDE.md section 6); the official code is not changed.

From model_2d/:
  ../.venv/Scripts/python.exe mc_dropout.py --checkpoint <run>/fold_0/model_0/model.pt \
      --test_path <file with smiles,sequence[,label]> --out <predictions.csv>
"""
import argparse
import logging

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from tape import TAPETokenizer

from chemprop.data import MoleculeDataLoader, MoleculeDatapoint, MoleculeDataset
from chemprop.train import predict
from chemprop.utils import load_args, load_checkpoint, load_scalers

N_SAMPLES = 30
QUIET = logging.getLogger('mc_dropout')  # load_checkpoint prints every parameter unless given a logger
QUIET.setLevel(logging.WARNING)
TOKENIZER = TAPETokenizer(vocab='unirep')


def load_model(checkpoint_path, device='cpu'):
    """Load a trained model and its training settings onto the given device."""
    train_args = load_args(checkpoint_path)
    model = load_checkpoint(checkpoint_path, device=torch.device(device), logger=QUIET)
    scaler = load_scalers(checkpoint_path)[0]
    return model, train_args, scaler


def _eval_keeping_dropout_on(model):
    """Stand-in for model.eval(): everything goes to prediction mode except the dropout layers."""
    def eval_with_dropout():
        nn.Module.eval(model)
        for module in model.modules():
            if isinstance(module, nn.Dropout):
                module.train()
        return model
    return eval_with_dropout


def predict_with_mc_dropout(model, train_args, smiles, sequences, scaler=None,
                            n_samples=N_SAMPLES, batch_size=50, seed=0):
    """Return (score, spread, samples) for each smiles+sequence pair.

    score   = the normal prediction (dropout off)
    spread  = standard deviation of n_samples predictions with dropout on (the ±)
    samples = all dropout-on predictions, shape (n_samples, n_pairs)
    """
    data = MoleculeDataset([MoleculeDatapoint(smiles=[s], sequences=[q]) for s, q in zip(smiles, sequences)])
    loader = MoleculeDataLoader(dataset=data, batch_size=batch_size, num_workers=0)

    def run():
        # The official predict() calls model.eval() itself, which is why we swap that method below.
        preds = predict(model=model, data_loader=loader, args=train_args, scaler=scaler,
                        tokenizer=TOKENIZER, disable_progress_bar=True)
        return np.array(preds)[:, 0]

    score = run()
    model.eval = _eval_keeping_dropout_on(model)
    try:
        torch.manual_seed(seed)
        samples = np.stack([run() for _ in range(n_samples)])
    finally:
        del model.eval  # back to the normal model.eval() ...
        model.eval()    # ... and leave the model in normal prediction mode (dropout off)
    return score, samples.std(axis=0), samples


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--checkpoint', required=True, help='path to model.pt')
    parser.add_argument('--test_path', required=True, help='CSV with columns smiles,sequence (label optional)')
    parser.add_argument('--out', required=True, help='where to write the predictions CSV')
    parser.add_argument('--n_samples', type=int, default=N_SAMPLES)
    parser.add_argument('--seed', type=int, default=0)
    parser.add_argument('--device', default='cuda' if torch.cuda.is_available() else 'cpu')
    args = parser.parse_args()

    data = pd.read_csv(args.test_path)
    model, train_args, scaler = load_model(args.checkpoint, args.device)
    score, spread, _ = predict_with_mc_dropout(model, train_args, data.smiles, data.sequence, scaler,
                                               n_samples=args.n_samples, seed=args.seed)
    data.assign(score=score, mc_dropout_std=spread).to_csv(args.out, index=False)
    print(f'Wrote {len(data):,} predictions with a +/- from {args.n_samples} MC-dropout samples to {args.out}')


if __name__ == '__main__':
    main()
