# Complete prompt for a coding agent working on the 3D side

Paste **everything below the line** into Codex (or any coding agent) on the machine that has the
docking pipeline (`H:\cpi3d-demo` / `H:\finaldemo\gfihm`).

It is self-contained. You do not need to open any other file.

---

# PROJECT: binding affinity + 3D pose, in under four minutes

## 1. WHAT THIS SYSTEM IS

A final-year project that takes a **compound** (SMILES) and a **protein** (amino-acid sequence) and
returns two things: how strongly they bind, and a 3D picture of where the compound sits in the
protein. It is two programs talking over HTTP.

```
   user types SMILES + protein sequence
                │
    ┌───────────┴────────────┐
    │                        │
PROGRAM A                PROGRAM B
(teammate's laptop)      (THIS machine — your job)
                │                        │
  affinity score (trained model)   3D pose (AutoDock Vina)
  band + confidence                contacting residues (PLIP)
  finds a solved structure         pocket (P2Rank, or free — see §5)
  serves the web interface
```

**PROGRAM A — the affinity app.** Finished. Not yours to change.
Repository: https://github.com/siddu123b2/perceiver-cpi
It runs Perceiver CPI models trained on Davis, KIBA and Metz, and serves the web page the user
actually looks at. It also looks up whether a real solved structure of the pair exists.

**PROGRAM B — the docking service.** This machine. Your job.
Existing pipeline: ESMFold → P2Rank → AutoDock Vina → PLIP. It already works; it is slow and it
fails too often.

## 2. FACTS YOU MUST NOT GET WRONG

These have already cost this project days. Do not re-derive them and do not act against them.

1. **The pose is NOT produced by a trained model.** AutoDock Vina generates it from physics and a
   scoring function — it searches positions and scores them. There is nothing to learn, ever.
   `pipeline/run.py` calling `docking.dock()` directly is correct.
2. **Do not train anything.** Not for poses, not for pockets, not for contacts. A previous attempt
   trained a "conditioned 3D" model on the single complex `10gs` for 80 epochs as a code check. It
   has no validation or test set, the app already blocks that checkpoint from serving, and it must
   stay blocked. Do not use it, do not extend it, do not train a replacement.
3. **The affinity models are already trained and are not on this machine.** They belong to Program
   A. Never retrain them and never substitute a score of your own.
4. **Vina is CPU-only.** Do not queue the pose behind GPU work.
5. **The method already works.** The redocking benchmark gives 3 of 5 top poses within 2 Å of the
   crystal pose. Jobs fail for environment reasons, not because the approach is wrong. **Fix the
   failures; do not redesign the method.**
6. **Pockets and contacts need no training either.** P2Rank ships pretrained. PLIP is rule-based
   geometry. Neither learns anything here.

## 3. THE GOAL, WITH NUMBERS

Current measured timing for one job — **9 min 47 s total**:

| Step | Time | Note |
|---|---|---|
| ESMFold predicts the protein structure | **5 min 54 s** | 60% of the job, and where most failures happen |
| P2Rank finds candidate pockets | 6 s | |
| Ligand prep + Vina docking | 3 min 47 s | up to 8 pockets searched, 2 CPU threads |

**Target: under 4 minutes for a protein with a known structure, and no failures on the common
path.** This comes from skipping work that is usually unnecessary (Task 2), not from
micro-optimisation.

The ESMFold log shows model weights being moved between GPU memory, RAM and disk — the model does
not fit in this laptop's RTX 3050 VRAM, which is why that step is both slow and fragile.

## 4. TASK 1 — Classify the failures before changing anything

Saved job errors fall into three stages with different causes:

- **During ESMFold** — the VRAM problem above.
- **During receptor preparation** — the structure has something Vina rejects: several chains,
  alternate location indicators, non-standard residues, or missing atoms.
- **During pose validation** — docking ran but the result was rejected, commonly because the search
  box was centred on the wrong pocket.

**Do this:**
1. Read every saved job record and classify each failure into one of those three stages.
2. Write `docs/FAILURE_AUDIT.md`: how many jobs, how many per stage, one quoted example each.
3. Add a `stage` field to the error record so future failures classify themselves.

**Verify:** re-run one previously failing job; its record must now name the stage.

Fix nothing yet. I want to know which stage dominates before effort goes anywhere.

## 5. TASK 2 — Skip ESMFold when a real structure already exists (the big win)

For most real targets, somebody has already solved the structure. Program A finds one for **74% of
test pairs**. Ask it before folding.

```http
POST http://<PROGRAM_A_HOST>:8000/structure
Content-Type: application/json

{"smiles": "<SMILES>", "sequence": "<SEQUENCE>"}
```

```json
{"level": "exact_complex" | "same_target" | "same_compound" | "none",
 "pdb_ids": ["1m17", "4hjo", "6dwn"],
 "ligand_code": "AQ4",
 "detail": "..."}
```

**Implement this branch:**

- **`exact_complex` or `same_target`** → download that entry from
  `https://files.rcsb.org/download/<ID>.pdb`, use it as the receptor, and **skip ESMFold
  entirely**. The pocket comes free: centre the Vina search box on the ligand already present in
  that structure, so **skip P2Rank too**. Runtime becomes roughly the Vina step alone.
- **`same_compound` or `none`** → fall back to ESMFold exactly as now.

Make Program A's address configurable (environment variable, default `http://127.0.0.1:8000`) and
make the lookup **optional and non-fatal**: if Program A is unreachable, log it and fold. **The
docking service must never require Program A to be up.**

**Verify:** run one pair twice, lookup enabled then disabled. Both must produce a pose. Record both
runtimes in `docs/SPEED.md`. Expect roughly six minutes saved.

## 6. TASK 3 — Cache structures so a protein is folded once

Ten compounds against one target currently folds ten times.

Cache the prepared receptor on disk keyed by a **hash of the sequence** (not a name). On a hit,
reuse and log it. Provide a flag to force a rebuild. Cache the P2Rank pocket result alongside it,
since that depends only on the protein.

**Verify:** two different compounds, same protein. The second must log a cache hit and must not
call ESMFold or P2Rank. Both timings into `docs/SPEED.md`.

## 7. TASK 4 — Make receptor preparation robust

The second failure stage. Clean the structure deterministically before docking:

- keep one chain — the one the ligand contacts, else the first
- drop waters, and heteroatoms that are not the ligand of interest
- for alternate locations, keep conformer A
- if atoms are still missing, fail with a message naming exactly what was wrong

**Identify the ligand by size, never by a hardcoded three-letter code.** Count atoms per hetero
residue, discard the solvent/ion/additive list (HOH, SO4, GOL, EDO, NA, CL, NAG…), take the
largest. After docking the residue name is whatever your pipeline produced, so a fixed code breaks.

**Verify:** process 20 varied PDB entries; report how many yield a valid receptor file. Aim for 20.
List any failures with the reason.

## 8. TASK 5 — Return the contacts with the pose

A pose alone explains nothing. Run PLIP on the final complex and return its interactions as JSON:

```json
{"contacts": [
  {"residue": "THR790", "chain": "A", "type": "hydrogen bond", "distance": 3.1},
  {"residue": "LYS745", "chain": "A", "type": "salt bridge", "distance": 2.8}
]}
```

Use **PLIP's own interaction types**. Do not write your own distance rule and label the result a
hydrogen bond — PLIP applies angle and geometry criteria that a distance check does not, and
distinguishes hydrogen bonds from salt bridges from π-stacking.

**Verify:** PDB 1M17 (EGFR with erlotinib) must return contacts naming residues genuinely present
in that structure.

## 9. TASK 6 — Keep the HTTP contract exactly as it is

Program A's interface already calls these. Do not rename or restructure them.

| Endpoint | Behaviour |
|---|---|
| `POST /api/jobs` | Accepts `{dataset, smiles, sequence, method}`, returns `{"id": "..."}` immediately |
| `GET /api/jobs/{id}` | Returns `{"status": ..., "result": {...}}`; status reaches `completed` or `failed` |
| `GET /api/jobs/{id}/files/{name}` | Serves the pose files |

On failure return a `detail` string naming the stage from Task 1 and what to try — the user reads it.

**Start the service so the other laptop can reach it:**

```
cd H:\cpi3d-demo
.venv\Scripts\python.exe -m uvicorn backend.app:app --host 0.0.0.0 --port 8010
```

`--host 0.0.0.0` is essential; without it the service only answers itself. Find this machine's
address with `ipconfig` (IPv4, e.g. `192.168.1.42`). Allow the port through Windows Firewall on
**private** networks when prompted. Both laptops must be on the same network.

**The teammate then sets, on their machine:**

```
$env:PERCEIVER_DOCKING_URL = "http://192.168.1.42:8010"
```

Their app forwards jobs to you from then on. They can check with
`curl http://127.0.0.1:8000/api/docking/status`.

**Verify:** from the other laptop, `curl http://<this-ip>:8010/api/complexes` must answer.

## 10. TASK 7 — End-to-end check (this is the deliverable)

Run five varied pairs through the whole system. Include at least:

- one pair with a solved structure (fast route)
- one with none (folding route)
- one protein over 800 residues
- one compound unlike a typical kinase inhibitor

Record in `docs/E2E.md`: the pair, which route was taken, runtime per stage, whether a pose was
produced, how many contacts, and any failure with its stage.

**That table is what proves the system works, and it is what we will be asked about.**

## 11. CONSTRAINTS

- **Do not train any model.** If you believe training is needed, stop and explain why instead.
- **Do not change Program A.** Call it over HTTP; treat it as fixed.
- **Do not make this service depend on Program A being up.** The lookup is an optimisation.
- **Do not hardcode ligand three-letter codes** anywhere.
- **Do not silently catch exceptions.** Every failure names its stage and reason.
- **Do not fake a result.** If no pose was produced, say so. A wrong pose shown confidently is
  worse than no pose.
- Pin the RDKit, Vina, P2Rank and PLIP versions, and record them in the docs you write.

## 12. HOW TO WORK

Do the tasks **in order**. After each, tell me:

1. what changed, in plain words
2. the exact command I can run to check it myself
3. the measured before/after number, where the task has one

If a task cannot be done on this machine, say so plainly, say what is missing, and move on. Do not
substitute something that looks similar but is not.

## 13. DEFINITION OF DONE

- A pair with a solved structure produces a pose in **under 4 minutes**
- The same protein with a second compound is **noticeably faster again** (cache hit)
- Five varied pairs run end to end, recorded in `docs/E2E.md`
- Every failure names its stage
- **Nothing was trained**

## 14. IF THE TWO LAPTOPS CANNOT BE NETWORKED ON THE DAY

Program A already shows the **real solved experimental structure** for 74% of pairs with no docking
service at all. That is a genuine fallback rather than a degraded one — it is experimental data
rather than a prediction, and the interface labels it as a lookup. So this work improves the demo
but is not the only thing standing between the project and a working presentation. Build it
properly; do not panic-ship something that fakes results to avoid that path.
