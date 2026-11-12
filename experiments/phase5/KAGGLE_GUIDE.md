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
