# Changes to the official Perceiver CPI code

`model_2d/` is the official repo (github.com/dmis-lab/PerceiverCPI, copy in `reference/PerceiverCPI-main.zip`).
We change it only to make it run on modern PyTorch/NumPy, never to change the model.
Every change is listed here, and each was approved by the user before it was applied.

Original setup: Python 3.9, PyTorch 1.7.1, CUDA 10.1, NumPy 1.21.
Our setup: Python 3.12, PyTorch 2.15, NumPy 2.5 (exact versions in `requirements.txt`).

## Unpacking (2026-10-29, Phase 1)

- Unzipped `PerceiverCPI-main/` into `model_2d/`.
- Removed the authors' `__pycache__/*.pyc` files (compiled Python 3.6–3.9 bytecode; Python rebuilds these itself).
- Kept everything else as it was, including `deeppupose/`, which train/predict never import.

## Compatibility fixes

Search the code for `compat fix` to find them.

### Fix 1: hard-coded `.cuda()` calls (2026-10-29, approved)

**Problem.** Four places forced tensors onto an NVIDIA GPU. On a machine without one (this laptop, the backend server) the code crashed.

| File | Before | After |
|---|---|---|
| `chemprop/models/model.py` (`__init__`) | `self.scale = torch.sqrt(torch.FloatTensor([args.alpha])).cuda()` | `self.register_buffer('scale', torch.sqrt(torch.FloatTensor([args.alpha])), persistent=False)` |
| `chemprop/models/model.py` (`forward`) | `sequence_tensor.cuda()` | `sequence_tensor.to(self.embedding_xt.weight.device)` |
| `chemprop/models/model.py` (`forward`) | `add_feature.cuda()` | `add_feature.to(self.fc_mg.weight.device)` |
| `chemprop/models/CAB.py` (`AttentionBlock.__init__`) | `self.scale = torch.sqrt(torch.FloatTensor([hid_dim // n_heads])).cuda()` | `self.register_buffer('scale', ..., persistent=False)` |

**What it means.** The two `scale` numbers are fixed constants (not learned). A *buffer* is a tensor that belongs to the model and moves with it when the model is moved to the GPU or CPU. `persistent=False` means it is not written into checkpoints, so the checkpoint format is unchanged. The two inputs are moved to whatever device the model's weights are on.

**Effect on results:** none. Same numbers, just on the right device.

### Fix 2: `torch.load` safety default (2026-10-29, approved)

**Problem.** Since PyTorch 2.6, `torch.load` by default refuses files that contain Python objects, as protection against malicious files. Our checkpoints store the training settings (`args`) as a Python object, so loading failed.

| File | Change |
|---|---|
| `chemprop/utils.py` lines 106, 195, 276, 309 | added `weights_only=False` to all 4 `torch.load(...)` calls |

**Rule:** only load checkpoints we trained ourselves (or trust fully).

**Effect on results:** none.

### Fix 3: `np.float` removed from NumPy (2026-10-29, approved)

| File | Before | After |
|---|---|---|
| `chemprop/data/scaffold.py` line 158 | `dtype=np.float` | `dtype=float` |

`np.float` was only ever another name for Python's `float`; NumPy 1.24 removed the alias. **Effect on results:** none. (This code is only used for scaffold splits, which we don't use.)

## Known warnings we leave alone (not changes)

- **RDKit `DEPRECATION WARNING: please use MorganGenerator`.** The old Morgan fingerprint function still works. We keep it so the fingerprints are exactly the original ones.
- **PyTorch `UserWarning: Creating a tensor from a list of numpy.ndarrays is extremely slow`** (`train.py`, `predict.py`). Speed only, results are unaffected.
- **Slow prediction on Windows.** `predict.py` uses 8 data-loader worker processes by default, and on Windows each one re-imports PyTorch (~10 s per model). Pass `--num_workers 0`: same predictions (checked: max difference 0.0), 34 s → 1 s on the toy set. Training already uses 0 workers for small datasets.
