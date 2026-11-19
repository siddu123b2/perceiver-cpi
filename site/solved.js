'use strict';
/* Binding pose from a solved structure.
 * ---------------------------------------------------------------------------
 * Loaded after app.js and cpi.js, so it shares their `viewer`, `el` and `api`.
 *
 * The page was written to show a pose produced by docking. Docking needs Vina, OpenBabel and
 * fpocket, which live in the partner's service and are not on this machine. But for most pairs
 * somebody has already solved the structure experimentally, and our backend finds it - so this
 * shows the real thing when it exists, and says plainly when it does not.
 *
 * The ligand is never identified by a hardcoded three-letter code. It is found by counting atoms
 * per hetero residue, discarding water, sugars, ions and crystallisation additives, and taking the
 * largest remaining group. That is the behaviour the docking path needs too, because after Vina
 * runs the residue name is whatever the pipeline produced.
 *
 * The contacts here are a DISTANCE TEST ONLY: a nitrogen or oxygen on the ligand within 3.5 A of
 * one on the protein. Real interaction analysis (PLIP) also applies angle and geometry rules and
 * separates hydrogen bonds from salt bridges and pi-stacking. Labelled as such in the interface.
 */

const SOLVED_SKIP = new Set([
  'HOH', 'WAT', 'DOD', 'NAG', 'BMA', 'MAN', 'FUC', 'GAL', 'NDG', 'SIA',
  'CA', 'MG', 'ZN', 'NA', 'CL', 'K', 'FE', 'MN', 'CU', 'SO4', 'PO4', 'GOL', 'EDO',
  'ACT', 'DMS', 'PEG', 'MES', 'TRS', 'IOD', 'BR', 'NO3', 'ACY', 'FMT', 'TRIS', 'CIT',
]);
const SOLVED_POLAR = new Set(['N', 'O']);
const POCKET_CUTOFF = 5.0;
const HBOND_CUTOFF = 3.5;

const COLOUR_PROTEIN = '#2f8f4e';
const COLOUR_POCKET = '#2dd4bf';
const COLOUR_LIGAND = '#fbbf24';

let solvedLigand = null;
let solvedModel = null;
let solvedShapes = [];
let solvedSpinning = false;
let lastAnswer = null;

const set = (id, text) => { const node = el(id); if (node) node.textContent = text; };

/** Largest hetero residue that is not solvent, sugar, ion or additive. */
function findLigand(model) {
  const tally = {};
  model.selectedAtoms({ hetflag: true }).forEach((atom) => {
    const resn = (atom.resn || '').trim().toUpperCase();
    if (SOLVED_SKIP.has(resn)) return;
    const key = `${atom.chain}|${atom.resi}|${resn}`;
    if (!tally[key]) tally[key] = { n: 0, chain: atom.chain, resi: atom.resi, resn };
    tally[key].n += 1;
  });
  const best = Object.values(tally).sort((a, b) => b.n - a.n)[0];
  return best && best.n >= 6 ? best : null;     // ignore stray fragments
}

const ligandSel = () => ({ chain: solvedLigand.chain, resi: solvedLigand.resi });
const pocketSel = () => ({
  within: { distance: POCKET_CUTOFF, sel: ligandSel() }, byres: true, hetflag: false,
});

function drawSolved() {
  if (!solvedLigand) return;
  viewer.setStyle({}, {});
  viewer.removeAllSurfaces();

  const showAll = el('full')?.checked;
  viewer.setStyle({ hetflag: false },
    { cartoon: { color: COLOUR_PROTEIN, opacity: showAll ? 0.95 : 0.55 } });
  viewer.addStyle(pocketSel(), { stick: { radius: 0.14, colorscheme: 'cyanCarbon' } });
  viewer.addStyle(ligandSel(), {
    stick: { radius: 0.26, colorscheme: 'yellowCarbon' },
    sphere: { scale: 0.26, colorscheme: 'yellowCarbon' },
  });

  if (el('surface')?.checked) {
    viewer.addSurface($3Dmol.SurfaceType.VDW,
      { opacity: 0.7, color: '#8fa8c8' },
      { within: { distance: 9, sel: ligandSel() }, hetflag: false });
  }
  drawSolvedContacts();
  viewer.render();
}

function solvedContacts() {
  if (!solvedModel || !solvedLigand) return [];
  const ligandAtoms = solvedModel.selectedAtoms(ligandSel()).filter((a) => SOLVED_POLAR.has(a.elem));
  const pocketAtoms = solvedModel.selectedAtoms(pocketSel()).filter((a) => SOLVED_POLAR.has(a.elem));
  const found = [];
  for (const l of ligandAtoms) {
    for (const p of pocketAtoms) {
      const d = Math.hypot(l.x - p.x, l.y - p.y, l.z - p.z);
      if (d <= HBOND_CUTOFF) found.push({ l, p, d });
    }
  }
  return found.sort((a, b) => a.d - b.d);
}

function drawSolvedContacts() {
  solvedShapes.forEach((s) => viewer.removeShape(s));
  solvedShapes = [];
  const list = el('contacts')?.checked ? solvedContacts() : [];
  const target = el('contactList');
  if (target) {
    target.replaceChildren();
    if (!el('contacts')?.checked) {
      set('contactState', 'Tick “Nearby atom contacts” to measure polar contacts.');
    } else if (!list.length) {
      set('contactState', 'No polar contacts within 3.5 Å.');
    } else {
      set('contactState', `${list.length} polar contact${list.length > 1 ? 's' : ''} ≤ 3.5 Å `
        + '(distance only — not a full interaction analysis).');
      for (const c of list) {
        const row = document.createElement('div');
        const who = document.createElement('span');
        who.textContent = `${c.p.resn}${c.p.resi} ${c.p.atom}`;
        const far = document.createElement('span');
        far.textContent = `${c.d.toFixed(2)} Å`;
        row.append(who, far);
        target.append(row);
      }
    }
  }
  for (const c of list) {
    solvedShapes.push(viewer.addCylinder({
      start: { x: c.l.x, y: c.l.y, z: c.l.z },
      end: { x: c.p.x, y: c.p.y, z: c.p.z },
      radius: 0.055, dashed: true, fromCap: 1, toCap: 1, color: COLOUR_LIGAND,
    }));
  }
}

/** Pull a solved entry from RCSB and show it. */
function showSolvedStructure(pdbId, info) {
  return new Promise((resolve) => {
    solvedLigand = null; solvedModel = null; solvedShapes = [];
    viewer.removeAllModels(); viewer.removeAllShapes();
    viewer.removeAllSurfaces(); viewer.removeAllLabels();
    set('status', `Loading ${pdbId.toUpperCase()} from RCSB…`);

    $3Dmol.download(`pdb:${pdbId}`, viewer, {}, (model) => {
      if (!model) {
        set('status', `Could not load ${pdbId.toUpperCase()}. The viewer needs internet access to RCSB.`);
        resolve(false);
        return;
      }
      solvedModel = model;
      solvedLigand = findLigand(model);
      if (!solvedLigand) {
        set('status', `${pdbId.toUpperCase()} loaded, but it contains no bound ligand to show.`);
        viewer.setStyle({}, { cartoon: { color: COLOUR_PROTEIN } });
        viewer.zoomTo(); viewer.render();
        resolve(false);
        return;
      }

      set('status', '');
      const pocketResidues = new Set(
        model.selectedAtoms(pocketSel()).map((a) => `${a.resn}${a.resi}`));
      set('atoms', String(solvedLigand.n));
      set('residues', String(pocketResidues.size));
      set('complexTitle', `${pdbId.toUpperCase()} · ligand ${solvedLigand.resn}`);
      set('sceneTitle', info?.level === 'exact_complex'
        ? 'Experimentally solved complex'
        : 'Solved structure of this target');
      set('poseSource', info?.detail || '');
      set('quality', `Ligand ${solvedLigand.resn}, chain ${solvedLigand.chain}, `
        + `residue ${solvedLigand.resi} — found automatically, not from a fixed code.`);

      for (const id of ['full', 'surface', 'contacts', 'reset']) {
        const node = el(id);
        if (node) node.disabled = false;
      }
      drawSolved();
      viewer.zoomTo(ligandSel());
      viewer.zoom(0.45);
      viewer.render();
      resolve(true);
    });
  });
}

/* ---------------------------------------------------------------- controls */

for (const id of ['full', 'surface']) {
  const node = el(id);
  if (node) node.addEventListener('change', () => { if (solvedLigand) drawSolved(); });
}
el('contacts')?.addEventListener('change', () => {
  if (solvedLigand) { drawSolvedContacts(); viewer.render(); }
});
el('reset')?.addEventListener('click', () => {
  if (!solvedLigand) return;
  viewer.zoomTo(ligandSel()); viewer.zoom(0.45); viewer.render();
});
el('replay')?.addEventListener('click', () => {
  if (!solvedLigand) return;
  solvedSpinning = !solvedSpinning;
  viewer.spin(solvedSpinning ? 'y' : false);
});

/* ---------------------------------------------------------------- predict */

el('predict').onclick = async () => {
  const query = {
    dataset: el('dataset').value,
    smiles: el('smiles').value,
    sequence: el('sequence').value,
    method: el('method')?.value || 'lookup',
  };
  if (!query.smiles.trim() || !query.sequence.trim()) {
    set('queryStatus', 'Enter a compound and a protein, or pick a pair from the dataset above.');
    return;
  }

  if (typeof clearResult === 'function') clearResult();
  set('queryStatus', 'Scoring the pair and looking for a solved structure…');
  set('scoreResult', 'Working…');

  let answer;
  try {
    answer = await api('/api/predict', query);
  } catch (error) {
    set('scoreResult', error.message);
    set('queryStatus', '');
    return;
  }

  renderResult(answer);
  lastAnswer = answer;

  const structure = answer.structure || {};
  if (structure.pdb_ids && structure.pdb_ids.length) {
    await showSolvedStructure(structure.pdb_ids[0], structure);
  } else {
    set('status', 'No solved structure exists for this pair. A pose would have to be predicted by '
      + 'docking, which runs in the structure service.');
    set('complexTitle', 'No structure available');
    set('sceneTitle', 'Nothing solved for this pair');
    set('poseSource', structure.detail || '');
  }
};


/* ---------------------------------------------------------------- result panel
 * The page originally showed one line of text. A score only means something next to its scale,
 * so this lays out: the number, where it sits between the weak and strong thresholds for THIS
 * dataset, what that means in words, and - when the pair is in the source data - the laboratory
 * value to check it against.
 */

const BAND_WORDS = {
  'strong binder': 'This is a strong binder. On this scale that means the compound is expected to '
    + 'bind the protein tightly enough to be pharmacologically interesting.',
  'moderate binder': 'This is a moderate binder. There is measurable affinity, but weaker than a '
    + 'typical drug-like interaction for this target class.',
  'weak binder': 'This is a weak binder. The model does not expect meaningful binding between '
    + 'this compound and this protein.',
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderResult(answer) {
  const host = el('scoreResult');
  if (!host) return;
  const band = answer.band.split(' ')[0];
  const strong = answer.bands?.strong ?? (answer.score_label === 'KIBA score' ? 12.1 : 7);
  const moderate = answer.bands?.moderate ?? (answer.score_label === 'KIBA score' ? 11.1 : 6);
  const span = (strong - moderate) * 3;
  const low = moderate - span / 3;
  const place = Math.max(1, Math.min(99, ((answer.score - low) / span) * 100));

  const measured = (answer.source_measurements || []).map((m) => m.original_score);
  const diff = measured.length ? Math.abs(answer.score - measured[0]) : null;

  const parts = [];
  parts.push(`<div class="cpi-result">
    <div class="cpi-headline">
      <span class="cpi-score">${answer.score.toFixed(2)}</span>
      <span class="cpi-unit">${escapeHtml(answer.score_label)}</span>
      <span class="cpi-band ${band}">${escapeHtml(answer.band)}</span>
    </div>

    <div class="cpi-scale">
      <div class="cpi-track"><span class="cpi-pin ${band}" style="left:${place}%"></span></div>
      <div class="cpi-ticks">
        <span>weak</span><span>${moderate} moderate</span><span>${strong} strong</span>
      </div>
    </div>

    <div class="cpi-plain">${escapeHtml(BAND_WORDS[answer.band] || '')}</div>`);

  parts.push(`<div class="cpi-facts">
      <div class="cpi-fact"><strong>${answer.confidence_label || '—'}</strong><span>confidence</span></div>
      <div class="cpi-fact"><strong>${Math.round((answer.similarity_to_training?.compound ?? 0) * 100)}%</strong><span>compound seen</span></div>
      <div class="cpi-fact"><strong>${Math.round((answer.similarity_to_training?.protein ?? 0) * 100)}%</strong><span>protein seen</span></div>
      <div class="cpi-fact"><strong>${escapeHtml(answer.dataset.toUpperCase())}</strong><span>model used</span></div>
    </div>`);

  if (measured.length) {
    parts.push(`<div class="cpi-check">
      <b>Checked against the laboratory value.</b> This pair is in the source data, measured at
      <b>${measured.join(', ')}</b> ${escapeHtml(answer.score_label)}. The model predicted
      <b>${answer.score.toFixed(2)}</b> — a difference of <b>${diff.toFixed(2)}</b>.
    </div>`);
  } else {
    parts.push(`<div class="cpi-check off">
      This pair is not in the source data, so there is no measured value to check against. The
      score is a genuine prediction.
    </div>`);
  }

  if (answer.truncated) {
    parts.push(`<div class="cpi-note">⚠<span>The model reads the first
      <b>${answer.sequence_limit}</b> residues. This protein has <b>${answer.sequence_tokens}</b>,
      so the rest is not seen. This is how the published model works.</span></div>`);
  }
  if (answer.advice?.summary) {
    parts.push(`<div class="cpi-note">◆<span>${escapeHtml(answer.advice.summary)}</span></div>`);
  }
  parts.push('</div>');
  host.innerHTML = parts.join('');

  set('affinity', `${answer.score_label} ${answer.score.toFixed(2)} · ${answer.band}`);
  set('measurement', '');
  set('queryStatus', '');
}


/* ---------------------------------------------------------------- example
 * There is no pair list any more - the user types their own compound and protein. This fills in a
 * real pair from the Davis test set so the interface can be tried in one click.
 */
el('useExample')?.addEventListener('click', () => {
  el('smiles').value = 'C#Cc1cccc(Nc2ncnc3cc(OCCOC)c(OCCOC)cc23)c1';
  el('sequence').value =
    'MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNYDLSFLKTIQEVAGY'
    + 'VLIALNTVERIPLENLQIIRGNMYYENSYALAVLSNYDANKTGLKELPMRNLQEILHGAVRFSNNPALCNVESIQWRDIVSSDFLSNM'
    + 'SMDFQNHLGSCQKCDPSCPNGSCWGAGEENCQKLTKIICAQQCSGRCRGKSPSDCCHNQCAAGCTGPRESDCLVCRKFRDEATCKDTC'
    + 'PPLMLYNPTTYQMDVNPEGKYSFGATCVKKCPRNYVVTDHGSCVRACGADSYEMEEDGVRKCKKCEGPCRKVCNGIGIGEFKDSLSIN'
    + 'ATNIKHFKNCTSISGDLHILPVAFRGDSFTHTPPLDPQELDILKTVKEITGFLLIQAWPENRTDLHAFENLEIIRGRTKQHGQFSLAV'
    + 'VSLNITSLGLRSLKEISDGDVIISGNKNLCYANTINWKKLFGTSGQKTKIISNRGENSCKATGQVCHALCSPEGCWGPEPRDCVSCRN'
    + 'VSRGRECVDKCNLLEGEPREFVENSECIQCHPECLPQAMNITCTGRGPDNCIQCAHYIDGPHCVKTCPAGVMGENNTLVWKYADAGHV'
    + 'CHLCHPNCTYGCTGPGLEGCPTNGPKIPS';
  el('dataset').value = 'davis';
  set('queryStatus', 'Erlotinib and the EGFR kinase domain — a pair with a solved structure.');
});
