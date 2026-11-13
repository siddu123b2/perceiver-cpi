# Phase 5 results: does the yardstick matter?

Each experiment trains one model and keeps the epoch with the best validation score.
The two differ almost only in what that validation set measures:

- **A** validates on unseen compounds AND unseen proteins, built like the test set.
- **B** validates on random pairs whose compounds and proteins were all seen in training
  (the Phase 3 / paper style). B trains on ~7% fewer rows; everything else is identical.

| Experiment | What its validation measures | Stopped at epoch | Validation MSE | Test MSE | Test CI |
|---|---|---|---|---|---|
| davis_A | new yardstick: validation is unseen compounds and proteins | 102 of 150 | 0.514 | **0.644** | 0.610 |
| davis_B | control: validation is random pairs, all entities seen | 83 of 150 | 0.425 | **0.697** | 0.574 |
| metz_A | new yardstick: validation is unseen compounds and proteins | 81 of 150 | 0.727 | **0.759** | 0.655 |
| metz_B | control: validation is random pairs, all entities seen | 146 of 150 | 0.532 | **0.719** | 0.640 |

> The validation MSE columns are **not comparable between A and B**: they are measured
> on different sets. A validates on a harder, unseen-entity set, so its number is
> expected to be higher even if its model is better. Compare the test column.

## Against Phase 4 and the paper

| Dataset | Phase 4 test MSE | Phase 5 A | Phase 5 B | Paper (5-fold) |
|---|---|---|---|---|
| Davis | 0.716 | 0.644 | 0.697 | 0.463 |
| Metz | 0.762 | 0.759 | 0.719 | 0.658 |

Phase 4 trained on more rows than either run here (novel-pair validation wastes the
mixed pairs), so a Phase 5 run matching Phase 4 is already an improvement per training row.

## Honest note on the test set

Training never saw the test set and no hyperparameter was tuned on it. But choosing
between A and B by reading the test column above does spend one look at it. This was a
single pre-planned comparison over two datasets, and both results are reported whatever
they show. Later phases should keep judging on validation.
