# Prompt for a coding agent working on the 3D side

Copy everything below the line into Codex (or any coding agent) **on the machine that has the
docking pipeline** (`H:\cpi3d-demo` / `H:\finaldemo\gfihm`).

It is written to be pasted whole. It carries the context the agent needs, the facts that stop it
wasting time on the wrong thing, the tasks in order, and how to check each one actually worked.

---

## CONTEXT

I am finishing a final-year project that predicts **compound–protein binding affinity** and shows
the **3D binding pose**. It is two programs that talk over HTTP.

**Program A — the affinity app** (already finished, not yours to change)
Repository: https://github.com/siddu123b2/perceiver-cpi
It runs on my teammate's laptop. Given a compound (SMILES) and a protein (amino-acid sequence) it
returns a binding-affinity score from a trained Perceiver CPI model, and separately looks up
whether a real solved structure of that pair exists. It serves the web interface the user sees.

**Program B — the docking service** (this machine, your job)
Folders: `H:\cpi3d-demo` and `H:\finaldemo\gfihm`.
It turns the same two inputs into a **3D pose**: the ligand placed inside the protein's binding
pocket, plus the residues it touches. Pipeline: ESMFold → P2Rank → AutoDock Vina → PLIP.

## FACTS YOU MUST NOT GET WRONG

These have already cost us time. Do not re-derive them, and do not act against them.

1. **The pose is NOT produced by a trained model.** AutoDock Vina generates it from physics and a
   scoring function. There is nothing to train, ever. `pipeline/run.py` calls `docking.dock()`
   directly and that is correct.
2. **Do not train anything.** Not for poses, not for pockets, not for contacts. A previous attempt
   trained a "conditioned 3D" model on the single complex `10gs` for 80 epochs as a code check. It
   has no validation or test set, the app already blocks that checkpoint from serving, and it must
   stay blocked. Delete nothing, but do not use it and do not extend it.
3. **The affinity models are already trained and are not on this machine.** They live in Program A
   (Davis, KIBA and Metz). Never retrain them, never substitute your own score.
4. **Vina is CPU-only.** Do not wait for the GPU for the pose itself.
5. **The pipeline already works.** The redocking benchmark gives 3 of 5 top poses within 2 Å of the
   crystal pose. Jobs fail for environment reasons, not because the method is wrong. Fix the
   failures; do not redesign the method.

## THE GOAL

A user types any compound and any protein and gets, reliably:

- an accurate **binding affinity score** (from Program A — just make sure nothing you do breaks it)
- a **3D pose** showing where the compound sits and which residues it contacts
- **in well under the current time**

Current measured timings for one job, total **9 min 47 s**:

| Step | Time |
|---|---|
| ESMFold predicts the protein structure | 5 min 54 s |
| P2Rank finds candidate pockets | 6 s |
| Ligand prep + Vina docking | 3 min 47 s |

**Target: under 4 minutes for a protein with a known structure, and no failures on the common
path.** The way to get there is in Task 2 — it is not micro-optimisation, it is skipping a step
that is usually unnecessary.

---

## TASK 1 — Find out why jobs are currently failing, before changing anything

Saved job errors fall into three stages, with different causes:

- **During ESMFold.** The fold log shows model weights being moved between GPU memory, RAM and
  disk, which means the model does not fit in this laptop's RTX 3050 VRAM.
- **During receptor preparation.** The structure has something Vina rejects — several chains,
  alternate location indicators, non-standard residues, or missing atoms.
- **During pose validation.** Docking ran, but the result was rejected — commonly because the
  search box was centred on the wrong pocket.

**Do this:**
1. Read every saved job record and classify each failure into one of those three stages.
2. Write `docs/FAILURE_AUDIT.md`: how many jobs, how many of each stage, and one example error per
   stage, quoted.
3. Add a `stage` field to the job's error record so future failures are classified automatically.

**Verify:** run one job that previously failed and confirm its record now names the stage.

Do not fix anything yet. I want to know which stage dominates before effort goes anywhere.

## TASK 2 — Skip ESMFold when a real structure already exists (biggest win)

ESMFold is 60% of the runtime **and** the step most failures die in. For most real targets it is
unnecessary, because somebody has already solved the structure.

Program A exposes a lookup. Before folding, ask it:

```http
POST http://<PROGRAM_A_HOST>:8000/structure
Content-Type: application/json

{"smiles": "<SMILES>", "sequence": "<SEQUENCE>"}
```

Response:

```json
{"level": "exact_complex" | "same_target" | "same_compound" | "none",
 "pdb_ids": ["1m17", "4hjo", "6dwn"],
 "ligand_code": "AQ4",
 "detail": "..."}
```

**Implement this branch:**

- **`exact_complex` or `same_target`** → download that PDB entry from RCSB
  (`https://files.rcsb.org/download/<ID>.pdb`), use it as the receptor, and **skip ESMFold
  entirely**. You also get the pocket free: centre the Vina search box on the ligand already in
  that structure, so **skip P2Rank too**. Runtime becomes roughly the Vina step alone.
- **`same_compound` or `none`** → fall back to ESMFold exactly as now.

Make the Program A address configurable (environment variable, default
`http://127.0.0.1:8000`), and make the whole lookup **optional and non-fatal**: if Program A is
unreachable, log it and fall back to folding. The docking service must never depend on it being up.

**Verify:** run the same pair twice, once with the lookup enabled and once disabled. Both must
produce a pose. Record both runtimes in `docs/SPEED.md`. Expect roughly 6 minutes saved.

## TASK 3 — Cache structures so the same protein is never folded twice

Testing ten compounds against one target currently folds ten times.

Cache the prepared receptor on disk, keyed by a **hash of the sequence** (not the name). On a hit,
reuse it and log that it was reused. Add a flag to force a rebuild. Cache the P2Rank pocket result
alongside it, since that also depends only on the protein.

**Verify:** run two different compounds against the same protein. The second must log a cache hit
and must not call ESMFold or P2Rank. Put both timings in `docs/SPEED.md`.

## TASK 4 — Make receptor preparation robust

This is the second failure stage. Before docking, clean the structure deterministically:

- keep one chain (the one the ligand contacts, else the first)
- drop waters, and heteroatoms that are not the ligand of interest
- for alternate locations, keep conformer A
- fail with a clear message naming what was wrong if atoms are still missing

**Identify the ligand by size, never by a hardcoded three-letter code** — count atoms per hetero
residue, discard the solvent/ion/additive list, take the largest. After docking, the residue name
is whatever your pipeline produced, so a fixed code will break.

**Verify:** process 20 varied PDB entries and report how many produce a valid receptor file. Aim
for all 20; list any that fail with the reason.

## TASK 5 — Return contacts with the pose

The pose alone does not explain anything. Run PLIP on the final complex and return the interactions
as JSON alongside it:

```json
{"contacts": [
  {"residue": "THR790", "chain": "A", "type": "hydrogen bond", "distance": 3.1},
  {"residue": "LYS745", "chain": "A", "type": "salt bridge", "distance": 2.8}
]}
```

Use PLIP's own interaction types. Do **not** write your own geometric rules and call the result a
hydrogen bond — PLIP applies angle and geometry criteria that a distance check does not.

**Verify:** for PDB 1M17 (EGFR with erlotinib), PLIP must report contacts, and they must name real
residues present in that structure.

## TASK 6 — Keep the HTTP contract exactly as it is

Program A's web interface already calls these. Do not rename or restructure them.

| Endpoint | Behaviour |
|---|---|
| `POST /api/jobs` | Accepts `{dataset, smiles, sequence, method}`, returns `{"id": "..."}` immediately |
| `GET /api/jobs/{id}` | Returns `{"status": "...", "result": {...}}`; status reaches `completed` or `failed` |
| `GET /api/jobs/{id}/files/{name}` | Serves the pose files |

On failure, return a `detail` string that names the stage from Task 1 and what to try. The user will
read it.

Start the service so the other laptop can reach it:

```
.venv\Scripts\python.exe -m uvicorn backend.app:app --host 0.0.0.0 --port 8010
```

`--host 0.0.0.0` matters. Allow the port through Windows Firewall on private networks.

**Verify:** from the other laptop, `curl http://<this-ip>:8010/api/complexes` must answer.

## TASK 7 — End-to-end check

Run five varied pairs through the whole system — at least one with a solved structure, one without,
one protein over 800 residues, and one compound unlike a typical kinase inhibitor.

Record in `docs/E2E.md`: pair, which structure route was taken, runtime per stage, whether a pose
came out, how many contacts, and any failure with its stage.

**This table is the deliverable.** It is what proves the system works, and it is what we will be
asked about.

---

## CONSTRAINTS

- **Do not train any model.** If you believe training is needed, stop and explain why instead.
- **Do not change Program A.** Call it over HTTP, treat it as fixed.
- **Do not make the docking service depend on Program A being up.** The lookup is an optimisation.
- **Do not hardcode ligand three-letter codes** anywhere.
- **Do not silently catch exceptions.** Every failure must say which stage and why.
- **Do not fake a result.** If no pose was produced, say so. A wrong pose shown confidently is
  worse than none.
- Keep RDKit, Vina, P2Rank and PLIP versions pinned, and record them in the docs you write.

## HOW TO WORK

Do the tasks **in order**. After each one, tell me:

1. what changed, in plain words
2. the command I can run to check it myself
3. the measured before/after number where the task has one

If a task cannot be done on this machine, say so plainly, explain what is missing, and move to the
next. Do not substitute something that looks similar but is not.

## DEFINITION OF DONE

- A pair with a solved structure produces a pose in **under 4 minutes**
- The same protein with a second compound is **noticeably faster again** (cache hit)
- Five varied pairs run end to end with results recorded in `docs/E2E.md`
- Every failure names its stage
- **Nothing was trained**
