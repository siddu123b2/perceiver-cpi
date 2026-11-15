# Model card: metz

**Serves:** `/predict` with `model=metz`.
**Predicts:** pKi. Higher means stronger binding.

## Where it came from

Phase 4 baseline, 150 epochs, single model. Source runs:

- `experiments/phase4_baseline/runs/metz` -> `model_0.pt`

Phase 5 Step 1 trained two more Metz models, but they differ in how the validation set was built rather than in quality, so choosing between them would have meant choosing on the test score. Step C replaces this with a 400-epoch two-seed ensemble.

## How it was trained

- Architecture: Perceiver CPI exactly as published (Nguyen et al. 2023, Bioinformatics 39(1),
  btac731). Our only code changes are compatibility fixes plus two optional flags, all listed in
  `model_2d/CHANGES.md`; this model uses the defaults.
- Data: `data/metz.csv`, split **novel pair, fold 0** - the test set shares no compound and no
  protein with training. This is the hardest and most realistic setting: a new drug against a new
  protein.
- Settings: the repo's published ones (batch size 50, dropout 0.1, mean aggregation, LAMB), label
  weighting per the paper (CLAUDE.md decisions D1/D2), no label scaling.

## How good it is, honestly

| | This model | Paper (5-fold, ensemble of 3) | Always guess the training average |
|---|---|---|---|
| Test MSE | **0.762** | 0.658 | 0.910 |
| Test CI | 0.634 | 0.675 | - |

**It is worse than the published paper.** We trained one fold instead of five and, for Metz and
KIBA, a single model instead of an ensemble of three, and the paper's hyperparameters were tuned by
Bayesian optimisation and never published. The comparison is therefore indicative, not like for like.

**Two limitations that matter when reading a prediction:**

1. **The model is much better at telling compounds apart than proteins.** Hold a compound fixed and
   vary the protein, and the ordering it produces is close to random (`experiments/phase5/
   protein_sensitivity.md`). Treat a change of protein with more caution than a change of compound.
2. **The +/- is not a confidence interval.** It is the spread of 30 predictions made with dropout
   left on. It tracks real error only loosely, and on Davis the true value falls inside +/-2 spread
   about 33-63% of the time, not 95%. The app shows it as a relative low/medium/high label for that
   reason.

## Scope

Trained on kinase inhibitors and kinase sequences. A compound or protein far outside that family is
out of scope, and the answer should not be trusted; `/predict` warns when the protein is unlike the
training proteins.
