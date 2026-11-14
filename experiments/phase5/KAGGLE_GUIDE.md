# Running Phase 5 on Kaggle (free GPU)

Kaggle gives about **30 GPU hours every week**, free, in your own account. Our Phase 5 experiments
need roughly 3–5 hours of that, so you can run them whenever you like without asking anyone.

You only do steps 1–3 **once**. After that, running a new experiment is just "Run All" again.

---

## 1. Build the upload files (on your laptop)

From `C:\projects\Perceiver_cpi`, in PowerShell:

```
.venv\Scripts\python.exe experiments\phase5\make_kaggle_dataset.py
```

This fills `experiments\phase5\kaggle_upload\` with two files:

- `perceiver_cpi_data.zip` — the code and the data, about 47 MB
- `Perceiver_CPI_phase5.ipynb` — the notebook

## 2. Make a Kaggle account and upload the data

1. Go to <https://www.kaggle.com> and sign up (free; a Google account works).
2. **Verify your phone number.** Profile picture → *Settings* → *Phone verification*.
   **Without this Kaggle will not give you a GPU**, so don't skip it.
3. Go to <https://www.kaggle.com/datasets> → **New Dataset**.
4. Drag in `perceiver_cpi_data.zip`. Kaggle unzips it for you.
5. Name it **`perceiver cpi data`** and click **Create**.
6. Wait for it to finish processing (a minute or two).

## 3. Upload the notebook

1. Go to <https://www.kaggle.com/code> → **New Notebook** → **File** → **Import Notebook**.
2. Choose `Perceiver_CPI_phase5.ipynb`.

## 4. Attach the data and the GPU

In the notebook, on the right-hand panel:

1. **Add Input** → **Datasets** → search **perceiver cpi data** → **Add**.
2. **Settings** → **Accelerator** → **GPU T4 x2**.
3. **Settings** → **Persistence** → **Files only** — this keeps your results if the session restarts.

## 5. Run it

Click **Run All**.

- Cell 3 does a 2-minute check and stops with a clear message if anything is wrong.
- Cell 4 is the real training, about **3–5 hours**.
- Cell 5 prints the comparison table.

**You can close the browser.** Click **Save Version** → **Save & Run All (Commit)** instead, and
Kaggle runs it on its own servers in the background. You'll get an email when it's done. This is the
better way for a long run.

## 6. Send the results to Claude

When it finishes, open the notebook's **Output** tab on the right.

- Download **`results.md`** and send it to Claude, or just copy the table from cell 5.
- If Claude asks for more, download the whole `runs` folder too.

---

## If the session stops before it finishes

Nothing is lost. Kaggle saves everything in `/kaggle/working` as the version's output.

1. Click **Save Version** so the part-finished work is stored.
2. Start the notebook again, and this time also **Add Input** → **Your Work** → **Notebooks** →
   pick this notebook's output.
3. **Run All.** Cell 1 finds the saved progress and carries on from the last finished epoch;
   finished experiments are skipped.

## Troubleshooting

| What you see | What to do |
|---|---|
| "Could not find the project data" | You forgot **Add Input**. See step 4, then Run All again. |
| "No GPU found" / torch says GPU: NONE | Set **Settings → Accelerator → GPU T4 x2**. If the option is greyed out, verify your phone number (step 2). |
| "GPU quota exceeded" | You've used your ~30 hours this week. It resets weekly; check the usage meter on the right. |
| The session stops after 12 hours | Normal — that's Kaggle's limit. Follow "If the session stops" above. |
| Anything else | Copy the last 30 lines of the failing cell and send them to Claude. |

## Notes

- **Nothing here touches your Google Drive or the college's machine.** This is entirely your own
  Kaggle account.
- KIBA is deliberately **not** in these experiments: it alone costs about 4× the other two. Once we
  know which approach wins, we run it on KIBA.
- The test set is never used for training or for choosing settings. See the note at the top of
  `run_experiment.py`.

---

# Step B: does a pretrained protein encoder help?

The notebook for this is **`Perceiver_CPI_stepB.ipynb`**, in the same `kaggle_upload` folder.

This one runs in **two sessions**, about 5–6 hours each. Together they answer whether swapping the
protein encoder makes the model actually read the protein.

## Once, before you start

Re-upload the dataset, because it now contains two extra scripts:

1. Run `make_kaggle_dataset.py` on your laptop (or ask Claude to).
2. On Kaggle, open your **perceiver cpi data** dataset → **New Version** → drop in the new
   `perceiver_cpi_data.zip` → **Create**.

## Session 1 — the baseline

1. **New Notebook** → **File → Import Notebook** → `Perceiver_CPI_stepB.ipynb`
2. **Add Input** → your `perceiver cpi data` dataset
3. **Accelerator** → **GPU T4 x2**, **Persistence** → **Files only**
4. In cell 1, leave `GROUP = 'baseline'`
5. **Save Version → Save & Run All (Commit)**, then close the browser

## Session 2 — the ESM version

1. Open the same notebook again
2. Change cell 1 to `GROUP = 'esm'`
3. **Add Input** → **Your Work** → **Notebooks** → attach **this notebook's own output** from
   session 1. That is what lets it skip the runs already done.
4. **Save Version → Save & Run All (Commit)** again

## When both are done

Send Claude the output (the `kaggle kernels output ...` command at the bottom of the Output tab is
the easiest way).

**The number to look at is protein ranking.** Our models have been at 0.00, meaning that when you
keep the drug and change the protein, the model's ordering is no better than guessing. The best
achievable is about +0.41. Anything clearly above zero is real progress.

## Notes

- Only Davis is used here. Metz and KIBA come after we know whether this works.
- The ESM session spends its first few minutes working out each protein's features. That is normal,
  and it only happens once per session.
- If a session runs out of time, nothing is lost: attach its output and run again.

## If session 2 stopped in cell 3 (`Building the ESM features failed`)

Two bugs in our own code, both found and fixed on 2026-11-14 from the failed run's log. Nothing you
did was wrong, and no GPU time was lost — it stopped after 54 seconds.

1. `make_esm_bank.py` looked for the data in the repo's folder layout, not the flat one inside the
   Kaggle bundle, so it reported `no fold-0 split files under /kaggle/data/splits/...`.
2. Cell 1 searched only one folder deep for a previous session's results, but Kaggle mounts inputs
   three deep. So **Add Input → Your Work → Notebooks** had no effect and nothing was carried over.

`protein_sensitivity.py` had the same path bug as (1) and would have failed in cell 6 as well.

**To pick up the fixes:** re-run `make_kaggle_dataset.py`, upload a **New Version** of the
`perceiver cpi data` dataset, re-import `Perceiver_CPI_stepB.ipynb`, then run session 2 again.
Cell 1 now prints `Carried over N earlier run(s).` so you can see at a glance whether it worked.
