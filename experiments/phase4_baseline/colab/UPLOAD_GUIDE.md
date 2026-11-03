# Sending the training job to the college (Google Drive + Colab)

The college runs our notebook on their GPU through Google Colab. You put one folder in your Google Drive and share it with them.
Their notebook saves the results straight back into that folder.

## 1. Build the folder (on your laptop)

From `C:\projects\Perceiver_cpi`, in PowerShell:

```
.venv\Scripts\python.exe experiments\phase4_baseline\make_bundle.py
```

This creates `experiments\phase4_baseline\colab_upload\perceiver_cpi_colab\`, which holds three files:
- `Perceiver_CPI_train.ipynb`: the notebook they run;
- `perceiver_gpu_bundle.zip`: the code and data, about 38 MB;
- `README_FOR_COLLEGE.txt`: their instructions.

**Don't rename the folder.** The notebook looks for the name `perceiver_cpi_colab`.

## 2. Upload it to Google Drive

1. Open <https://drive.google.com> and sign in.
2. Click **New → Folder upload**.
3. Choose `C:\projects\Perceiver_cpi\experiments\phase4_baseline\colab_upload\perceiver_cpi_colab` and confirm.
4. Wait until the upload box at the bottom right says it's complete, then open the folder and check that all 3 files are there.

## 3. Share it with the college

1. Right-click the folder **perceiver_cpi_colab** → **Share** → **Share**.
2. Type the college's email address.
3. Set the role to **Editor**. They need Editor access so their notebook can save the results into your folder.
4. Leave "Notify people" ticked, add the message below if you like, and click **Send**.

## 4. Email to send (copy, adjust, sign)

> **Subject:** GPU training job for my project: Perceiver CPI (Google Drive folder shared)
>
> Dear [name],
>
> Thank you for offering GPU time for my project. I have shared the Google Drive folder **perceiver_cpi_colab** with this email address (Editor access).
>
> It contains one Colab notebook, `Perceiver_CPI_train.ipynb`. Steps:
> 1. Add the folder to your own Drive: *Shared with me* → right-click → *Organize* → *Add shortcut* → *My Drive*.
> 2. Open the notebook in Colab.
> 3. Choose a GPU runtime.
> 4. Click *Runtime → Run all*.
>
> It trains three models. On a powerful runtime (6+ CPU cores, e.g. A100/L4/H100), they train at the same time, roughly 5–10 hours in total. The notebook prints a measured estimate after about 5 minutes.
>
> Progress is saved to the folder after every epoch. If the session ends, *Run all* again continues where it stopped. When it prints "ALL DONE", the results (`results_to_copy.zip`) are saved in the same folder automatically, so nothing needs to be sent back. Full details are in `README_FOR_COLLEGE.txt` in the folder.
>
> Please let me know if anything goes wrong; a copy of the error message would help.
>
> Best regards,
> [your name, roll number]

## 5. While they train

- **Don't move, rename or delete anything** in the Drive folder.
- A `runs` folder will appear and grow. That's progress being saved.

## 6. When they say it's done

1. In Google Drive, open **perceiver_cpi_colab** and download **`results_to_copy.zip`** (about 55 MB).
2. Right-click it → **Extract All…** → set the destination to `C:\projects\Perceiver_cpi\experiments\phase4_baseline` → **Extract**.
3. Check that `...\phase4_baseline\runs\davis`, `...\runs\metz` and `...\runs\kiba` exist.
4. Tell Claude: **"the Phase 4 results are copied"**.

## If they report a problem

Ask them for the error text, or a screenshot of the cell that failed, and give it to Claude. The notebook stops with a clear message when something is wrong; for example, it says so if no GPU runtime was selected.
