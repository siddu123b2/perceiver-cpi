# Step B: does a pretrained protein encoder help?

Four Davis runs, 400 epochs each, same split (`train2` train / `novelval` validation),
two seeds per group. The only difference between the groups is the protein encoder.

**Judged on validation.** `novelval` holds compounds and proteins that training never saw,
built the same way as the test set. The test numbers below are reported, not used to
choose. "Protein rank correlation" holds the compound fixed, varies the protein, and asks
whether the model orders those proteins correctly; 0.00 means no better than shuffling.

## Validation - what the decision rests on

| Run | Validation MSE | Best epoch | Protein spread captured | Protein rank correlation |
|---|---|---|---|---|
| davis_base_s0 | 0.511 | 80 | 20% | **+0.021** |
| davis_base_s1 | 0.511 | 133 | 12% | **+0.065** |
| davis_esm_s0 | 0.505 | 139 | 29% | **+0.074** |
| davis_esm_s1 | 0.466 | 109 | 31% | **+0.165** |

| Group, mean of 2 seeds | Validation MSE | Protein rank correlation |
|---|---|---|
| paper encoder (learned) | 0.511 | **+0.043** |
| ESM-2 encoder | 0.485 | **+0.119** |

The ceiling for protein ranking on this validation set is **+0.231**: what a model that knew every protein's true average affinity would score. Everything above that is compound-protein interaction, which no per-protein term can reach.

## Test - reported, not used to choose

| Run | Test MSE | Test CI | Protein spread captured | Protein rank correlation |
|---|---|---|---|---|
| davis_base_s0 | 0.646 | 0.606 | 22% | **-0.036** |
| davis_base_s1 | 0.640 | 0.632 | 18% | **+0.035** |
| davis_esm_s0 | 0.753 | 0.598 | 33% | **+0.055** |
| davis_esm_s1 | 0.715 | 0.603 | 29% | **+0.039** |

| Group, mean of 2 seeds | Test MSE | Protein rank correlation |
|---|---|---|
| paper encoder (learned) | 0.643 | **-0.000** |
| ESM-2 encoder | 0.734 | **+0.047** |

Ceiling for protein ranking on the test set: **+0.414**.

For context, earlier runs on the same split with the learned encoder: davis_A
(150 epochs) test MSE 0.644, protein rank -0.050; Phase 4 (150 epochs, paper-style
validation) 0.716 and +0.021. The paper reports 0.463 MSE on Davis novel pair,
5-fold with an ensemble of 3.

## Reading (2026-11-15)

**ESM moves protein ranking off zero, and this is the first thing in Phase 5 that has.**
Validation +0.043 to +0.119, test -0.000 to +0.047. Both seeds move the same way on both splits, and the two groups do not overlap: the worse
ESM seed still beats the better baseline seed. Spread captured rises the same way, from
16% to 30% on validation and 20% to 31% on test.

**But ESM costs accuracy on the test set.** Test MSE 0.643 to 0.734, again with
no overlap between the groups. Validation MSE says the opposite (0.511 to 0.485), and the
test set should be believed on this one: training keeps the epoch with the best validation
MSE, so validation MSE is the number we optimised and is biased low. Test MSE is not.
The rank-correlation finding does not have that problem, because nothing selected for it,
and validation and test agree on it.

**It is a partial fix, as the Step A feasibility check predicted.** 11% of the test ceiling (+0.047 of +0.414), and the model still
moves only about a third as far as it should when the protein changes. Useful, not solved.

**Sample sizes are small - treat the exact values as rough.** The rank correlation averages
over 10 compounds on validation and 14 on test, and each
group is 2 seeds. The direction is consistent across 4 independent comparisons
(2 splits x 2 seeds), which is what makes it believable; the precise numbers are not.

