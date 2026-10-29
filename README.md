# Perceiver CPI binding-affinity app (Group G1590)

Predicts how strongly a compound (SMILES) binds to a protein (amino-acid sequence), using the Perceiver CPI model (Nguyen et al., *Bioinformatics* 2023) trained on one of three benchmark datasets: Davis, KIBA or Metz. Each dataset uses its own scale, so scores from different models can't be compared with each other.

> **Status:** Phase 3 (splits) is done. The model code runs, the three datasets are cleaned, and the 5-fold train/val/test splits are built and checked for leakage. Training the baseline (on Google Colab) comes next. See [CLAUDE.md](CLAUDE.md) for the full plan and phase status.

**Requirements so far:** Windows, Git, Python 3.12 (`py -3.12`). Model training runs on Google Colab, because this machine has no NVIDIA GPU.

## Folder layout

| Folder | What's in it |
|---|---|
| `reference/` | Paper full text, official repo zip, raw datasets (read-only) |
| `model_2d/` | Perceiver CPI model code (from the official repo) |
| `data/` | Cleaned datasets and train/val/test splits |
| `experiments/` | Configs, logs, results tables |
| `models/` | Final trained models: `davis/`, `kiba/`, `metz/` |
| `backend/` | FastAPI server |
| `frontend/` | React + Vite web page |

## Data

The raw CSVs are not stored in git because they're too large. Put them in `reference/data/`:

| File | Rows | Label |
|---|---|---|
| `davis.csv` | 30,056 | pKd |
| `kiba.csv` | 118,254 | KIBA score |
| `metz.csv` | 35,259 | pKi |

Then build the cleaned files in `data/` (~20 s) and check them:

```
.venv\Scripts\python.exe data\prepare_datasets.py
.venv\Scripts\python.exe data\check_datasets.py --with-model
```

The cleaned files have the columns `smiles,sequence,label`.
- **Davis:** 30,056 rows, unchanged.
- **KIBA:** 117,657 rows, after dropping duplicates and averaging repeated pairs. This matches the paper.
- **Metz:** 35,259 rows, unchanged.

What changed and why: [data/prep_report.md](data/prep_report.md). Every merged KIBA pair is listed in [data/logs/kiba_merged_pairs.csv](data/logs/kiba_merged_pairs.csv).

## Train/test splits

Build the 5-fold splits the paper uses, then check them for leakage:

```
.venv\Scripts\python.exe data\make_splits.py
.venv\Scripts\python.exe data\check_splits.py --with-model
```

- **Build time:** about 36 s, using the saved protein-similarity file. The checks take about 7 min, mostly re-aligning proteins and a 1-epoch training run.
- **Settings:**
  - Davis gets novel pair, novel compound, novel protein and novel-hard pair.
  - KIBA and Metz get novel pair only, as in the paper.
- **Where the files go:** `data/splits/<dataset>/<setting>/fold{0-4}_{train,val,test}.csv`, about 800 MB, not in git.
- **Fold sizes:** see [data/splits/summary.md](data/splits/summary.md). The decisions behind the splits are in CLAUDE.md §4.

## Setup (local, CPU)

From the project folder, in PowerShell:

```
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install torch==2.15.0 --index-url https://download.pytorch.org/whl/cpu
.venv\Scripts\python.exe -m pip install -r model_2d\requirements.txt
```

That is about 350 MB to download and ~1.5 GB on disk.

The model code in `model_2d/` is the official Perceiver CPI repo, with three small fixes so it runs on modern PyTorch. They are listed in [model_2d/CHANGES.md](model_2d/CHANGES.md).

## Check that it works (toy dataset)

From `model_2d\`, train a tiny model (~1 min on CPU), then predict with it:

```
..\.venv\Scripts\python.exe train.py --data_path ./toy_dataset/novel_pair_0_train.csv --separate_val_path ./toy_dataset/novel_pair_0_val.csv --separate_test_path ./toy_dataset/novel_pair_0_test.csv --metric mse --dataset_type regression --save_dir ../experiments/phase1_smoke/toy_ckpt --target_columns label --epochs 150 --ensemble_size 3 --num_folds 1 --batch_size 50 --aggregation mean --dropout 0.1 --save_preds --seed 0
..\.venv\Scripts\python.exe predict.py --test_path ./toy_dataset/novel_pair_0_test.csv --checkpoint_dir ../experiments/phase1_smoke/toy_ckpt --preds_path ../experiments/phase1_smoke/toy_preds.csv --num_workers 0
```

Expected results are in [experiments/phase1_smoke/README.md](experiments/phase1_smoke/README.md).

## Training and running the app

Not written yet. These sections are added in Phases 4, 7 and 8.
