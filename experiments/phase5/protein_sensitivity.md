# Can the model tell proteins apart?

Overall MSE and CI can look reasonable while a model is really predicting one number per
compound. The app needs the answer to depend on the protein too, so this measures exactly
that: hold the compound fixed, vary the protein.

Over test compounds appearing with at least 5 proteins.

| Run | Test MSE | True spread | Our spread | Spread captured | Rank correlation within a compound |
|---|---|---|---|---|---|
| Phase 4 Davis | 0.716 | 0.70 | 0.11 | 16% | **+0.021** |
| Phase 5 davis_A | 0.644 | 0.70 | 0.12 | 17% | **-0.050** |
| Phase 5 davis_B | 0.697 | 0.70 | 0.14 | 20% | **-0.066** |
| Phase 4 Metz | 0.762 | 0.59 | 0.22 | 37% | **+0.109** |
| Phase 5 metz_A | 0.759 | 0.59 | 0.15 | 26% | **-0.005** |
| Phase 5 metz_B | 0.719 | 0.59 | 0.11 | 19% | **-0.070** |

## What this says

**The rank correlations are indistinguishable from zero, and some are negative.** Within a
single compound, the order in which our models rank proteins is no better than shuffling
them. The models move only 16-37% as far as they should when the protein changes.

So the models behave close to "one number per compound". That matches the Step 0 finding
that compound identity drives 69-95% of our predictions and protein identity only 3-14%.

**This is the thing that matters for the app.** A user picks a drug *and* a protein. If the
answer barely depends on the protein, the tool cannot do its job, however good the overall
MSE looks.

**It also means overall MSE and CI hide the problem.** A per-compound average scores
respectably on both, because different compounds really do have different average
affinities. Phase 5 davis_A improved MSE (0.716 to 0.644) while its protein sensitivity
got *worse* (rank correlation +0.021 to -0.050). Optimising MSE alone is steering us away
from what the app needs.

**Keep this metric alongside MSE from now on.**
