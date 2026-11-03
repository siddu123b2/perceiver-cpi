PERCEIVER CPI - TRAINING JOB (student project)
==============================================

WHAT IT DOES
Trains 3 regression models (Perceiver CPI, Nguyen et al., Bioinformatics 2023) that predict how
strongly a drug-like compound binds to a protein. There is one model per dataset: Davis, Metz, KIBA.
Each model is trained once, for 150 epochs.

WHAT IS IN THIS FOLDER
  Perceiver_CPI_train.ipynb   the notebook to run (Colab)
  perceiver_gpu_bundle.zip    code + data (about 38 MB); the notebook unpacks it itself
  README_FOR_COLLEGE.txt      this file

HOW TO RUN IT
1. If this folder was shared with you, add it to your own Drive first:
   drive.google.com -> "Shared with me" -> right-click "perceiver_cpi_colab" -> Organize -> Add shortcut -> My Drive.
   (Colab can only see folders in your own Drive.)
2. Open Perceiver_CPI_train.ipynb with Google Colab.
3. Runtime -> Change runtime type -> GPU (the most powerful one available) -> Save.
4. Runtime -> Run all. Allow Google Drive access when asked.
5. Leave it running. Cell 5 prints a measured time estimate after about 5 minutes.
   The model is small, so CPU cores matter as much as the GPU:
   - runtime with 6+ CPU cores (A100 / L4 / H100 class): the 3 models train AT THE SAME TIME on the GPU,
     roughly 5-10 hours in total; with several GPUs each model gets its own;
   - basic runtime (T4, 2 cores): one after another, roughly 15-20 hours.

IF THE SESSION ENDS OR DISCONNECTS
Just choose Runtime -> Run all again. Progress is saved to Drive after every epoch, so:
  - finished datasets are skipped;
  - the dataset in progress continues from its last finished epoch.
You can also stop it on purpose and continue on another day the same way.

WHEN IT IS FINISHED
The last cell prints "ALL DONE". The results are written into this folder:
  results_to_copy.zip   the 3 trained models, test predictions and logs (about 55 MB)
  runs/                 the same, unpacked, plus resume files (about 250 MB; can be deleted afterwards)
Please let the student know. Nothing needs to be emailed: the student can download the zip from this folder.

TECHNICAL NOTES
- Uses Colab's own PyTorch (CUDA). It pip-installs the tested versions of rdkit, numpy, pandas,
  scikit-learn, tape-proteins, etc. into the runtime. Warnings from pip about version conflicts with
  other Colab packages are harmless; all training runs in separate processes.
- Small model, batch size 50: needs little GPU memory (even with the 3 runs sharing one GPU).
  Disk use on Drive is about 300 MB.
- Training the 3 at once (or one after another) does not change the results: each is a separate
  process with the same settings and a fixed seed. On Linux, extra worker processes prepare batches.
- With several GPUs, each run is given one GPU through CUDA_VISIBLE_DEVICES. If CUDA_VISIBLE_DEVICES
  is already set (shared server), only the GPUs listed there are used.
- Fixed random seeds. Settings: 150 epochs, batch 50, dropout 0.1, LAMB optimiser, MSE loss,
  label weighting per dataset as described in the paper.
- Questions: please contact the student who shared this folder.
