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

## Other changes (not compatibility fixes)

### Change 4: `--resume` for interrupted training (2026-10-29, approved)

**Why.** Phase 4 trains for hours on a borrowed GPU laptop. The original code cannot continue a run that was cut off, so a restart would lose all progress.

| File | Change |
|---|---|
| `chemprop/args.py` | new option `resume: bool = False` in `TrainArgs` |
| `chemprop/train/run_training.py` | new `get_rng_states` / `set_rng_states`; resume logic in the epoch loop |

**What it does.** With `--resume`, after every epoch the code writes `<save_dir>/model_<i>/resume.pt`. That file holds:
- the model weights;
- the optimiser state (LAMB's running averages);
- the learning-rate schedule position;
- the best validation score and its epoch;
- a copy of the best weights;
- the state of every random-number generator (Python, NumPy, PyTorch CPU/GPU, and the data shuffler).

It writes to a temporary file first and then swaps it in, so a cut-off never leaves a broken resume file. When a run starts and finds `resume.pt`, it:
1. rewrites `model.pt` from the saved best weights, in case the cut-off happened while `model.pt` was being written;
2. restores everything else;
3. continues from the next epoch.

Without `--resume`, nothing changes.

*Fix (2026-11-03, before the first GPU run).* The resume file is now loaded onto the CPU (`map_location='cpu'`). Previously it loaded onto the training device. On a GPU that would have turned the saved random-number states into GPU tensors, and `torch.set_rng_state` only accepts CPU tensors, so resuming on Colab would have crashed. The weights and optimiser state are copied onto the GPU by `load_state_dict` as before. CPU behaviour is unchanged.

**Effect on results:** none. Tested on CPU with a 2,000-row Davis sample (2026-10-29).

Multi-threaded (normal) runs, compared with the original code's predictions:
- without `--resume`: max difference 3.8e-6;
- with `--resume`: max difference 3.8e-6;
- 6 epochs straight vs 6 epochs **killed after epoch 2 and resumed**: max difference 3.8e-6.

That 3.8e-6 is ordinary run-to-run float noise from parallel CPU maths. Two runs that *should* be identical (with and without saving resume files) differ by 4.3e-6.

Single-threaded (`OMP_NUM_THREADS=1`, which makes CPU maths exactly repeatable):
- killed-and-resumed vs straight: **max difference 0.0**, bit-for-bit identical;
- re-running a finished folder skips training and gives the same predictions (difference 0.0).

### Change 5: `--protein_encoder esm` (2026-11-13, approved)

**Why.** Phase 5 measured that the trained models rank proteins no better than chance within a compound (`experiments/phase5/protein_sensitivity.md`): change the protein and the answer barely moves. The cause is that the paper builds its protein encoder as a blank `nn.Embedding(31, 128)` and learns what amino acids mean from the few hundred proteins in the training set (Davis 243, KIBA 183, Metz 136). ESM-2 was pretrained on millions of sequences instead. A CPU feasibility check first (`experiments/phase5/esm_feasibility.py`) confirmed ESM-2 separates these proteins in a way that tracks affinity (correlation +0.641).

**What changed.** Four files, all behind a flag that is off by default.

1. `chemprop/args.py` — `--protein_encoder {learned,esm}` (default `learned`) and `--esm_bank <file>`, added to both `TrainArgs` and `PredictArgs`.
2. `chemprop/models/model.py` — new `load_esm_bank()`. In `esm` mode the model registers the precomputed features as a non-persistent buffer and adds one trainable `nn.Linear(480, 128)`; `forward` takes `embedded_xt` from that projection instead of the embedding lookup. **Everything after that line — the CNN blocks, the cross-attention, the head — is untouched.**
3. `chemprop/train/train.py` and 4. `chemprop/train/predict.py` — in `esm` mode pass one protein index per row instead of 500 token IDs. The original branch is unchanged, only indented.

**Design notes.**
- Features are **per residue**, not averaged, so the existing CNN can still find the binding region. Averaging over 499 residues would blur the pocket into the rest of the protein.
- ESM is **frozen**. Features are computed once by `experiments/phase5/make_esm_bank.py`; only the 480→128 projection trains. Recomputing them every epoch would waste nearly all the time, and 243 proteins is far too few to fine-tune a protein model on.
- The bank is `persistent=False`, so it stays out of the checkpoint (18.1 MB vs 17.8 MB) and is rebuilt from the file whenever the model is constructed.
- The same 499-residue truncation and zero padding as the original, so only the encoder differs.

**Effect on results with the default settings: none.** Tested 2026-11-13 on a 400-row Davis sample, 2 epochs, single-threaded: this code with default arguments against the original code from git gave **identical test predictions (max difference 0.0)**. In `esm` mode training runs and predicts normally; the predictions differ, which is the point.

### Change 6: `--protein_encoder both` (2026-11-15, approved)

**Why.** Step B (`experiments/phase5/stepB_results.md`) measured a trade-off. ESM-2 on its own was the
first thing to make the model read the protein at all (within-compound protein ranking went from
-0.00 to +0.047 on test, spread captured 20% -> 31%), but it cost accuracy (test MSE 0.643 -> 0.734).
Both effects held across two seeds with no overlap between the groups. `both` is an attempt to keep
the accuracy of the paper's encoder and the protein awareness of ESM-2 at the same time.

**What changed.** The same four files as Change 5, still behind the same flag, which now accepts a
third value. `learned` and `esm` behave exactly as before.

1. `chemprop/args.py` - `--protein_encoder` is now `{learned, esm, both}` (both `TrainArgs` and
   `PredictArgs`).
2. `chemprop/models/model.py` - in `both` mode the model builds **both** protein representations and
   adds them:

       embedded_xt = embedding_xt(tokens) + esm_gate * esm_project(esm_features)

   `esm_gate` is a single learnable number **initialised to zero**, so at the start of training the
   model is an exact copy of the paper's and the ESM branch contributes nothing. Training decides how
   much pretrained protein information to mix in. Everything after this line - the CNN blocks, the
   cross-attention, the head - is untouched, as in Change 5.
3. `chemprop/train/train.py` and 4. `chemprop/train/predict.py` - `both` needs the 500 token IDs *and*
   the protein's row in the ESM table, so the index is appended as one extra column and `forward`
   splits it off (`sequence_tensor[:, :-1]` and `[:, -1]`). The `learned` and `esm` paths are unchanged.

**Why a gate rather than a plain sum.** Starting at zero means the change cannot make the model worse
at the outset, and the learned value afterwards is itself a readable result: it says how much the
model wanted ESM. A plain sum would have risked reproducing the ESM-only run, which was less accurate.

**Effect on results with the default settings: none.** Tested 2026-11-15 on a 400-row Davis sample,
2 epochs, single-threaded, against the code at the previous commit: **identical test predictions
(max difference 0.0)**. Also checked: `both` trains with no NaNs, the checkpoint stays 18.1 MB (the
ESM table is still excluded), the gate moves off zero during training (+0.00141 after 2 epochs, so the
branch does receive gradient), predictions differ from `learned`, and `predict.py` reproduces the
training-time predictions in `both` mode to 4e-16.

### Not a change: `mc_dropout.py` (our own file)

`model_2d/mc_dropout.py` adds MC-dropout predictions: the normal score, plus a ± from 30 predictions made with dropout on. It only *uses* the official code (`load_checkpoint`, `predict`) and changes none of it.

## Known warnings we leave alone (not changes)

- **RDKit `DEPRECATION WARNING: please use MorganGenerator`.** The old Morgan fingerprint function still works. We keep it so the fingerprints are exactly the original ones.
  - It prints once per molecule per epoch, about 18 million lines over the three Phase 4 runs.
  - So the Phase 4 scripts start training through `experiments/phase4_baseline/gpu_bundle/train_quiet.py`, which switches off RDKit *warnings* (`RDLogger.DisableLog('rdApp.warning')`; errors still show) and then runs `train.py` unchanged.
  - Checked 2026-11-03: test predictions identical to calling `train.py` directly (max difference 0.0).
- **PyTorch `UserWarning: Creating a tensor from a list of numpy.ndarrays is extremely slow`** (`train.py`, `predict.py`). Speed only, results are unaffected.
- **Slow prediction on Windows.** `predict.py` uses 8 data-loader worker processes by default, and on Windows each one re-imports PyTorch (~10 s per model). Pass `--num_workers 0`: same predictions (checked: max difference 0.0), 34 s → 1 s on the toy set. Training already uses 0 workers for small datasets.
