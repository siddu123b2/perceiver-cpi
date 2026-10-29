# Training Perceiver CPI on a borrowed NVIDIA laptop

This folder trains **three models**: one each for Davis, Metz and KIBA. Each one trains on fold 0 of the novel-pair split.
You don't need to know any programming. You'll copy commands into a window, press Enter, and wait.

**Time:** about 1 hour of setup, then roughly **10–16 hours of training** (`check_setup.py` tells you the real figure).
The training doesn't have to happen in one go. You can stop and continue as often as you like.

---

## What you need

- The borrowed laptop:
  - Windows 10 or 11;
  - an **NVIDIA RTX 4050 or 3050** GPU;
  - about **8 GB of free disk space**;
  - its **charger**.
- **The owner's OK** to install Python, and possibly to update the NVIDIA driver (step 3).
- An internet connection. The installation downloads about 3 GB.
- A way to move files between laptops: a **USB stick**, or Google Drive / OneDrive.
- The file `perceiver_gpu_bundle.zip`, from `experiments\phase4_baseline\` on your own laptop.

---

## Step 1: Copy the bundle to the borrowed laptop

1. Copy `perceiver_gpu_bundle.zip` to the borrowed laptop's **Desktop**, using the USB stick or a cloud drive.
2. Right-click the zip → **Extract All…** → **Extract**.
3. You should now have a folder **`perceiver_gpu`**, containing this file, `check_setup.py`, `train_all.py`, and the folders `model_2d` and `data`.
   - If Windows created a folder inside another folder (`perceiver_gpu_bundle\perceiver_gpu`), use the inner one.

## Step 2: Open PowerShell in that folder

1. Open the `perceiver_gpu` folder in File Explorer.
2. Click the **address bar** at the top, where the folder path is shown.
3. Type `powershell` and press **Enter**.

A blue or black window opens. **All commands below go into this window.** Copy a command, right-click in the window to paste it, and press Enter.

## Step 3: Check the NVIDIA driver

Type:

```
nvidia-smi
```

**Good:** a table appears that shows your GPU (e.g. "NVIDIA GeForce RTX 4050 Laptop GPU"). At the top right it says **`CUDA Version: 13.0`** or higher. Go to step 4.

**Not good:** you see "not recognized", or `CUDA Version` is below 13.0 (e.g. 12.4). Then update the driver:
1. Ask the owner first.
2. Go to <https://www.nvidia.com/en-us/drivers/> and choose:
   - Product Type **GeForce**;
   - Series **GeForce RTX 40 Series (Notebooks)**, or **RTX 30 Series (Notebooks)** for a 3050;
   - your GPU and your Windows version.
3. Click **Find**, then download and install. Choose "Express installation".
4. Restart the laptop, then do steps 2–3 again.

**Do not install the "CUDA Toolkit".** It isn't needed: the PyTorch download already contains what it needs.

## Step 4: Install Python 3.12

1. Go to <https://www.python.org/downloads/windows/>.
2. Find the newest **Python 3.12.x** and click **"Windows installer (64-bit)"**. It must be **3.12**, not 3.13 or 3.14.
3. Run the downloaded file. On the first screen, **tick "Add python.exe to PATH"**, then click **Install Now**.
4. **Close the PowerShell window and open a new one** (step 2), then type:

```
py -3.12 --version
```

It should say `Python 3.12.something`.

## Step 5: Create the environment and install the packages

Run these three commands one at a time, and wait for each to finish. The last one downloads about 3 GB and can take **10–30 minutes**.

```
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r model_2d\requirements-gpu.txt
```

The last command should end with "Successfully installed …". A yellow "WARNING" line is fine; a red "ERROR" line is not (see Troubleshooting).

## Step 6: Check that everything works

```
.venv\Scripts\python.exe check_setup.py
```

This takes about **5 minutes**. It checks Python, the data files, the packages and the GPU, then trains for 1 epoch to measure the speed.
It should end with a time estimate and **`ALL CHECKS PASSED`**.

**Please send Claude the last 8 lines** (the estimate), with a photo or by copying them.

## Step 7: Get the laptop ready for a long run

- **Plug in the charger.** On battery the GPU runs much slower.
- Go to **Settings → System → Power & battery → Screen and sleep**. Set **"When plugged in, put my device to sleep after"** to **Never**.
  - The training script also asks Windows not to sleep, but this setting makes sure.
- **Don't close the lid**, because that can put the laptop to sleep. The screen switching off is fine.
- Close games and other heavy programs.

## Step 8: Train

```
.venv\Scripts\python.exe train_all.py
```

The script trains **Davis → Metz → KIBA**, one after another. For each one you'll see a progress bar like:

```
 37%|███▋      | 56/150 [1:02:13<1:44:20, 66.6s/it]
```

How to read it: 56 of 150 epochs are done, it has run for 1 h 02 min so far, and about 1 h 44 min are left for this dataset.

**Stopping and continuing is safe.** That covers pressing **Ctrl+C**, the laptop restarting, or a power cut. To continue:
1. Open PowerShell in the folder (step 2).
2. Run the same command again.

It picks up from the last finished epoch and skips datasets that are already done. You lose at most one epoch, a few minutes of work.

You can also train one dataset at a time, e.g. `.venv\Scripts\python.exe train_all.py davis`.

When everything has finished, it prints **`ALL DONE`**.

## Step 9: Pack the results

```
.venv\Scripts\python.exe pack_results.py
```

This creates **`results_to_copy.zip`** (about 60 MB) in the `perceiver_gpu` folder. It holds:
- the three trained models;
- their test predictions and logs;
- a file listing the GPU and package versions that were used.

## Step 10: Copy the results to your own laptop

1. Copy `results_to_copy.zip` to your own laptop, using the USB stick or a cloud drive.
2. On your own laptop, right-click it → **Extract All…**. Set the destination to:

   ```
   C:\projects\Perceiver_cpi\experiments\phase4_baseline
   ```

   Then click **Extract**.
3. Check that the folders `...\phase4_baseline\runs\davis`, `...\runs\metz` and `...\runs\kiba` now exist.
4. Tell Claude: **"the Phase 4 results are copied"**. Claude then computes all the metrics, the MC-dropout ±, and the comparison with the paper.

## Step 11: Tidy up the borrowed laptop

Only do this **after** checking that the results are safely on your own laptop.
- Delete the `perceiver_gpu` folder on the borrowed laptop (about 6 GB).
- If the owner wants, uninstall Python 3.12 in **Settings → Apps → Installed apps**.

---

## Troubleshooting

| What you see | What to do |
|---|---|
| `py` is "not recognized" | Close PowerShell and open a new one. If it still fails, reinstall Python with **"Add python.exe to PATH"** ticked. |
| `nvidia-smi` is "not recognized" | Install or update the NVIDIA driver (step 3), then restart. |
| `check_setup.py` says "PyTorch cannot see the NVIDIA GPU" | Update the driver (step 3) and restart. If it still fails, see the last row of this table. |
| `check_setup.py` says "the CPU-only PyTorch is installed" | Run the last command of step 5 again, exactly as written (`requirements-gpu.txt`). |
| A file is "missing or damaged" | Delete the `perceiver_gpu` folder and extract the zip again. |
| `CUDA out of memory` | Close other programs (games, video, browsers with many tabs) and run `train_all.py` again. This model is small, so it shouldn't happen. If it does, tell Claude. |
| The laptop went to sleep or restarted | Normal. Open PowerShell in the folder and run `train_all.py` again; it continues. |
| You can't update the driver (the owner says no), and `nvidia-smi` shows CUDA Version 12.6 or higher | Install the older CUDA 12.6 build instead: `.venv\Scripts\python.exe -m pip install torch==2.14.1 --index-url https://download.pytorch.org/whl/cu126`. Then run `check_setup.py` again, and **tell Claude** (the report must mention it). |
| Anything else | Copy the last 30 lines of the window and send them to Claude. |
