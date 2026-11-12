# Phase 5 Step 0: why the baselines barely beat guessing

From the Phase 4 predictions only. Nothing retrained; the test set is read for reporting, not tuning.

## 1. Almost all the error is on the real binders

Rows are split by the label-weighting range: inside it are the crowded "weak or no binding"
labels, outside it are the stronger binders.

| Dataset | Group | Rows | MSE | Share of all error | Mean true | Mean predicted |
|---|---|---|---|---|---|---|
| Davis | weak / no binding | 755 (66%) | 0.115 | 11% | 5.00 | 5.26 |
| Davis | real binders | 393 (34%) | 1.870 | 89% | 6.41 | 5.37 |
| Kiba | weak / no binding | 3,258 (74%) | 0.196 | 25% | 11.48 | 11.59 |
| Kiba | real binders | 1,165 (26%) | 1.635 | 75% | 12.09 | 11.70 |

Metz has no weighting, so it is not split here.

The models are near-perfect on the "no binding" rows and badly wrong on the binders, which
carry most of the error. **They fail exactly where a user cares.** The mean predicted column
shows why: the answers barely move between the two groups.

## 2. The models mostly ignore the protein

Share of the variation explained by which compound it is, versus which protein it is.

| Dataset | Compound (our predictions) | Compound (truth) | Protein (our predictions) | Protein (truth) |
|---|---|---|---|---|
| Davis | 69% | 28% | 13% | 16% |
| Kiba | 85% | 50% | 9% | 18% |
| Metz | 87% | 61% | 9% | 11% |

The models answer mostly according to **which drug** it is, and barely change their answer
for **which protein** they are asked about. Protein identity drives 9-13% of our predictions
but 11-18% of the truth, and compound identity drives far more of ours than of the truth.
For the app this matters: a user picks a drug *and* a protein, and the protein is being
close to ignored.

## 3. Truncation does not explain it (tested, and it does not hold up)

The model reads only the first 499 residues. If losing the tail were the cause,
proteins longer than that should be clearly worse. They are not.

| Dataset | Proteins cut off | MSE, fully seen | MSE, cut off | Cut-off vs fully seen |
|---|---|---|---|---|
| Davis | 52/76 | 0.832 | 0.656 | 0.79x |
| Kiba | 32/46 | 0.534 | 0.590 | 1.10x |
| Metz | 24/33 | 0.741 | 0.770 | 1.04x |

Davis is **better** on the cut-off proteins, KIBA and Metz only ~1.1x worse. If truncation
were crippling the protein branch we would expect a large and consistent penalty.

This is a comparison between *different* proteins, so family and label range differ as well;
it is suggestive, not a controlled experiment. But it is clearly not the main cause, so the
kinase-domain idea drops down the Phase 5 list rather than leading it.
