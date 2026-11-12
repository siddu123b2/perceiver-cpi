# Novel-pair validation sets (Phase 5)

Built by `data/make_novel_val.py`. Whole compounds and whole proteins are held out, so the
validation set contains nothing the model saw in training, exactly like the test set.
The Phase 3 files are unchanged and the test set was not involved.

Held out: the last 20% of training compounds and the last 20% of training proteins,
sorted alphabetically (the same deterministic rule the repo uses for folds).

## Run A: the new yardstick

| Dataset | Rows available | Training (train2) | Novel validation | Unused | Test (for scale) |
|---|---|---|---|---|---|
| Davis | 19,440 | 12,144 | 840 | 6,456 | 1,148 |
| Kiba | 76,728 | 51,480 | 2,641 | 22,607 | 4,423 |
| Metz | 23,281 | 14,831 | 954 | 7,496 | 1,290 |

## Run B: the control (same size validation, seen compounds and proteins)

Random pairs taken out of train2, keeping identical smiles+sequence rows together.
Training is ~7% smaller than run A, so the two runs differ almost only in what the
validation set measures.

| Dataset | Training (train3) | Random validation |
|---|---|---|
| Davis | 11,304 | 840 |
| Kiba | 48,839 | 2,641 |
| Metz | 13,877 | 954 |

Every check passed: no compound and no protein is shared between the new training set
and the novel validation set, and neither overlaps the test set.
