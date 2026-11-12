# Phase 4 results: baseline, one model per dataset

Written by `evaluate.py` on 2026-11-12. Trained on the college GPU (NVIDIA L4, 2.14.1+cu130 (CUDA 13.0)).

## How to read this

Each model was trained **once**, on **fold 0** of the novel-pair split, with **no ensemble**.
The paper averaged **5 folds**, each an **ensemble of 3** models. So our numbers are expected to be
a little worse, and the comparison is **not exact**. Lower MSE is better; higher CI, Pearson,
Spearman and rm2 are better. Never compare scores between datasets: each uses its own scale.

## Our numbers next to the paper

| Dataset | Our MSE | Paper MSE (5-fold) | Our CI | Paper CI (5-fold) |
|---|---|---|---|---|
| Davis | 0.716 | 0.463 ± 0.013 | 0.622 | 0.638 ± 0.028 |
| Kiba | 0.575 | 0.522 ± 0.010 | 0.565 | 0.638 ± 0.013 |
| Metz | 0.762 | 0.658 ± 0.016 | 0.634 | 0.675 ± 0.012 |

## All metrics

| Dataset | Unit | Test rows | MSE | RMSE | MAE | CI | Pearson | Spearman | rm² |
|---|---|---|---|---|---|---|---|---|---|
| Davis | pKd | 1,148 | 0.716 | 0.846 | 0.541 | 0.622 | 0.301 | 0.244 | 0.089 |
| Kiba | KIBA score | 4,423 | 0.575 | 0.758 | 0.545 | 0.565 | 0.240 | 0.179 | 0.038 |
| Metz | pKi | 1,290 | 0.762 | 0.873 | 0.682 | 0.634 | 0.404 | 0.378 | 0.123 |

## Is the model actually learning? (honest check)

A model that ignores its inputs and always answers the training average still scores a
certain MSE. Any useful model must beat it.

| Dataset | Our MSE | Always guess the average | Better? | Spread of true labels | Spread of our predictions |
|---|---|---|---|---|---|
| Davis | 0.716 | 0.751 | +5% | 0.87 | 0.24 |
| Kiba | 0.575 | 0.553 | **-4% (worse)** | 0.74 | 0.43 |
| Metz | 0.762 | 0.910 | +16% | 0.92 | 0.60 |

Two things stand out, and both say the same thing:

1. The models barely beat the average, and on KIBA the model is **worse** than it.
2. Our predictions vary much less than the real labels. The models are playing safe and
   answering close to the average instead of committing to high or low values.

So these baselines are weak. They are a real, reproducible starting point, not a working predictor yet.

## Training

| Dataset | Best epoch (of 150) | Validation MSE | Test MSE | Gap | Resumes |
|---|---|---|---|---|---|
| Davis | 143 | 0.414 | 0.716 | +0.302 | 2 |
| Kiba | 140 | 0.265 | 0.575 | +0.310 | 4 |
| Metz | 145 | 0.436 | 0.762 | +0.326 | 2 |

The model kept is the epoch with the lowest validation MSE, not the last epoch.
The test set was used once, for the numbers above.

**The validation score is far better than the test score on all three.** That is the novel-pair
setting doing its job: validation contains compounds and proteins the model saw in training,
while the test set contains only ones it has never seen. The models learned the training
compounds and proteins well, but that knowledge does not carry over to new ones.

## Does the ± confidence mean anything?

The ± is the spread of 30 predictions made with dropout left on (MC dropout). For it to be
worth showing a user, a bigger ± must mean a bigger mistake.

| Dataset | Avg error, most-confident 25% | Avg error, least-confident 25% | Rank agreement | True label inside ±2 spread |
|---|---|---|---|---|
| Davis | 0.356 | 0.781 | +0.388 | 53% |
| Kiba | 0.515 | 0.617 | +0.078 | 63% |
| Metz | 0.664 | 0.689 | +0.028 | 33% |

**It works on Davis and not on the other two.** On Davis the predictions the model flags as
uncertain really are about twice as wrong, so the ± is a useful warning. On KIBA and Metz the
rank agreement is near zero: the ± says almost nothing about whether the answer is right.

**And on all three the ± is far too small.** An honest ± would put the true label inside
±2 spread about 95% of the time; ours manages 33-63%. MC dropout only measures how much the
answer wobbles when parts of the network are switched off. It cannot see the larger problem
above, that the model does not generalise to unseen compounds and proteins, so the model can
be confidently wrong.

**Phase 6 rule that follows: do not present this ± as a 95% confidence interval.** Either show
it as a relative "high / medium / low confidence" label, or calibrate it first, fitting the
calibration on the **validation** set and never the test set. The coverage above is reported,
not tuned against.

## Why we are behind the paper, and what to try next

Honest reasons, most likely first:

1. **No ensemble.** The paper averages 3 models per fold; we trained 1. Averaging removes some
   of each model's random error.
2. **One fold, not 5.** Fold 0 may be harder than average. The paper reports the mean of 5.
3. **Hyperparameters.** The paper tuned theirs with Bayesian optimisation but does not publish
   the values, so we used the repo README settings.
4. **Training was still improving.** On Davis and Metz the validation MSE was still falling at
   epoch 150, so the runs were stopped too early. KIBA had levelled off by about epoch 90.

Candidates for Phase 5, one at a time, judged on validation only:

- train longer than 150 epochs (Davis and Metz had not finished improving);
- train an ensemble of 3, as the paper does;
- the protein-truncation ideas already in CLAUDE.md (only the first 499 residues are read).
