# Step D: 5-fold cross-validation

Until now every number in this project came from **fold 0**. The paper reports a
5-fold mean and standard deviation, so a single fold could not be set beside it
honestly. These are all five folds, at identical settings (standard split, 150
epochs, one model, seed 0). Fold 0 is the Phase 4 baseline; folds 1-4 are Step D.

> These are **not** the models the app serves. The served Davis model is a two-seed,
> 400-epoch ensemble on fold 0 (test MSE 0.622). This page measures the plain Phase 4
> recipe, because that is what can be compared across folds and with the paper.

## Davis

| Fold | Test MSE | Test CI | Best epoch | Protein rank | Test compounds |
|---|---|---|---|---|---|
| 0 (Phase 4) | 0.716 | 0.622 | 143 | +0.021 | 14 |
| 1 | 0.798 | 0.642 | 58 | +0.052 | 14 |
| 2 | 0.970 | 0.602 | 99 | +0.119 | 14 |
| 3 | 0.778 | 0.543 | 119 | +0.081 | 14 |
| 4 | 0.440 | 0.567 | 149 | +0.062 | 12 |

| | MSE | CI |
|---|---|---|
| **Ours, 5-fold** | **0.740 ± 0.193** | 0.595 ± 0.040 |
| Paper, 5-fold | 0.463 ± 0.013 | 0.638 ± 0.028 |
| Fold 0 alone (what we reported before) | 0.716 | 0.622 |

Within-compound protein rank correlation across folds: **+0.067 ± 0.036**, capturing 17% of the true spread when the protein changes.

## Metz

| Fold | Test MSE | Test CI | Best epoch | Protein rank | Test compounds |
|---|---|---|---|---|---|
| 0 (Phase 4) | 0.762 | 0.634 | 145 | +0.109 | 104 |
| 1 | 1.003 | 0.600 | 148 | +0.078 | 104 |
| 2 | 1.083 | 0.581 | 145 | -0.126 | 133 |
| 3 | 0.828 | 0.622 | 148 | +0.096 | 130 |
| 4 | 0.759 | 0.626 | 141 | +0.129 | 128 |

| | MSE | CI |
|---|---|---|
| **Ours, 5-fold** | **0.887 ± 0.148** | 0.613 ± 0.022 |
| Paper, 5-fold | 0.658 ± 0.016 | 0.675 ± 0.012 |
| Fold 0 alone (what we reported before) | 0.762 | 0.634 |

Within-compound protein rank correlation across folds: **+0.057 ± 0.104**, capturing 21% of the true spread when the protein changes.

## What this changes (2026-11-18)

**1. Fold 0 was an easy fold, and our earlier numbers were flattered by it.**
Davis goes from 0.716 on fold 0 to **0.740** averaged over five;
Metz from 0.762 to **0.887**. Every single-fold figure in this
project should be read with that in mind.

**2. Our fold-to-fold spread is an order of magnitude larger than the paper's.**
Davis ranges from 0.440 to 0.970 (sd 0.193); the paper reports ± 0.013. Metz sd 0.148 against ± 0.016. That is 10-15x wider.
Part of it is their ensemble of three per fold, which averages variance away, and part
may be hyperparameters we do not have. But a gap this size is not fully explained by
either, and we should say so rather than wave it through: under this split protocol,
folds genuinely differ in difficulty, and a tight standard deviation is surprising.

**3. The protein-sensitivity finding survives, and is now measured on five folds
rather than one.**
Davis +0.067 ± 0.036, Metz +0.057 ± 0.104, against a
ceiling of about +0.41. Holding the compound fixed and changing the protein, the
ordering the model produces is still close to chance. This was the weakest-evidenced
claim in the project - 14 compounds on a single fold - and it now rests on all five.

