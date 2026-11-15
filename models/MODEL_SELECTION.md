# Which model the app serves, and why

One model per dataset. Rebuild everything here with:

```
.venv\Scripts\python.exe models\build_registry.py
.venv\Scripts\python.exe models\calibrate_confidence.py
```

| Dataset | Served by | Test MSE | Paper | Guess the average |
|---|---|---|---|---|
| Davis | `davis_base_s0` + `davis_base_s1`, averaged (Phase 5 Step B, 400 epochs) | **0.622** | 0.463 | 0.751 |
| Metz | Phase 4 baseline, 150 epochs | **0.762** | 0.658 | 0.910 |
| KIBA | Phase 4 baseline, 150 epochs | **0.575** | 0.522 | 0.553 |

## How these were chosen

**The rule: pick on principle, never on the test score.** The test set is for final reporting only
(CLAUDE.md §4), so "whichever scored best on test" is not an allowed reason.

- **Davis** gets the two 400-epoch Step B seeds, averaged. More epochs and an ensemble are
  improvements on the Phase 4 recipe *as a matter of method* - decided before looking at any test
  number. Averaging them was worth 0.643 -> 0.622.
- **Metz** keeps the Phase 4 baseline. Phase 5 Step 1 produced two more Metz models (`metz_A`,
  `metz_B`), but they differ in **how their validation set was built**, not in quality, and their
  validation scores are therefore not comparable with each other. Choosing between them could only
  have been done on the test score, so we did not choose: we kept the original.
- **KIBA** keeps the Phase 4 baseline. Nothing has retrained it since.

**The ESM-2 models are deliberately not served.** Step B showed they read the protein better
(within-compound protein ranking -0.00 -> +0.047) but are less accurate overall (test MSE
0.643 -> 0.734). Serving a less accurate model for a benefit this small is not justified yet.
Phase 5 Step C tests a version that keeps both encoders; if it holds the accuracy *and* the protein
ranking, it replaces the Davis entry here.

## What changes when Step C finishes

`SERVED` in `build_registry.py` is the single place to edit:

- **Session A** (Davis, both encoders) replaces the Davis entry if it wins on validation.
- **Sessions B/C/D** replace Metz and KIBA with 400/200-epoch two-seed ensembles. These are expected
  to be clear improvements, because both currently sit far above even their compound-only ceilings
  (Metz 0.762 against a ceiling of 0.332; KIBA 0.575 against 0.270).

## Band thresholds

`strong` / `moderate` / `weak`, set in `BANDS` in `build_registry.py`. Each model's `band_source`
is returned with every prediction.

| Dataset | Strong | Moderate | Where it comes from |
|---|---|---|---|
| Davis (pKd) | >= 7.0 | >= 6.0 | pKd >= 7 (Kd <= 100 nM) is the standard binder cut-off used to binarise Davis in the DTA literature. **The 6.0 line is our own.** |
| Metz (pKi) | >= 7.0 | >= 6.0 | **Both are our own.** No binarisation threshold is standard for Metz; we apply the same pharmacology convention as Davis (pKi 7 = 100 nM). |
| KIBA | >= 12.1 | >= 11.1 | KIBA >= 12.1 is the standard cut-off (the transformed equivalent of the original KIBA <= 3.0). **The 11.1 line is our own**, taken from the crowded band identified in the Perceiver CPI paper. |

## The two calibrated numbers

Both are computed from data rather than guessed, because guessing was measurably wrong here.

**Scope thresholds** (`scope_thresholds`) - when to warn that an input is an extrapolation. Set to
the 10th percentile of how similar each training entry is to its nearest *other* training entry:
"we warn when your input is less like this dataset than 90% of the dataset is like itself."

| Dataset | Compound (Tanimoto) | Protein (3-mer Jaccard) |
|---|---|---|
| Davis | 0.192 | 0.109 |
| Metz | 0.305 | 0.102 |
| KIBA | 0.333 | 0.103 |

A plausible-sounding guess of 0.5 would have been badly wrong: Davis kinases have a median
similarity to their nearest neighbour of only **0.22**, so almost every real kinase would have been
flagged. Haemoglobin, which genuinely is out of scope, scores 0.046.

**Confidence cut-offs** (`confidence_cuts`) - the low/medium/high label. Tertiles of the MC-dropout
spread over 800 rows of that model's own **validation** set, never the test set.

| Dataset | high <= | low > | Range seen |
|---|---|---|---|
| Davis | 0.162 | 0.178 | 0.109 - 0.238 |
| Metz | 0.166 | 0.198 | 0.102 - 0.406 |
| KIBA | 0.242 | 0.277 | 0.165 - 0.574 |

**Read this label weakly.** The spread varies over a narrow range, and Phase 4 measured that it
tracks real error well only on Davis (rank agreement +0.39, against +0.03 on Metz and +0.08 on
KIBA). It is never presented as a confidence interval: measured coverage of +/-2 spread is 33-63%,
not 95%.
