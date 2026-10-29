# CLAUDE.md — Perceiver CPI binding-affinity app (Group G1590)

Read this first in every session. It is the project's memory.

## 1. What we are building

A university project. The user enters:
- a **compound** as a SMILES string (e.g. `CC(=O)Oc1ccccc1C(=O)O`)
- a **protein** as an amino-acid sequence (e.g. `MKKFFDSRREQ...`)
- a **model**: Davis, KIBA or Metz

The app returns a **binding-affinity score**, a **± confidence** (spread across the ensemble), and a plain-language **band** (strong / moderate / weak binder).

- **Current scope:** the 2D prediction model, a basic FastAPI backend and a basic React + Vite frontend.
- **Not now:** the 3D branch (structure prediction, docking, 3D viewer). Leave clearly marked placeholders for it in the frontend and backend (`POST /predict-3d` returns "not implemented yet"; UI panel "3D binding pose — coming in the next phase"). Do not build it.

## 2. Base paper and model

- **Paper:** Nguyen, Jang, Kim & Kang (2023), *Perceiver CPI: a nested cross-attention network for compound–protein interaction prediction*, Bioinformatics 39(1), btac731. DOI 10.1093/bioinformatics/btac731, PMC9848062.
- **Official code:** `reference/PerceiverCPI-main.zip` (github.com/dmis-lab/PerceiverCPI, downloaded 2026-10-29). It is built on Chemprop.

How the model works:
1. **Compound, read two ways.** Its molecular graph goes through a D-MPNN (Chemprop). Its Morgan/ECFP fingerprint goes through an MLP.
2. **Cross-attention block 1** fuses the two (Q = fingerprint, K/V = graph), followed by self-attention. The paper found single-head attention worked best.
3. **Protein.** Tokenised with the TAPE tokenizer (UniRep vocabulary), zero-padded/truncated to length 500, then passed through stacked 1D-CNN blocks (GLU, residual connections, layer norm).
4. **Cross-attention block 2 (nested).** Q = compound, K/V = protein residues.
5. **MLP head** outputs the affinity (regression).

Training: loss MSE, optimiser LAMB, ensembles of checkpoints. Hyperparameters were found with Bayesian optimisation. Repo example settings: `--epochs 150 --ensemble_size 3 --batch_size 50 --dropout 0.1 --aggregation mean`.

Weighting for skewed labels (paper §3.1): on Davis and KIBA, rows outside the crowded label range get a 10× larger update than rows inside it. Davis example: labels in 0–5 are multiplied by 0.5, all others by 5. Check in Phase 4 whether the repo code supports this.

Rules for the model code:
- Use the official repo as the model code so results are comparable with the paper.
- Don't rewrite the architecture unless that is needed to run on modern PyTorch, and ask the user first.

### Paper results to compare against (5-fold CV, mean ± std)

| Dataset | Setting | MSE | CI |
|---|---|---|---|
| Davis | Novel pair | 0.463 ± 0.013 | 0.638 ± 0.028 |
| Davis | Novel compound | 0.378 ± 0.010 | 0.726 ± 0.017 |
| Davis | Novel protein | 0.667 ± 0.018 | 0.758 ± 0.010 |
| Davis | Novel-hard pair | 0.701 ± 0.244 | 0.609 ± 0.072 |
| KIBA | Novel pair | 0.522 ± 0.010 | 0.638 ± 0.013 |
| Metz | Novel pair | 0.658 ± 0.016 | 0.675 ± 0.012 |

Sources: Tables 4, 5 and 6 of the paper. **The paper ran KIBA and Metz only in the novel-pair setting.** Any other setting on KIBA or Metz has no paper number to compare against.

## 3. Datasets

Raw CSVs are in `reference/data/`. Their header is `compound_iso_smiles,target_sequence,affinity`. The repo expects `smiles, sequences, label`, so Phase 2 must check which column names the repo code reads and rename the columns to match.

| | Davis | KIBA | Metz |
|---|---|---|---|
| Measures | Kd | Kd + Ki + IC50 blended | Ki |
| Label unit | pKd = −log10(Kd / 1e9) | KIBA score | pKi |
| Observed range | 5.0–10.8 | 0–17.2 | 4.0–11.1 |
| Rows in file | 30,056 | 118,254 | 35,259 |
| Unique compounds | 68 | 2,068 | 1,423 |
| Unique sequences | 379 (paper lists 442 targets) | 229 | 170 |
| Paper row count (Table 1) | 30,056 | 117,657 | 35,259 |
| Known issues | 4,284 repeated smiles+sequence rows, 546 with conflicting labels; ~70% of labels exactly 5; 68 rows contain `X` | 218 exact duplicates; 597 repeated pairs, 288 with conflicting labels; ~72% of labels in 11.1–12 | Clean |

Davis has 379 sequences but 442 targets because it lists kinase variants (mutants, phosphorylated forms) as separate targets, and some of them share an identical sequence. This is not corruption.

Data rules:
- **Davis:** keep all 30,056 rows, which matches the paper.
- **KIBA:** drop exact duplicates. For repeated smiles+sequence pairs with different labels, use the mean label. Confirm the result is 117,657 rows (the paper's number), and log every merged pair.
- **Metz:** no changes.
- Drop invalid SMILES (checked with RDKit) and log them. None are expected.
- **Never merge the three datasets, and never compare or average scores across them.** Each uses a different scale.
- The model does not use protein names, only smiles, sequence and label.
- Paper data source: Davis and KIBA came from DeepPurpose (the repo's split script reads from a folder named `kiba_davis_deeppurpose`).

## 4. Splits (no data leakage)

Rewrite the repo's `prepare_data_for_setting.py`:
- Replace hardcoded Windows paths with relative paths.
- Group proteins **by sequence**, not by the 4th `protein_name` column. That way a 3-column CSV works, and identical sequences never appear in both train and test.

Settings, with the paper's exact definitions (§3.2):
- **Novel pair:** neither the training compounds nor the training proteins appear in the test set.
- **Novel compound:** no compound appears in both train and test.
- **Novel protein:** no protein appears in both train and test.
- **Novel-hard pair:** like novel pair, and every test interaction has similarity < 0.3 to the training interactions. Protein similarity is the % of aligned amino acids over the total length (length fixed to 500). Compound similarity is Tanimoto.

Each setting has 5 folds. Each fold's validation set is taken at random from that fold's training set, 80% train : 20% validation.

- A script must verify each setting's rules, e.g. that no test compound appears in train for novel compound.
- **The test set is used only for final reporting, never for tuning.**

## 5. Folder layout

The project root is `C:\projects\Perceiver_cpi\` (this folder).

```
Perceiver_cpi/
├── .venv/          # Python 3.12 virtual env (not in git), created in Phase 1
├── CLAUDE.md
├── README.md
├── reference/      # paper full text, repo zip, raw data (read-only)
├── model_2d/       # Perceiver CPI code (from the repo)
├── data/           # cleaned CSVs + splits
├── experiments/    # configs, logs, results tables (results_log.md)
├── models/         # final models: davis/, kiba/, metz/
├── backend/        # FastAPI
└── frontend/       # React + Vite
```

## 6. Phases and status

Every phase follows this loop: show a short plan → wait for OK → do it → run a test that proves it works → explain in simple words → git commit.

| Phase | What | Status |
|---|---|---|
| 0 | Setup: folders, git, CLAUDE.md, machine check, env choice | done (2026-10-29) |
| 1 | Smoke test: unzip repo to `model_2d/`, install deps, train on `toy_dataset`, run `predict.py` | todo |
| 2 | Data prep (§3 rules) → `data/davis.csv`, `data/kiba.csv`, `data/metz.csv`; before/after table; TAPE handles `X` | todo |
| 3 | Splits (§4) + leakage checks | todo |
| 4 | Baseline: reproduce the paper (MSE, CI, Pearson, Spearman, rm² as mean ± std over 5 folds) | todo |
| 5 | Improve accuracy, one change at a time, using validation only; log in `experiments/results_log.md` | todo |
| 6 | Model registry (`models/<dataset>/` + `model_card.md`), `model_2d/predict_api.py`, `MODEL_SELECTION.md` | todo |
| 7 | Backend: `/health`, `/models`, `/predict`, `/history`, `/predict-3d` placeholder; pytest | todo |
| 8 | Frontend: one page (navy background, teal inputs, orange prediction); README end to end | todo |

Phase details from the spec:
- **Phase 4:** estimate run time first. Start with novel pair on all three datasets, then the other settings.
- **Phase 6:** `predict(smiles, sequence, model)` returns `score, unit, confidence, band, model`.
  - Load models once and reuse them.
  - Band thresholds: use commonly used values per scale and cite the source of each. If there is no standard, state the assumption and make it configurable.
  - Reject invalid SMILES and non-amino-acid letters. Warn if the sequence is longer than 500 (it will be truncated) or very unlike the training proteins.
- **Phase 7:** history goes in MongoDB per the group's design. Ask before installing it; SQLite is acceptable for the basic version.

## 7. Rules

- Explain everything in simple words. The user must be able to explain every part in their viva.
- **Ask before** installing large packages, deleting files, or pushing to a remote.
- Fix random seeds and save every config so results can be reproduced.
- Be honest: if a result is worse than the paper, say so and explain why.
- Never merge datasets, and never compare or average scores across Davis, KIBA and Metz.
- Keep `CLAUDE.md` and `README.md` up to date as the project grows.

**Definition of done (this stage):**
- Three trained models, with test metrics reported next to the paper's.
- `predict(smiles, sequence, model)` works, with confidence and band.
- The backend and frontend run locally; a user can pick a model, enter inputs and see the score.

## 8. Machine and environment facts (checked 2026-10-29)

- Windows 11 Home; Intel Core Ultra 7 256V (8 logical cores); 15.7 GB RAM; ~545 GB free on C:.
- **GPU: Intel Arc 140V (integrated). There is no NVIDIA GPU, so CUDA is not available locally.** Full training must run on Google Colab.
- Python 3.14.2 is the system default. **Python 3.12.10 was installed for this project** (`py -3.12`). No conda. Git 2.56 was installed with winget. Node v24.19.0.
- The repo was built on Python 3.9 + PyTorch 1.7.1 + CUDA 10.1. Its `environment.yml` is a Linux-only export (it pins `ld_impl_linux-64`, `libgcc-ng`, etc.), so it won't install on Windows as written.
- The project lives at `C:\projects\Perceiver_cpi`. It was moved out of OneDrive on 2026-10-29 to avoid sync clashes and the 5 GB quota.

### Environment decision (user chose option b, 2026-10-29)

**Upgrade the repo to run on modern PyTorch (2.x), with one environment everywhere.**
- Why: there is no local CUDA, so training runs on Google Colab. Colab ships Python 3.12 + PyTorch 2.x, where PyTorch 1.7.1 can't be installed. One codebase then runs on both Colab and this laptop.
- Local env: a Python 3.12 venv at `.venv/` in the project root, used for the backend and CPU prediction.
- Only make compatibility fixes, never architecture changes. **List each fix and get the user's OK before applying it**, and record every one in `model_2d/CHANGES.md`.
- The risk is tiny numeric differences from the original setup. We check for this by comparing the Phase 4 numbers against the paper's.

## 9. Reference files

- `reference/PerceiverCPI-main.zip`: the official repo, downloaded from GitHub.
- `reference/PERCEIVER_CPI_fulltext.xml`: open-access full text from Europe PMC (PMC9848062), including all tables. The PDF itself could not be downloaded automatically (the publisher returns 403). Add `reference/PERCEIVER_CPI.pdf` by hand if needed.
- `reference/data/{davis,kiba,metz}.csv`: the user's raw datasets. They are not in git because of size.
