# The 3D part: generating binding poses without training anything

**Audience:** whoever runs the docking service (the `cpi3d-demo` / `gfihm` side).
**Short version: no model needs to be trained to produce a pose. AutoDock Vina does it with physics.**

---

> **Working with a coding agent?** [docs/CODEX_PROMPT.md](CODEX_PROMPT.md) is a complete prompt
> covering everything in this document as ordered tasks, each with a way to verify it worked.
> Paste it whole.

## 1. What is trained and what is not

This is the point that causes the most confusion, so it is worth being blunt.

| Part | Trained? | What produces it |
|---|---|---|
| **Binding affinity score** | **Yes** | Perceiver CPI, trained on Davis / KIBA / Metz. Lives in *this* repository. |
| **The pose — where the ligand sits** | **No** | AutoDock Vina. A scoring function plus a search. Nothing learned. |
| **The pocket** | **No** | P2Rank (pretrained, ships as-is) or the ligand site in a known structure. |
| **Which residues contact the ligand** | **No** | Geometry. Distances between atoms. PLIP applies proper rules. |
| **Protein 3D shape** | Pretrained, not by us | ESMFold — **or skip it entirely, see §4.** |

The conditioned 3D model trained on the single complex `10gs` for 80 epochs was a code check. It has
no validation or test set, and the app already blocks that checkpoint from serving. **It is not
needed and should not be used.** Nothing about pose generation depends on it.

The redocking benchmark already proves the Vina path works: **3 of 5 top poses within 2 Å** of the
crystal pose, with nothing trained.

---

## 2. How the two halves fit together

```
  user types a compound (SMILES) + a protein (sequence)
            │
            ├─► THIS repository ──► affinity score, band, confidence      (trained model)
            │                  └──► finds a solved structure if one exists (lookup, no model)
            │
            └─► YOUR service ────► pose: ligand placed in the pocket       (Vina, no model)
                               └──► contacts: which residues it touches    (geometry, no model)
```

Each side does what it is good at. Neither needs the other to be retrained.

---

## 3. Connecting your service to this app

The web interface in `site/` already calls the endpoints your service exposes. Three steps.

### Step 1 — start your service so another machine can reach it

```
cd cpi3d-demo
.venv\Scripts\python.exe -m uvicorn backend.app:app --host 0.0.0.0 --port 8010
```

`--host 0.0.0.0` is the important part. Without it the service only answers to itself.

### Step 2 — find your machine's address

```
ipconfig        # Windows: look for IPv4 Address, e.g. 192.168.1.42
```

Both machines must be on the same network, and the firewall must allow the port. Windows will
usually prompt the first time; choose **Allow on private networks**.

### Step 3 — point this app at it

On the machine running this repository:

```
$env:PERCEIVER_DOCKING_URL = "http://192.168.1.42:8010"
.venv\Scripts\python.exe -m uvicorn backend.app:app --port 8000
```

That is all. `/api/jobs` stops returning 503 and forwards to you instead. Check it worked:

```
curl http://127.0.0.1:8000/api/docking/status
```

### The contract

Your service already implements these; they are listed so nothing drifts.

| Endpoint | Purpose |
|---|---|
| `POST /api/jobs` | Accepts `{dataset, smiles, sequence, method}`, returns `{id}` |
| `GET /api/jobs/{id}` | Returns `{status, result}`; status becomes `completed` or `failed` |
| `GET /api/jobs/{id}/files/{name}` | The pose files the viewer loads |

---

## 4. Make it roughly twice as fast, and far more reliable

Your own timings:

| Step | Time |
|---|---|
| ESMFold predicts the protein structure | **5 min 54 s** |
| P2Rank finds pockets | 6 s |
| Ligand prep + Vina docking | 3 min 47 s |

**ESMFold is 60% of the run, and it is also the step most of the failed jobs died in.**

For most real targets it is unnecessary. This app already looks up whether a solved structure
exists, and finds one for **74% of Davis test pairs**. Ask it before folding:

```
POST http://<this-app>:8000/structure
     {"smiles": "...", "sequence": "..."}

→ {"level": "exact_complex" | "same_target" | "same_compound" | "none",
   "pdb_ids": ["1m17", "4hjo", ...],
   "ligand_code": "AQ4"}
```

Then:

- **`exact_complex` or `same_target`** — download that PDB entry and dock into it. **Skip ESMFold.**
  You also get the pocket for free: dock where the existing ligand sits, so P2Rank is unnecessary
  too. Runtime drops to roughly the Vina step alone.
- **`none`** — fall back to ESMFold as you do now.

Two further savings that need no code changes:

- **Cache the folded structure per protein.** Testing ten compounds against one target should fold
  once, not ten times.
- **Use the known-pocket route** when the site is known — it avoids searching up to eight pockets.

---

## 5. Diagnosing the jobs that fail

The saved errors fall into three stages. They have different causes.

**Failed during ESMFold.** The log shows weights being moved between GPU memory, RAM and disk,
which means the model does not fit in the RTX 3050's VRAM. Either reduce the sequence length, or
better, avoid the fold entirely using §4.

**Failed during receptor preparation.** Usually the structure has something Vina will not accept:
multiple chains, alternate locations, non-standard residues, or missing atoms. Keep one chain, drop
waters and heteroatoms other than the ligand, and check the PDBQT was actually written.

**Failed during pose validation.** Docking ran but the result was rejected. Check whether the search
box actually covered the pocket — a box centred on the wrong pocket produces poses that fail
validation rather than an outright error.

Worth logging which of the three stages failed for each job; it makes the pattern obvious.

---

## 6. What you do **not** need to do

- **Do not train a pose model.** Vina needs no training, and 30 epochs on PDBbind will not place a
  ligand better than it does.
- **Do not train on `10gs` again.** One complex with no validation set cannot be evaluated.
- **Do not retrain the affinity models.** They are trained, evaluated and served from this
  repository already.
- **Do not wait for a GPU to be free** for the pose itself. Vina is CPU-only.

---

## 7. If the network route will not work on the day

Everything above assumes both laptops on one network. If that is not possible, the fallback is for
this app to show the **solved experimental structure** it already finds — which needs no docking
service at all, and covers 74% of pairs. It is already implemented in `site/solved.js`. The pose is
then real rather than predicted, which is a defensible thing to present, as long as it is labelled
as a lookup rather than a prediction. The interface already says which it is.
