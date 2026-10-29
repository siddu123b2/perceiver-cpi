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

What the code actually does (read in Phase 1, `chemprop/models/model.py` + `CAB.py`). Know these for the viva:
- **One shared attention module.** All three attention steps (fingerprint→graph, graph self-attention, compound→protein) reuse the same `self.att` weights.
- **Attention over features, not residues.** The protein is flattened and projected to one vector of `hidden_size` before cross-attention. Q, K and V are single vectors, so attention runs across their feature dimensions (a d×d matrix), not across the 500 residue positions.
- **`self.rnns` (GRU layers) are created but never used** in `forward`. They are still saved in checkpoints.
- **`--alpha` does two jobs.** It is the loss weight inside `tau`, and the CNN residual scale (`sqrt(alpha)`). Changing it for label weighting also changes the CNN.
- **No label scaling.** `run_training.py` sets `scaler = None`, so the model learns raw pKd / KIBA / pKi values.

Training: loss MSE, optimiser LAMB, ensembles of checkpoints. Hyperparameters were found with Bayesian optimisation. Repo example settings: `--epochs 150 --ensemble_size 3 --batch_size 50 --dropout 0.1 --aggregation mean`.

Weighting for skewed labels (paper §3.1): on Davis and KIBA, rows outside the crowded label range get a 10× larger update than rows inside it. Davis example: labels in 0–5 are multiplied by 0.5, all others by 5. **The repo supports this, and it is ON by default** (`chemprop/train/train.py:52`, loss line 88). Args: `--tau 0 5` (range, inclusive), `--alpha 0.5` (weight inside), `--beta 5` (weight outside). The defaults are the Davis values and apply to *every* run unless changed. Phase 4 must set the right `tau` for KIBA (crowded range ~11.1–12), and decide what to do for Metz (the paper describes weighting for Davis and KIBA only). Remember that `alpha` also scales the CNN residual (see above).

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

Raw CSVs are in `reference/data/`. Their header is `compound_iso_smiles,target_sequence,affinity`. Checked in Phase 1: the code reads SMILES from the **first column**, the protein from a column named **`sequence`** (singular, `chemprop/data/utils.py:266`; the repo README wrongly says `sequences`), and the label from `--target_columns label`. Phase 2 renames the columns to `smiles,sequence,label`. A 4th column (e.g. `protein_name`) is ignored.

| | Davis | KIBA | Metz |
|---|---|---|---|
| Measures | Kd | Kd + Ki + IC50 blended | Ki |
| Label unit | pKd = −log10(Kd / 1e9) | KIBA score | pKi |
| Observed range | 5.0–10.8 | 0–17.2 | 4.0–11.1 |
| Rows in file | 30,056 | 118,254 | 35,259 |
| Unique compounds | 68 | 2,068 | 1,423 |
| Unique sequences | 379 (paper lists 442 targets) | 229 | 170 |
| Paper row count (Table 1) | 30,056 | 117,657 | 35,259 |
| Known issues | 4,284 surplus rows from 1,224 repeated smiles+sequence pairs (2,435 are exact duplicates), 546 pairs with conflicting labels; ~70% of labels exactly 5; 68 rows contain `X` | 218 exact duplicates; 597 surplus rows from 473 repeated pairs, 288 pairs with conflicting labels; ~72% of labels in 11.1–12 | Clean |
| Cleaned file (Phase 2) | `data/davis.csv`, 30,056 rows (unchanged) | `data/kiba.csv`, **117,657 rows = paper** | `data/metz.csv`, 35,259 rows (unchanged) |

Davis has 379 sequences but 442 targets because it lists kinase variants (mutants, phosphorylated forms) as separate targets, and some of them share an identical sequence. This is not corruption.

Data rules:
- **Davis:** keep all 30,056 rows, which matches the paper.
- **KIBA:** drop exact duplicates. For repeated smiles+sequence pairs with different labels, use the mean label. Confirm the result is 117,657 rows (the paper's number), and log every merged pair.
- **Metz:** no changes.
- Drop invalid SMILES (checked with RDKit) and log them. None are expected.
- **Never merge the three datasets, and never compare or average scores across them.** Each uses a different scale.
- The model does not use protein names, only smiles, sequence and label.
- Paper data source: Davis and KIBA came from DeepPurpose (the repo's split script reads from a folder named `kiba_davis_deeppurpose`).

Phase 2 findings (2026-10-29, details in `data/prep_report.md`):
- 0 invalid SMILES, 0 unknown amino-acid letters, 0 missing values. No molecule appears under two different SMILES strings, so SMILES are kept exactly as given (not canonicalised).
- `X` is in TAPE's UniRep vocabulary (token 23, shared with B/Z/J), so the 68 Davis rows with `X` are kept unchanged.
- **Only the first 499 residues are used.** TAPE adds start and stop tokens and the model keeps 500 tokens, so longer proteins lose their tail. That's 267/379 Davis, 148/229 KIBA and 116/170 Metz sequences. This is the paper's design, not changed.
- **Label noise floor:** Davis has identical pairs with different labels, so no model can get MSE below **0.032** on Davis. KIBA is 0.000 after merging, Metz 0.000.
- Rebuild: `data/prepare_datasets.py`. Test: `data/check_datasets.py --with-model` (35 checks, plus a 1-epoch training run on each file).

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

Phase 3 decisions (user approved 2026-10-29). Each is a point the paper leaves unclear; the paper quotes and the rejected options are in the Phase 3 plan:
- **Which settings.** Davis gets all four. KIBA and Metz get novel pair only (paper: *"only novel pair setting was applied on the KIBA and Metz datasets"*).
- **Folds.** Copy the repo: sort the unique SMILES / sequences alphabetically, cut them into 5 consecutive blocks of 20%, and fold k tests block k. No randomness. Chosen for comparability.
- **Novel pair.** Rows mixing a test compound with a training protein (or the reverse) are unused. The definition forces this, and the repo does the same.
- **Validation.** A random 20% of each fold's *training pairs*, with seed = fold number. Identical smiles+sequence rows stay together (user rule: the same input is never on two sides, in any setting). Validation contains compounds and proteins seen in training, as in the paper.
- **Novel-hard pair.** Start from the novel-pair fold (same train/val). Keep a test row only if its compound's highest Tanimoto (Morgan r2, 2048 bits) to any training compound is < 0.3 **and** its protein's highest identity to any training protein is < 0.3.
- **Protein identity.** Global alignment of the first 500 residues (BLOSUM62, gap open 10, extend 0.5, free end gaps = EMBOSS needle defaults); identical positions ÷ 500.
- Code: `data/make_splits.py` (the repo's `prepare_data_for_setting.py` is kept untouched for reference). Checks: `data/check_splits.py`. Fold sizes: `data/splits/summary.md`.

Phase 3 results (2026-10-29):
- Split files: `data/splits/<dataset>/<setting>/fold{k}_{train,val,test}.csv` (802 MB, git-ignored). Rebuild with `make_splits.py`: ~6 min the first time, 36 s with the committed protein-identity cache (`davis_protein_identity.npz`). Two builds were byte-identical. `manifest.json` (committed) holds an MD5 for every file, so a Colab rebuild can be verified.
- Test rows per fold: Davis novel pair ~1,100–1,440; novel compound ~5,300–6,200; novel protein ~5,300–7,000; **novel-hard 112–276** (5–12 of 14 compounds and 14–24 of 76 proteins pass the 0.3 cut-off); KIBA novel pair ~3,400–5,800; Metz novel pair ~1,250–1,600. Novel pair leaves ~32% of rows unused per fold.
- **Phase 4 timing:** 1 epoch on Davis novel-pair fold 0 (15,641 training rows) took **3 min 50 s on this laptop's CPU**. A paper-style run (150 epochs × ensemble of 3) would take days on CPU, so Phase 4 must run on Colab GPU. Test MSE after 1 epoch: 1.087 (paper, fully trained: 0.463).

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
| 1 | Smoke test: unzip repo to `model_2d/`, install deps, train on `toy_dataset`, run `predict.py` | done (2026-10-29), see `experiments/phase1_smoke/` |
| 2 | Data prep (§3 rules) → `data/davis.csv`, `data/kiba.csv`, `data/metz.csv`; before/after table; TAPE handles `X` | done (2026-10-29), see `data/prep_report.md` |
| 3 | Splits (§4) + leakage checks | done (2026-10-29), see `data/splits/summary.md`. 90 files, 340 leakage checks pass, checker caught 6/6 planted breaks |
| 4 | Baseline: reproduce the paper (MSE, CI, Pearson, Spearman, rm² as mean ± std over 5 folds) | todo |
| 5 | Improve accuracy, one change at a time, using validation only; log in `experiments/results_log.md` | todo |
| 6 | Model registry (`models/<dataset>/` + `model_card.md`), `model_2d/predict_api.py`, `MODEL_SELECTION.md` | todo |
| 7 | Backend: `/health`, `/models`, `/predict`, `/history`, `/predict-3d` placeholder; pytest | todo |
| 8 | Frontend: one page (navy background, teal inputs, orange prediction); README end to end | todo |

Phase details from the spec:
- **Phase 4:** estimate run time first. Start with novel pair on all three datasets, then the other settings.
- **Phase 5 ideas** (try one at a time, judge on validation only, log in `experiments/results_log.md`):
  - **Protein truncation.** The model sees only the first 499 residues. Truncated: **Davis 267/379, KIBA 148/229, Metz 116/170** sequences. For kinases, the inhibitor binding site is in the kinase domain, which often lies beyond residue 499.
    - First measure how many truncated proteins actually lose part or all of their kinase domain. This needs domain positions from UniProt/Pfam; ask before downloading.
    - Then test (a) feeding the kinase-domain region instead of the first 499 residues, and (b) a longer max length (`--sequence_length`). Note: (b) changes the model's input size and memory use.
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
- **Unclear paper details** (user rule, 2026-10-29): for every decision the paper leaves unclear, quote what the paper says, give 2 options with a recommendation, and prefer whatever keeps our numbers comparable with the paper. Wait for the user's choice.
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

### Environment as built (Phase 1, 2026-10-29)

- `.venv/`: Python 3.12.10, `torch 2.15.0+cpu`, plus `model_2d/requirements.txt` (exact pins). On Colab, keep Colab's own torch and install only `requirements.txt`.
- **3 compatibility fixes approved and applied** (`.cuda()` → model's device; `torch.load(..., weights_only=False)`; `np.float` → `float`). Details in `model_2d/CHANGES.md`. No other code changes were needed for train + predict.
- On Windows, pass `--num_workers 0` to `predict.py`. It gives the same predictions and is ~30× faster, because worker processes re-import PyTorch.
- `--seed 0` makes training repeatable on CPU (two runs differed by ≤1.2e-7).
- Each checkpoint (`model.pt`) is ~18.7 MB. Weights are git-ignored.

## 9. Reference files

- `reference/PerceiverCPI-main.zip`: the official repo, downloaded from GitHub.
- `reference/PERCEIVER_CPI_fulltext.xml`: open-access full text from Europe PMC (PMC9848062), including all tables. The PDF itself could not be downloaded automatically (the publisher returns 403). Add `reference/PERCEIVER_CPI.pdf` by hand if needed.
- `reference/data/{davis,kiba,metz}.csv`: the user's raw datasets. They are not in git because of size.
