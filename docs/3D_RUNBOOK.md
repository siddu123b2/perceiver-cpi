# 3D pose: step-by-step runbook

**For the machine with the docking pipeline (`H:\cpi3d-demo`).**

## How to use this

**Do not paste the whole file into Codex.** That is what went wrong before — a long brief gives an
agent too many choices and it does none of them properly.

Instead: **one step at a time.** Each step below has

- a **command you run yourself** first, so you know the state of things
- a short **prompt to paste into Codex**, in a grey box
- **what success looks like**

Finish a step, check it worked, then move to the next. If a step fails, the fix is in that step —
do not skip ahead.

Steps 0–3 get **one pose out of the system**. Steps 4–6 make it fast. Step 7 connects the laptops.

---

# PART 1 — Get one pose working at all

## Step 0: check the tools exist

Run this yourself in PowerShell:

```powershell
cd H:\cpi3d-demo
.venv\Scripts\python.exe --version
.venv\Scripts\python.exe -c "import rdkit, Bio; print('rdkit + biopython OK')"
.venv\Scripts\python.exe -c "import vina; print('vina python OK')"
where.exe vina
where.exe obabel
java -version
```

Write down which of those fail. **Nothing below works until Python, RDKit and Vina are present.**

If `vina` is missing entirely, download `vina_1.2.5_win.exe` from
<https://github.com/ccsb-scripps/AutoDock-Vina/releases>, put it somewhere permanent, and note the
full path — the pipeline can call the executable, it does not need the Python bindings.

> **Paste to Codex:**
> ```
> In H:\cpi3d-demo, find every place the code locates or calls AutoDock Vina, P2Rank, Open Babel
> and PLIP. For each one, tell me the file and line, and how the path is configured (hardcoded,
> environment variable, or found on PATH). Do not change anything yet — just list them.
> ```

**Success:** you have a list of where each tool is expected to live.

---

## Step 1: run the pipeline once, directly, and capture the real error

Do not use the web interface for this. Call the pipeline function on its own so nothing hides the
error.

> **Paste to Codex:**
> ```
> Write a script H:\cpi3d-demo\try_one.py that calls run_pipeline() from
> backend/pipeline/run.py directly on one hardcoded pair:
>
>   smiles   = "C#Cc1cccc(Nc2ncnc3cc(OCCOC)c(OCCOC)cc23)c1"
>   sequence = (paste the EGFR sequence from the project's test data, or any protein you have)
>
> Requirements:
> - print a timestamped line before and after EVERY stage (structure, pocket prep, ligand prep,
>   docking, interactions)
> - do NOT catch exceptions — let it crash with the full traceback
> - write everything to try_one.log as well as the screen
>
> Then run it and show me the complete output.
> ```

Run it yourself afterwards to see it again:

```powershell
.venv\Scripts\python.exe try_one.py
```

**Success:** either a pose file appears, or you have a **full traceback** naming the stage that
failed. Both are progress. A vague "job failed" is not.

---

## Step 2: fix whatever Step 1 showed

Give Codex the traceback. Be specific about which stage.

> **Paste to Codex** (fill in the bracket):
> ```
> try_one.py failed during [STAGE] with this traceback:
>
> [paste the full traceback]
>
> Fix the cause. Rules:
> - do not wrap it in try/except to make the error disappear
> - do not train or load any machine-learning model to work around it
> - if a tool is missing or misconfigured, tell me what to install instead of coding around it
>
> After the fix, run try_one.py again and show me the output.
> ```

Repeat Step 2 until `try_one.py` produces a pose.

**The three failures already seen on this machine, and what they mean:**

| Stage | Cause | Fix |
|---|---|---|
| **ESMFold** | The model does not fit the RTX 3050's VRAM, so weights swap to disk | Skip it — Step 4. Or use a shorter protein for now. |
| **Receptor preparation** | Several chains, alternate locations, non-standard residues, missing atoms | Step 3 |
| **Pose validation** | Docking ran but the box was on the wrong pocket | Check the box covers the pocket |

**Success:** `try_one.py` writes a ligand pose file and exits cleanly.

---

## Step 3: make receptor preparation reliable

> **Paste to Codex:**
> ```
> In backend/pipeline/protein_prep.py, make prepare_receptor() deterministic before docking:
>
> 1. keep only ONE chain — the chain the ligand contacts if there is a ligand, otherwise the first
> 2. remove all waters
> 3. remove heteroatoms EXCEPT the ligand of interest
> 4. where atoms have alternate locations, keep conformer A only
> 5. if required atoms are still missing, raise an error that names exactly what was missing
>
> To decide which hetero residue is "the ligand", count atoms per hetero residue, discard this
> list — HOH WAT DOD NAG BMA MAN FUC GAL NDG SIA CA MG ZN NA CL K FE MN CU SO4 PO4 GOL EDO ACT
> DMS PEG MES TRS IOD BR NO3 ACY FMT — and take the largest remaining residue with at least 6
> atoms. Never hardcode a three-letter ligand code anywhere.
>
> Then write test_receptors.py that runs prepare_receptor() over these PDB ids, downloading each
> from https://files.rcsb.org/download/<ID>.pdb :
>   1m17 4hjo 3ti8 10gs 1a0q 2ity 1f4g 1eas 4std 1ai6
> Print a table of id, pass/fail, and the reason on failure. Run it and show me the table.
> ```

**Success:** 8 or more of the 10 pass. Investigate any that fail — the reason should be specific.

---

# PART 2 — Make it fast

Current timing is **9 min 47 s**: ESMFold 5 min 54 s, P2Rank 6 s, Vina 3 min 47 s. The fold is 60%
of it and is also the step that fails most.

## Step 4: skip folding when a real structure already exists

The teammate's app finds a solved structure for **74% of pairs**. Use it instead of folding.

> **Paste to Codex:**
> ```
> Add a new module backend/pipeline/known_structure.py with one function:
>
>   def find(smiles: str, sequence: str) -> dict | None
>
> It POSTs to  <PROGRAM_A>/structure  with {"smiles": ..., "sequence": ...} where PROGRAM_A comes
> from the environment variable PERCEIVER_APP_URL, defaulting to http://127.0.0.1:8000 .
>
> The response looks like:
>   {"level": "exact_complex" | "same_target" | "same_compound" | "none",
>    "pdb_ids": ["1m17", "4hjo"], "ligand_code": "AQ4"}
>
> If level is "exact_complex" or "same_target", download the FIRST pdb id from
> https://files.rcsb.org/download/<ID>.pdb into the working directory and return
> {"pdb_path": ..., "pdb_id": ..., "ligand_code": ...}. Otherwise return None.
>
> Timeout after 10 seconds. If the request fails for ANY reason, log a warning and return None —
> this must never crash the pipeline or make it depend on the other program being up.
>
> Write a small test that calls find() with the EGFR pair from try_one.py and prints the result.
> ```

Then wire it in:

> **Paste to Codex:**
> ```
> In backend/pipeline/run.py, before the structure prediction step, call known_structure.find().
>
> If it returns a structure:
>   - use that PDB as the receptor and SKIP ESMFold entirely
>   - centre the Vina search box on the ligand already present in that structure, and SKIP P2Rank
>   - record in the result: "receptor_source": "experimental", plus the pdb id
> If it returns None:
>   - run ESMFold and P2Rank exactly as now
>   - record "receptor_source": "predicted"
>
> Then run try_one.py and show me the timing of each stage.
> ```

**Success:** the EGFR pair finishes in roughly the Vina time alone — target **under 4 minutes** —
and the log says it used an experimental structure.

---

## Step 5: never fold the same protein twice

> **Paste to Codex:**
> ```
> Add a disk cache for prepared receptors in H:\cpi3d-demo\cache\receptors\ .
>
> The key is sha256 of the uppercased sequence with whitespace removed — not a name or an id.
> Cache the prepared receptor file AND the P2Rank pocket result, since both depend only on the
> protein. On a hit, log "receptor cache hit <key[:8]>" and reuse. Add --no-cache to force a rebuild.
>
> Then run try_one.py twice with the same protein but different compounds (change the SMILES to
> CC(=O)Oc1ccccc1C(=O)O for the second) and show me both timings.
> ```

**Success:** the second run logs a cache hit and is much faster.

---

## Step 6: return the contacting residues

> **Paste to Codex:**
> ```
> After docking, run PLIP on the final protein-ligand complex and add to the job result:
>
>   "contacts": [
>     {"residue": "THR790", "chain": "A", "type": "hydrogen bond", "distance": 3.1},
>     ...
>   ]
>
> Use PLIP's own interaction types — hydrogen bond, salt bridge, hydrophobic, pi-stacking. Do NOT
> invent your own distance rule and call it a hydrogen bond.
>
> If PLIP is not installed, tell me the exact install command rather than writing a substitute.
>
> Test on PDB 1m17 (EGFR with erlotinib) and show me the contacts.
> ```

**Success:** real residue names with interaction types.

---

# PART 3 — Connect to the other laptop

## Step 7: expose the service and link it

Run yourself:

```powershell
cd H:\cpi3d-demo
.venv\Scripts\python.exe -m uvicorn backend.app:app --host 0.0.0.0 --port 8010
```

`--host 0.0.0.0` is essential. When Windows Firewall prompts, choose **Allow on private networks**.

In another window:

```powershell
ipconfig        # note the IPv4 Address, e.g. 192.168.1.42
```

**Then on the teammate's laptop**, before starting their app:

```powershell
$env:PERCEIVER_DOCKING_URL = "http://192.168.1.42:8010"
.venv\Scripts\python.exe -m uvicorn backend.app:app --port 8000
```

They check the link with:

```powershell
curl http://127.0.0.1:8000/api/docking/status
```

**Success:** that returns `"connected": true`. Both laptops must be on the same Wi-Fi.

> **If it says not reachable**, test from the teammate's laptop first:
> `curl http://192.168.1.42:8010/api/complexes` — if that fails too, it is the firewall or the
> network, not the code.

---

## Step 8: prove it end to end

> **Paste to Codex:**
> ```
> Write docs/E2E.md recording a run of five pairs through the full pipeline. Include at least:
>   - one pair with a solved structure (fast route)
>   - one with none (folding route)
>   - one protein longer than 800 residues
>   - one compound unlike a typical kinase inhibitor
>
> For each: the pair, which receptor route was used, time per stage, whether a pose was produced,
> how many contacts, and any failure with its stage. Run them and fill in the real numbers.
> ```

**This table is the deliverable.** It is what proves the system works.

---

# Rules to repeat to Codex if it drifts

Paste this whenever it starts going the wrong way:

```
Reminders:
- The pose comes from AutoDock Vina. It is physics, not machine learning. Do not train anything.
- Do not use or extend the conditioned 3D model trained on 10gs. It stays blocked.
- The affinity models belong to the other program. Never retrain or replace them.
- Do not hide an error with try/except. Every failure must name its stage and reason.
- Do not fake a pose. If none was produced, say so.
- Do not change the API: POST /api/jobs, GET /api/jobs/{id}, GET /api/jobs/{id}/files/{name}.
```

# If the laptops cannot be networked on the day

The teammate's app already shows the **real solved experimental structure** for 74% of pairs with
no docking service at all. That is a working fallback — experimental data rather than a prediction,
and labelled as such. So finish this properly; do not rush something that fakes results.
