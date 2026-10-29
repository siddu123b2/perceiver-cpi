# Perceiver CPI binding-affinity app (Group G1590)

Predicts how strongly a compound (SMILES) binds to a protein (amino-acid sequence), using the Perceiver CPI model (Nguyen et al., *Bioinformatics* 2023) trained on one of three benchmark datasets: Davis, KIBA or Metz. Each dataset uses its own scale, so scores from different models can't be compared with each other.

> **Status:** Phase 0 (setup) is done. Nothing runs yet. See [CLAUDE.md](CLAUDE.md) for the full plan and phase status.

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

## Setup, training and running the app

Not written yet. These sections are added in Phases 1, 4, 7 and 8.
