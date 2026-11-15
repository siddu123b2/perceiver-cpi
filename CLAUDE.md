# CLAUDE.md — Perceiver CPI binding-affinity app (Group G1590)

Read this first in every session. It is the project's memory.

## 1. What we are building

A university project. The user enters:
- a **compound** as a SMILES string (e.g. `CC(=O)Oc1ccccc1C(=O)O`)
- a **protein** as an amino-acid sequence (e.g. `MKKFFDSRREQ...`)
- a **model**: Davis, KIBA or Metz

The app returns a **binding-affinity score**, a **± confidence** (spread of MC-dropout predictions; see the Phase 4 decision in §6), and a plain-language **band** (strong / moderate / weak binder).

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

Every phase follows this loop: do it → run a test that proves it works → explain in simple words → git commit.

**Working agreement (user, 2026-11-12), replaces the earlier "wait for OK at every step":** the user trusts Claude to keep going without asking permission for each step. Claude still **tells the user first, and waits**, before anything that would tie up their laptop or the college GPU for a long time, because they need to know to leave the machine running. Threshold: **anything expected to take more than ~15 minutes on the user's laptop, and anything at all that needs the college GPU.** Short checks, analysis, code and commits need no announcement. The §7 rules below still apply unchanged (ask before installing large packages, deleting files, or pushing to a remote). The user's standing priority: the finished app must work for real inputs, not just on the benchmark.

| Phase | What | Status |
|---|---|---|
| 0 | Setup: folders, git, CLAUDE.md, machine check, env choice | done (2026-10-29) |
| 1 | Smoke test: unzip repo to `model_2d/`, install deps, train on `toy_dataset`, run `predict.py` | done (2026-10-29), see `experiments/phase1_smoke/` |
| 2 | Data prep (§3 rules) → `data/davis.csv`, `data/kiba.csv`, `data/metz.csv`; before/after table; TAPE handles `X` | done (2026-10-29), see `data/prep_report.md` |
| 3 | Splits (§4) + leakage checks | done (2026-10-29), see `data/splits/summary.md`. 90 files, 340 leakage checks pass, checker caught 6/6 planted breaks |
| 4 | Baseline, **reduced scope** (user decision 2026-10-29): ONE model per dataset (Davis, KIBA, Metz), trained on novel-pair **fold 0**, on the college's GPU via Google Colab. Report MSE, CI, Pearson, Spearman, rm² next to the paper's | **done (2026-11-12)**, see `experiments/phase4_baseline/results.md`. All three trained 150 epochs on an NVIDIA L4; resume was used 8 times and worked. **Results are worse than the paper on every metric, and the models barely beat guessing the training average** (KIBA is worse than it). Rebuild the report with `evaluate.py` |
| 5 | Improve accuracy, one change at a time, using validation only; log in `experiments/results_log.md` | todo |
| 6 | Model registry (`models/<dataset>/` + `model_card.md`), `model_2d/predict_api.py`, `MODEL_SELECTION.md` | todo |
| 7 | Backend: `/health`, `/models`, `/predict`, `/history`, `/predict-3d` placeholder; pytest | todo |
| 8 | Frontend: one page (navy background, teal inputs, orange prediction); README end to end | todo |

Phase details from the spec:
- **Phase 4 decision (user, 2026-10-29): compute-limited baseline.**
  - Train **one model per dataset** (no ensembles) on **novel-pair fold 0** only. The other folds and settings (novel compound / protein / hard) are deferred; their splits are ready in `data/splits/`.
  - **Why:** the full paper protocol (5 folds × ensemble of 3 × 150 epochs × 5 setting-datasets) is ~300 M training row-passes, roughly 45 days on this laptop's CPU and days of GPU time.
  - **± confidence = MC dropout** instead of ensemble spread. Predict the same input N times with dropout left on, and use the standard deviation. Dropout (0.1) is already in the model, so no extra training is needed.
  - **Reporting:** put our fold-0 test MSE and CI next to the paper's 5-fold mean ± std, and state clearly: "single model, single fold, so the comparison is not exact". The paper's fold-to-fold std for novel pair is small (±0.010–0.016 MSE), so one fold is a fair indicator, but the missing ensemble may cost some accuracy.
  - **Where (changed again 2026-11-03): the college's GPU through Google Colab.** The user uploads a Drive folder and shares it with the college (Editor), and the college runs the notebook.
    - `make_bundle.py` also builds `colab_upload/perceiver_cpi_colab/`, holding `Perceiver_CPI_train.ipynb`, `perceiver_gpu_bundle.zip` and `README_FOR_COLLEGE.txt`. The sources are in `experiments/phase4_baseline/colab/`; the user's guide and email draft are in `colab/UPLOAD_GUIDE.md`.
    - **What the notebook does:**
      - mounts Drive and finds the folder (shared folders need "Add shortcut to My Drive");
      - unzips the bundle to `/content`;
      - installs `requirements.txt` with pip, keeping Colab's own torch (if the pinned versions fail, it falls back to current versions, and `environment.txt` records them);
      - runs `check_setup.py`, plus `--skip-timing` when resuming;
      - runs `train_all.py` with `PERCEIVER_RUNS` pointing at `<Drive folder>/runs`, so resume survives disconnects;
      - runs `pack_results.py`, which writes `<Drive folder>/results_to_copy.zip`.
    - All heavy work runs in subprocesses, so pip upgrades need no runtime restart.
    - **Designed for the college's powerful GPUs (user, 2026-11-03).** The model is small, so one run leaves a big GPU mostly idle; the bottleneck is CPU batch preparation.
      - With **6+ CPU cores**, `train_all.py` trains Davis, Metz and KIBA **at the same time** as 3 processes. With several GPUs, each run gets its own (`CUDA_VISIBLE_DEVICES`). The wall-clock time is then about that of KIBA alone.
      - On Linux each run also gets `min(4, cores // runs - 1)` data-loader workers. That's the authors' own default setup; batch order still comes from the main process.
      - Progress is one line every 5 minutes; the logs are in `runs/<dataset>/console.log` (`TQDM_DISABLE=1`).
      - Each run sees exactly one GPU, picked only from the GPUs in `CUDA_VISIBLE_DEVICES` if that is already set (shared servers). A run that always sees one GPU can also resume on a machine with fewer GPUs.
      - Training starts through `gpu_bundle/train_quiet.py`, which runs the repo's `train.py` unchanged but with RDKit warnings off. Otherwise the old fingerprint function prints ~18 million deprecation lines, which would flood Colab and Drive. Same predictions (checked: max difference 0.0).
      - Fewer cores means one after another, with live progress bars. Force a mode with `--parallel` / `--sequential`.
      - **None of this changes the results:** same settings, batch size, precision (no AMP/TF32 changes) and seeds.
        - Checked 2026-11-03 with one CPU thread (fully repeatable): "at the same time" and "one after another" give identical predictions for all three datasets (max difference 0.0).
        - **Rounding noise (viva point).** Normal multi-threaded CPU runs, and GPU runs, are not bit-for-bit repeatable, whichever mode is used. Threads add numbers in a slightly different order, and training amplifies these ~1e-6 differences. In the 1-epoch offline tests, test MSE was Davis 1.08653 vs 1.08652, Metz 1.8250 vs 1.8254 and KIBA 2.176 vs 2.205. So a re-run of Phase 4 would give slightly different numbers; this is normal and not a bug.
      - GPU checks are generic (`torch.cuda`), not NVIDIA-specific wording.
    - Tested offline by running the notebook's cells with a fake Drive folder (`--allow-cpu --epochs 1`): a fresh run, then "Run all" again (skips finished datasets, re-packs). Passed in both modes. The final test used the exact upload folder built from commit `6acddfe` (2026-11-03): 0 RDKit warning lines, ~11 KB per run log, `results_to_copy.zip` 52 MB.
  - **Earlier plan (2026-10-29, still usable): a borrowed laptop with an NVIDIA RTX 4050/3050.**
    - Build the bundle with `experiments/phase4_baseline/make_bundle.py` → `perceiver_gpu_bundle.zip` (~38 MB). It holds the code, the 9 fold-0 split files and `manifest.json`.
    - The beginner instructions are `gpu_bundle/RUN_ON_GPU_LAPTOP.md`. The scripts are `check_setup.py` (checks + timing), `train_all.py` (Davis → Metz → KIBA, with `--resume`) and `pack_results.py` (→ `results_to_copy.zip`).
    - The results go back into `experiments/phase4_baseline/runs/<dataset>/`.
    - **GPU environment:** `model_2d/requirements-gpu.txt` = `torch==2.15.0+cu132` + `requirements.txt`. This needs an NVIDIA driver showing "CUDA Version: 13.0" or higher. If the driver can't be updated, the fallback is `torch==2.14.1` from the cu126 index; the report must mention it if used.
  - **Training settings (D1–D3, user approved 2026-10-29).** The paper quotes are in the Phase 4 plan.
    - **D3:** use the repo README settings: `--epochs 150 --batch_size 50 --dropout 0.1 --aggregation mean`, code defaults for the rest, `--seed 0 --pytorch_seed 0`, `--ensemble_size 1`. The paper's Bayesian-optimised values are not published in the main text.
    - **D1, KIBA:** `--tau 11.1 12 --alpha 0.5 --beta 5`. The paper says 71.96% of KIBA labels lie in 11.1–12, and the weighting uses the same 10× ratio as Davis.
    - **D2, Metz:** `--alpha 0.5 --beta 0.5`, i.e. the same weight for every row, which means no weighting. The paper calls Metz "well-balanced". `alpha` stays 0.5, so the CNN residual scale is the same as for Davis and KIBA.
    - **Davis:** `--tau 0 5 --alpha 0.5 --beta 5` (the paper's example; also the code defaults).
  - **Resume:** change 4 in `model_2d/CHANGES.md` (approved). **MC dropout:** `model_2d/mc_dropout.py`. The score is the normal prediction; the ± is the std of 30 dropout-on predictions (seed 0).
  - **Estimated time on the RTX laptop:** ~10–16 h in total (Davis ~2 h, Metz ~2.5 h, KIBA ~8 h), based on the CPU profile. `check_setup.py` measures the real speed.
  - **Measured on CPU (Phase 3):** 1 epoch of Davis fold 0 = 3 min 50 s. Profile: ~80% of the time is the network (GPU helps), ~20% is CPU-side batch preparation (GPU doesn't).
- **Phase 4 results (2026-11-12).** Trained on the college's NVIDIA L4 (torch 2.14.1+cu130, Python 3.13). Full report: `experiments/phase4_baseline/results.md`; rebuild with `evaluate.py`; raw numbers in `metrics.json`. The evaluation's MSE matches what each training run wrote, to 1e-6.

  | Dataset | Our MSE | Paper MSE | Our CI | Paper CI | Always-guess-the-average MSE |
  |---|---|---|---|---|---|
  | Davis | 0.716 | 0.463 ± 0.013 | 0.622 | 0.638 ± 0.028 | 0.751 |
  | KIBA | 0.575 | 0.522 ± 0.010 | 0.565 | 0.638 ± 0.013 | 0.553 |
  | Metz | 0.762 | 0.658 ± 0.016 | 0.634 | 0.675 ± 0.012 | 0.910 |

  - **Worse than the paper on every metric, and the models barely learn.** Davis beats the always-guess-the-average baseline by only 5%, Metz by 16%, and **KIBA is 4% worse than it**. Predicted values vary far less than the real ones (Davis: prediction sd 0.24 vs true sd 0.87), i.e. the models hedge toward the mean. Pearson 0.24–0.40, rm² 0.04–0.12.
  - **Validation is much better than test** (Davis 0.414 vs 0.716; same ~0.31 gap on all three). Validation holds compounds and proteins seen in training, the novel-pair test set does not. The models learned the training entities, not transferable chemistry. **Novel pair is the real-world case** (new drug + new protein), so these numbers are what a real user would get.
  - Likely causes, most likely first: no ensemble (paper averages 3); one fold not 5; hyperparameters (the paper's Bayesian-optimised values are unpublished); **training stopped too early** — validation MSE was still falling at epoch 150 on Davis and Metz (best epochs 143 and 145); KIBA levelled off ~epoch 90 (best 140).
  - **MC-dropout ± works on Davis only.** Rank agreement between ± and actual error: Davis +0.39 (least-confident quarter is ~2× as wrong as the most-confident), KIBA +0.08, Metz +0.03. On all three the ± is 3–4× too small: the true label lands inside ±2 spread only 33–63% of the time, not ~95%. MC dropout sees only dropout wobble, not the generalisation failure above, so the model can be confidently wrong. **Phase 6 rule: never present this ± as a 95% interval.** Show a relative high/medium/low label, or calibrate on **validation** (never test). The 33–63% coverage was reported, not tuned against.
- **Phase 5 Step 0 diagnosis (2026-11-12, no GPU).** Why the Phase 4 models barely beat the mean. Run from the saved predictions; nothing retrained.
  - **The label weighting is not the cause.** `train.py:52,88` applies it exactly as the paper describes, and it pushes the right way (Davis rows above tau get a slightly higher prediction, 5.37 vs 5.26). The effect is just far too weak to matter.
  - **Almost all the error is on the real binders.** Davis test: the 66% of rows inside tau (label 5.0, "no binding") score MSE **0.115**, while the 34% outside tau (true binders) score MSE **1.870** — about 89% of the total error. KIBA is the same shape (0.196 inside, 1.635 outside). **The models fail precisely on the cases a user cares about.**
  - **The models are not broken and can learn.** On validation they vary their answers and clearly beat a flat prediction (Davis 0.414 vs 0.920 flat). The failure is transfer, not capacity.
  - **On the test set they collapse toward the mean.** Davis predictions span 5.03–6.19 (range 1.16) against a true range of 5.00–10.12 (5.12). Same on KIBA and Metz.
  - **Root cause found: we select models with the wrong yardstick.** Validation is **100% compounds and proteins seen in training**; the test set is **0%**. Training keeps the epoch with the best validation MSE, so **we are choosing the model that memorises best, not the one that generalises best.** The repo and paper do the same, so the Phase 4 comparison stays fair, but this caps real-world accuracy and is the first thing to fix.
- **Phase 5 Step 0, part 2 (2026-11-12).** Full write-up: `experiments/phase5/diagnosis.md`, rebuilt by `experiments/phase5/diagnose.py`.
  - **The models mostly ignore the protein.** Share of prediction variance explained by compound identity vs protein identity: Davis 69%/13%, KIBA 85%/9%, Metz 87%/9%. In the true labels it is 28%/16%, 50%/18%, 61%/11%. So the models answer by *which drug* it is and barely change for *which protein* they are asked about. For the app this is the core problem: the user picks both.
  - **Truncation is NOT the cause — tested and rejected.** If losing residues past 499 were crippling the protein branch, long proteins would be clearly worse. Davis is 0.79x (i.e. *better*) on cut-off proteins, KIBA 1.10x, Metz 1.04x. Caveat: this compares different proteins, so family and label range vary too; suggestive, not controlled. **The kinase-domain idea therefore drops down the list; do not lead Phase 5 with it.** (Claude had wrongly called it the best route to beating the paper before running this check.)
  - **Honest expectation.** Ensembling typically buys 5-15% MSE, and the paper's fold-to-fold std is small (±0.013), so neither explains the full Davis gap (0.716 vs 0.463). Part of it is likely the paper's Bayesian-optimised hyperparameters, which are unpublished. Closing the gap completely may not be possible without them; say so rather than implying otherwise.
- **Phase 5 Step 1 results (2026-11-13), run on the user's own Kaggle account (T4 x2, ~4 h).** `experiments/phase5/results.md`; raw runs in `experiments/phase5/runs/`.

  | Dataset | Phase 4 | A (novel-pair validation) | B (random-pair control) | Paper |
  |---|---|---|---|---|
  | Davis | 0.716 | **0.644** | 0.697 | 0.463 |
  | Metz | 0.762 | 0.759 | **0.719** | 0.658 |

  - **The yardstick question is NOT settled: 1-1 and probably confounded.** In both datasets the run that trained *longer* won (davis_A stopped at epoch 102 vs B's 83; metz_B at 146 vs A's 81). Stopping epoch, not the yardstick, is the simplest explanation, and it matches the Phase 4 finding that 150 epochs was too few. Do not claim the novel-pair validation is better on this evidence.
  - The distribution check argues against the obvious story too: on Davis, `randomval` is the *closer* match to the test labels (KS 0.040 vs 0.152) yet A won; on Metz `novelval` is closer (0.037 vs 0.132) yet B won. So representativeness does not explain it either.
  - **The decisive finding — `experiments/phase5/protein_sensitivity.py` → `protein_sensitivity.md`.** Hold the compound fixed and vary the protein (test compounds with >=5 proteins):

    | Run | Test MSE | Spread captured | Rank correlation within a compound |
    |---|---|---|---|
    | Phase 4 Davis | 0.716 | 16% | +0.021 |
    | davis_A | 0.644 | 17% | -0.050 |
    | davis_B | 0.697 | 20% | -0.066 |
    | Phase 4 Metz | 0.762 | 37% | +0.109 |
    | metz_A | 0.759 | 26% | -0.005 |
    | metz_B | 0.719 | 19% | -0.070 |

    **Within one compound, our ranking of proteins is no better than shuffling them** (correlations are zero or negative), and the answers move only 16-37% as far as they should when the protein changes. The models are close to "one number per compound". **This is the project's central problem**: the app asks the user for a compound *and* a protein.
  - **Optimising MSE is steering us the wrong way.** davis_A improved MSE (0.716 -> 0.644) while its protein sensitivity got *worse* (+0.021 -> -0.050). Overall MSE and CI hide this, because a per-compound average scores respectably on both. **Report protein sensitivity next to MSE from every experiment from now on.**
  - Tooling: the `kaggle` CLI is installed in `.venv` (`kaggle kernels output <user>/<notebook> -p <dir>`); it needs a token from kaggle.com/settings/api, which the user supplies and should expire afterwards.
- **Phase 5 Step A: ESM-2 feasibility (2026-11-13, laptop CPU, no GPU).** `experiments/phase5/esm_feasibility.py`. Literature first: cold-start (unseen protein) DTA is a known hard problem, and ESM-2 is the standard protein encoder for it (CS-DTA uses ESM2-35M for strict cold-start; LLMDTA pairs ESM-2 with molecular features). A 2026 review says Davis/KIBA results are "often influenced by dataset bias, data leakage, and limited evaluation protocols". **Caveat: in every such paper ESM arrives bundled with other changes, so its own contribution is never isolated.**
  - Setup: `fair-esm` installed in `.venv`; `esm2_t12_35M_UR50D` cached under `~/.cache/torch/hub/checkpoints` (flaky download, needed a resume loop; huggingface.co is unreachable from this machine, dl.fbaipublicfiles.com works). Davis protein vectors cached in `experiments/phase5/esm_cache/` (git-ignored).
  - **ESM clearly separates these proteins.** Predicting a protein's average affinity from its ESM vector, holding out training proteins at random: **correlation +0.641**. The signal is real.
  - **Ceiling found, and it is the key number.** If a model knew every protein's true average affinity, its within-compound rank correlation would be only **+0.23 on validation / +0.41 on test** — because **56-70% of the variation is genuine compound-protein interaction**, which no one-number-per-protein term can reach. Our trained networks are at ~0.00, so there is real room, but an additive protein fix alone cannot get near 1.0.
  - A crude additive ridge on compound+ESM reached rank corr +0.063 (vs the +0.231 ceiling) and *worsened* MSE (0.545 -> 0.604). **Verdict: GO, expecting a partial fix, not a cure.**
  - **Two confounded tests to avoid repeating** (both bit me here): (1) comparing protein averages between the training proteins and the validation proteins also changes the *compound* set, so the drop from +0.641 to +0.065 was an artefact, not evidence against ESM; (2) un-scaled ridge over 0/1 Morgan bits plus continuous ESM values is meaningless - standardise first and choose alpha by CV on training rows only.
  - Checked and rejected: that the alphabetical block split isolates proteins from their relatives. Held-out proteins are just as close to training proteins as training proteins are to each other (median nearest-neighbour similarity 0.982 vs 0.984).
- **Phase 5 Step B: the ESM experiment (built 2026-11-13, not yet run).** Code committed; the user runs it on their own Kaggle account.
  - **The protein problem is on all three datasets, not just Davis.** Within-compound protein rank correlation now vs the ceiling: Davis -0.05 vs +0.41, Metz -0.07 vs +0.32, KIBA -0.07 vs +0.42. But the protein barely moves the *MSE* ceiling on Metz (0.332 -> 0.326) or KIBA (0.270 -> 0.256), while on Davis it moves it a lot (0.541 -> 0.420). **So Davis is the testbed** (the effect shows in two measurements, not one) and the winner then goes to Metz and KIBA for the app's sake.
  - **Separately, Metz and KIBA are far above even their compound-only ceilings** (0.719 vs 0.332; 0.575 vs 0.270). That gap needs no protein work at all - it is longer training and ensembling.
  - Experiment: `experiments/phase5/run_experiment.py --group baseline|esm`. Four Davis runs, `train2`+`novelval`, **400 epochs** (our best epochs have been 83-143, so ~3x past the peak), **2 seeds each** because Step 1 showed one run cannot be told apart from luck. Split into two Kaggle sessions of ~5.5 h so neither approaches the 12 h limit.
  - Notebook `Perceiver_CPI_stepB.ipynb`; the ESM bank (152 MB for Davis) is built **on Kaggle** by `make_esm_bank.py` rather than uploaded.
  - Smoke-tested locally: both groups train, seeds differ, encoders differ, no NaNs, checkpoints stay 18.1 MB.
  - **Judge on validation**; protein sensitivity is computable on the validation set, so the test set need not be opened to choose a winner.
- **Phase 5 Step B results (2026-11-15).** Ran on the user's Kaggle account, 2 sessions. Full report: `experiments/phase5/stepB_results.md`, rebuilt by `stepB_results.py`; raw numbers in `stepB_metrics.json`. Four Davis runs, 400 epochs, `train2`/`novelval`, 2 seeds per group.

  | Group (mean of 2 seeds) | Validation MSE | Validation protein rank | Test MSE | Test protein rank | Test spread captured |
  |---|---|---|---|---|---|
  | paper encoder (learned) | 0.511 | +0.043 | **0.643** | -0.000 | 20% |
  | ESM-2 encoder | 0.485 | **+0.119** | 0.734 | **+0.047** | **31%** |

  Ceilings for protein rank: validation +0.231, test +0.414.
  - **ESM moves protein ranking off zero — the first thing in Phase 5 that has.** The groups do not overlap on either split: the worse ESM seed still beats the better baseline seed. Spread captured rises from ~20% to ~31%.
  - **But ESM costs test MSE: 0.643 -> 0.734**, also with no overlap. Validation MSE disagrees (0.511 -> 0.485) and **test should be believed here**: training keeps the best-validation epoch, so validation MSE is the quantity we optimised and is biased low. The rank finding has no such bias, and validation and test agree on it.
  - **Partial fix, as Step A predicted:** 11% of the test ceiling. Not solved.
  - **Small samples:** rank correlation averages over 10 validation compounds and 14 test compounds, 2 seeds per group. The *direction* is consistent across 4 independent comparisons; the exact values are not reliable.
  - Validation predictions were not saved by training, so `validation_preds.py` regenerates them from each saved checkpoint (nothing retrained). Cross-check: all four recomputed validation MSEs match the training logs exactly.
  - **Two Kaggle path bugs were found and fixed first** (commit `56014dd`), after the first ESM session died in 54 seconds: `make_esm_bank.py` and `protein_sensitivity.py` assumed the repo folder layout rather than the flat bundle, and the notebook searched only one folder deep for a previous session's results. Lesson recorded: smoke-test bundle scripts *inside an extracted bundle*, not from the repo.
- **Phase 5 ideas** (try one at a time, judge on validation only, log in `experiments/results_log.md`):
  - **Priority 1 (from Step 0): a novel-pair validation set.** Carve a second validation set out of the training rows that holds out whole compounds *and* whole proteins, mirroring how the test set is built, and use it to pick the epoch. Keep the paper-style validation as well, so the comparison with the paper stays honest. Cheap to build (reuses `make_splits.py`), and it changes what every later experiment optimises, so do it first.
  - **Note on "train longer":** validation MSE was still falling at epoch 150 on Davis and Metz, but that validation measures memorisation. Re-judge this idea on the novel-pair validation before spending GPU time; more epochs may simply memorise harder.
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
