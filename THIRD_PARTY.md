# Third-party components

This repository contains code we did not write. Listed here so anyone reading it can tell our work
from other people's.

## Model code — `model_2d/`

The official **Perceiver CPI** implementation, from
[github.com/dmis-lab/PerceiverCPI](https://github.com/dmis-lab/PerceiverCPI), which is itself built
on [Chemprop](https://github.com/chemprop/chemprop) (MIT). The original archive is kept at
`reference/PerceiverCPI-main.zip` so our copy can be diffed against it.

We changed it only where it would not otherwise run, plus two optional flags that are off by
default. **Every change is listed in [`model_2d/CHANGES.md`](model_2d/CHANGES.md)**, each with a
test showing it does not alter results.

Paper: Nguyen, Jang, Kim & Kang (2023), *Perceiver CPI: a nested cross-attention network for
compound–protein interaction prediction*, **Bioinformatics** 39(1), btac731.

## Molecular viewer — `site/vendor/3Dmol-min.js`, `frontend/public/vendor/3Dmol-min.js`

[3Dmol.js](https://3dmol.csb.pitt.edu/) v2.5.5, by David Koes and contributors. BSD licence.
Used unmodified.

## Front-end framework — `site/experience/`

`experience.js` and `scene-txdEDDbL.js` are **minified third-party bundles** that arrived with the
interface files supplied to this project (`viewer.zip`). They appear to be a build of
[three.js](https://threejs.org/) (MIT) plus a scroll/animation framework.

**We could not determine their exact origin or licence**, and we have not modified them. They are
included because the interface depends on them. If you are the author and would like them removed
or attributed differently, please open an issue.

Our own additions to that interface are `site/solved.js` and the edits to `site/cpi.html`.

## Data

- **Davis, KIBA and Metz** benchmark datasets — redistributed from DeepPurpose/DeepDTA lineage.
  The raw files are **not** in this repository (see `.gitignore`); only the cleaning and splitting
  code is.
- **`data/structures/bindingdb_structures.json`** is a derived index built from
  [BindingDB](https://www.bindingdb.org/). It contains only PDB identifiers, ligand codes and
  hashed keys — not BindingDB's affinity measurements. BindingDB is released for free public use.
- Structures themselves are fetched at run time from the [RCSB PDB](https://www.rcsb.org/) by the
  viewer, and are not stored here.

## Everything else

The data preparation, splitting, training orchestration, evaluation, diagnostics, model registry,
backend and analysis in this repository are our own work. The experimental findings — including the
protein-sensitivity metric and the negative results — are ours.
