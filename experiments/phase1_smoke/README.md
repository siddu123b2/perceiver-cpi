# Phase 1 smoke test (2026-10-29)

**Goal:** prove the official code trains and predicts in our environment (Python 3.12, PyTorch 2.15 CPU, Windows).
This is *not* a measure of accuracy: the toy set has only 5 train, 4 validation and 4 test rows.

## Commands (run from `model_2d/`)

Train: the repo README's example settings (150 epochs, ensemble of 3), plus a fixed seed.

```
../.venv/Scripts/python.exe train.py --data_path ./toy_dataset/novel_pair_0_train.csv --separate_val_path ./toy_dataset/novel_pair_0_val.csv --separate_test_path ./toy_dataset/novel_pair_0_test.csv --metric mse --dataset_type regression --save_dir ../experiments/phase1_smoke/toy_ckpt --target_columns label --epochs 150 --ensemble_size 3 --num_folds 1 --batch_size 50 --aggregation mean --dropout 0.1 --save_preds --seed 0
```

Predict with the saved ensemble:

```
../.venv/Scripts/python.exe predict.py --test_path ./toy_dataset/novel_pair_0_test.csv --checkpoint_dir ../experiments/phase1_smoke/toy_ckpt --preds_path ../experiments/phase1_smoke/toy_preds.csv
```

(Add `--num_workers 0` on Windows: identical predictions, about 30× faster. See `model_2d/CHANGES.md`.)

## Results

- Training: 3 models × 150 epochs in 43 s on CPU. Ensemble test MSE 0.034, CI 0.667 (4 test rows, so meaningless as accuracy).
- Prediction: `predict.py` loaded the 3 checkpoints and wrote `toy_preds.csv`:

| Protein | True pKd | Predicted |
|---|---|---|
| AURKA | 5.000 | 5.116 |
| CAMK1D | 5.357 | 5.426 |
| CSNK1D | 5.602 | 5.433 |
| CSNK1E | 5.398 | 5.101 |

- Reproducibility: two runs with `--seed 0` agreed to within 1.2e-7 (float rounding from multi-threaded CPU maths).

## Files

`toy_ckpt/args.json` (full config), `toy_ckpt/verbose.log` (training log), `toy_ckpt/test_scores.csv`, `toy_preds.csv`.
The model weights (`model.pt`, 18.7 MB each) and TensorBoard event files are not in git; re-run the command to rebuild them.
