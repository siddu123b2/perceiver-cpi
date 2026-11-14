# Can the model tell proteins apart?

Overall MSE and CI can look reasonable while a model is really predicting one number per
compound. The app needs the answer to depend on the protein too, so this measures exactly
that: hold the compound fixed, vary the protein.

Over test compounds appearing with at least 5 proteins.

| Run | Test MSE | True spread | Our spread | Spread captured | Rank correlation within a compound |
|---|---|---|---|---|---|
| Phase 4 davis | 0.716 | 0.70 | 0.11 | 16% | **+0.021** |
| Phase 4 metz | 0.762 | 0.59 | 0.22 | 37% | **+0.109** |
| Phase 4 kiba | 0.575 | 0.45 | 0.15 | 33% | **-0.067** |
| davis_A | 0.644 | 0.70 | 0.12 | 17% | **-0.050** |
| davis_B | 0.697 | 0.70 | 0.14 | 20% | **-0.066** |
| metz_A | 0.759 | 0.59 | 0.15 | 26% | **-0.005** |
| metz_B | 0.719 | 0.59 | 0.11 | 19% | **-0.070** |

## What this said at Step 1 (2026-11-13)

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

## How much room is there, and how much of it needs the protein?

Each "perfect" column uses the test labels, so it is a ceiling nothing can reach, not a
target. Lower is better throughout.

| Dataset | Our best | Guess the average | Perfect compound-only | Perfect compound + protein | Paper |
|---|---|---|---|---|---|
| Davis | 0.644 | 0.749 | 0.541 | 0.420 | 0.463 |
| Metz | 0.719 | 0.849 | 0.332 | 0.326 | 0.658 |

Two things follow.

**On Davis the protein genuinely matters, and the paper is using it.** Knowing the protein
as well as the compound moves the ceiling from 0.541 to 0.420. The paper scores 0.463,
which is *better than any compound-only model could ever be* (0.541). Ours is 0.644, worse
than that ceiling. So the paper really does read the protein and we really do not.

**On Metz almost all the signal is in the compound.** The ceiling barely moves when the
protein is added (0.332 to 0.326). Yet we score 0.719, miles above 0.332, so our compound
modelling alone has a lot of room. Metz is the wrong dataset to judge protein work on.

**We are below the compound-only ceiling on both datasets**, so part of the gap needs no
protein breakthrough at all.
