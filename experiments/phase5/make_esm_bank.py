"""Precompute the ESM-2 features the model reads with --protein_encoder esm (Change 5).

  python make_esm_bank.py davis                 every protein in the Davis fold-0 files
  python make_esm_bank.py davis metz kiba       several datasets into one bank
  python make_esm_bank.py davis --model esm2_t6_8M_UR50D --out mybank.npz

Writes an .npz holding, for every protein it finds:
  sequences  the protein string, which is how the model looks it up
  vectors    (sequence_length, width) float16, one row per residue

Each protein is embedded once here rather than inside the training loop, because ESM is frozen:
its output never changes, so recomputing it every epoch would waste almost all of the time.

Residues past --max-residues are dropped and shorter proteins are zero-padded, matching exactly what
the original model does with its token IDs, so the comparison between the two encoders is fair.
"""
import argparse
from pathlib import Path

import numpy as np
import torch

HERE = Path(__file__).resolve().parent
# Works both in the repo and inside the flat Kaggle/Colab bundle, where data/ sits next to this file.
ROOT = HERE if (HERE / 'data' / 'splits').exists() else HERE.parent.parent
PARTS = ['train2', 'novelval', 'train3', 'randomval', 'test', 'train', 'val']


def collect(datasets):
    """Every unique protein in the fold-0 files of the named datasets."""
    import pandas as pd
    sequences = set()
    for dataset in datasets:
        folder = ROOT / 'data' / 'splits' / dataset / 'novel_pair'
        found = False
        for part in PARTS:
            path = folder / f'fold0_{part}.csv'
            if path.exists():
                sequences.update(pd.read_csv(path, usecols=['sequence'])['sequence'])
                found = True
        if not found:
            raise SystemExit(f'no fold-0 split files under {folder}')
    return sorted(sequences)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('datasets', nargs='+')
    parser.add_argument('--model', default='esm2_t12_35M_UR50D')
    parser.add_argument('--max-residues', type=int, default=499,
                        help='what the model reads; it keeps 500 tokens including start and stop')
    parser.add_argument('--length', type=int, default=500,
                        help='rows per protein, must equal --sequence_length in training')
    parser.add_argument('--out', default=None)
    parser.add_argument('--batch', type=int, default=4)
    options = parser.parse_args()

    out = Path(options.out) if options.out else HERE / f'esm_bank_{"_".join(options.datasets)}.npz'
    sequences = collect(options.datasets)
    print(f'{len(sequences):,} unique proteins from {", ".join(options.datasets)}')

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f'loading {options.model} on {device}...')
    model, alphabet = torch.hub.load('facebookresearch/esm:main', options.model)
    model = model.to(device).eval()
    converter = alphabet.get_batch_converter()
    layer = model.num_layers
    width = model.embed_dim

    bank = np.zeros((len(sequences), options.length, width), dtype=np.float16)
    for start in range(0, len(sequences), options.batch):
        chunk = sequences[start:start + options.batch]
        clipped = [s[:options.max_residues] for s in chunk]
        _, _, tokens = converter([(f'p{i}', s) for i, s in enumerate(clipped)])
        with torch.no_grad():
            states = model(tokens.to(device), repr_layers=[layer])['representations'][layer]
        for i, sequence in enumerate(clipped):
            # drop the start and stop tokens; leave the padding rows at zero
            residues = states[i, 1:len(sequence) + 1].float().cpu().numpy()
            bank[start + i, :len(sequence)] = residues.astype(np.float16)
        if (start // options.batch) % 25 == 0 or start + options.batch >= len(sequences):
            print(f'  {min(start + options.batch, len(sequences)):,}/{len(sequences):,}', flush=True)

    np.savez_compressed(out, sequences=np.array(sequences, dtype=object), vectors=bank)
    print(f'\nWrote {out} ({out.stat().st_size / 1024 ** 2:.0f} MB)'
          f'\n  {len(sequences):,} proteins x {options.length} residues x {width} numbers'
          f'\nUse it with:  --protein_encoder esm --esm_bank {out}')


if __name__ == '__main__':
    main()
