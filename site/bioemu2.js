'use strict';
(() => {
  const byId = id => document.getElementById(id);
  let scene = null, result = null, timer = null, frame = 0, generation = 0;
  const currentInput = () => ({smiles:byId('smiles').value,sequence:byId('sequence').value});
  const inputStamp = () => JSON.stringify(currentInput());
  const message = text => { byId('bioemuStatus').textContent = text; };
  function pause() { clearInterval(timer); timer = null; byId('bioemuPlay').textContent = 'Play predicted frames'; }
  window.clearBioemu = () => {
    generation++; pause(); result = null;
    if (scene) { scene.removeAllModels(); scene.removeAllShapes(); scene.render(); }
    byId('bioemuScene').hidden = true;
    byId('bioemuPlay').disabled = true; byId('bioemuFrame').disabled = true;
    byId('bioemuDownload').removeAttribute('href');
    message('Select inputs, then download their GPU input or load their saved BioEmu result.');
  };
  async function checked(response) {
    if (!response.ok) {
      let data; try { data = await response.json(); } catch { throw Error('The server could not read this request.'); }
      throw Error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));
    }
    return response;
  }
  async function post(path, body) {
    const r = await checked(await fetch(path, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
    return r.json();
  }
  function draw(index, focus = false) {
    if (!result) return;
    frame = index; byId('bioemuFrame').value = index;
    scene.removeAllModels();
    const atoms = result.atoms.map((a,i) => ({...a, serial:i+1, index:i,
      x:result.frames[index][i][0], y:result.frames[index][i][1], z:result.frames[index][i][2],
      hetflag:a.role === 'ligand', bonds:[], bondOrder:[]}));
    for (const [a,b] of result.bonds) {
      atoms[a].bonds.push(b); atoms[a].bondOrder.push(1);
      atoms[b].bonds.push(a); atoms[b].bondOrder.push(1);
    }
    const model = scene.addModel(); model.addAtoms(atoms);
    model.setStyle({chain:'A'}, {cartoon:{color:'#a9b7ce'},line:{color:'#a9b7ce',opacity:0.25}});
    model.setStyle({chain:'L'}, {stick:{color:'#ffcb72',radius:0.2},sphere:{color:'#ffcb72',scale:0.25}});
    const ligandAtoms = atoms.filter(a => a.chain === 'L'), nearby = new Map();
    for (const atom of atoms) {
      if (atom.chain !== 'A') continue;
      let distance = Infinity;
      for (const l of ligandAtoms) distance = Math.min(distance, Math.hypot(atom.x-l.x,atom.y-l.y,atom.z-l.z));
      if (distance <= 6 && (!nearby.has(atom.resi) || distance < nearby.get(atom.resi).distance)) nearby.set(atom.resi,{resi:atom.resi,resn:atom.resn,distance});
    }
    model.setStyle({chain:'A',resi:[...nearby.keys()]},{stick:{color:'#44c7c2',radius:0.13}},true);
    byId('bioemuContacts').replaceChildren();
    for (const c of [...nearby.values()].sort((a,b) => a.distance-b.distance)) {
      const row = document.createElement('p'); row.textContent = `${c.resn} ${c.resi}: ${c.distance.toFixed(2)} Å (nearest compound atom)`;
      byId('bioemuContacts').append(row);
    }
    if (!nearby.size) byId('bioemuContacts').textContent = 'No protein residue is within 6 Å of the compound in this frame.';
    byId('bioemuFrameInfo').textContent = `Frame ${index+1} of ${result.frames.length} · Predicted time ${Number(result.times_ns[index]).toFixed(3)} ns`;
    const p = result.physicality;
    byId('bioemuGeometry').textContent = !p.checked ? 'Protein geometry was not checked for these frames.' :
      p.passed[index] ? 'Protein geometry check passed. Binding and compound chemistry are not established by this check.' :
      `Protein geometry check FAILED: ${p.reasons[index]}. This frame may contain unrealistic atom arrangements.`;
    if (focus) scene.zoomTo();
    scene.render();
  }
  async function show(pair, id, token, stamp) {
    const base = `/api/bioemu2/result/${pair}/${id}`;
    const r = await (await checked(await fetch(base+'/result.json'))).json();
    if (token !== generation || stamp !== inputStamp()) return;
    pause(); result = r; byId('bioemuScene').hidden = false; byId('bioemuPanel').open = true;
    if (!scene) scene = $3Dmol.createViewer(byId('bioemuMolecule'), {backgroundColor:'#101927'});
    scene.resize(); byId('bioemuFrame').max = r.frames.length-1;
    byId('bioemuFrame').disabled = r.frames.length < 2; byId('bioemuPlay').disabled = r.frames.length < 2;
    byId('bioemuDownload').href = base+'/result.zip';
    byId('bioemuIdentity').textContent = `BioEmu-2 prediction · pair ${pair.slice(0,12)} · ${r.sequence.length} protein residues · ${r.smiles}`;
    draw(0, true);
    message(`Loaded ${r.frames.length} predicted frame(s) for your selected pair. ${r.physicality.checked ? r.physicality.passed.filter(Boolean).length+' passed protein geometry checks.' : 'Protein geometry was not checked.'}`);
  }
  byId('bioemuExport').onclick = async () => {
    const token = ++generation, stamp = inputStamp();
    try {
      message('Preparing the exact full-sequence input and GPU worker…');
      const response = await checked(await fetch('/api/bioemu2/request', {method:'POST',headers:{'Content-Type':'application/json'},body:stamp}));
      const blob = await response.blob(); if (token !== generation || stamp !== inputStamp()) return;
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || 'bioemu2_input.zip';
      a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      message('Input downloaded. Follow README.md in the ZIP on your Linux GPU, then import cpi_bioemu2_result.zip here.');
    } catch (e) { if (token === generation) message(e.message); }
  };
  byId('bioemuLoad').onclick = async () => {
    const token = ++generation, stamp = inputStamp();
    try {
      const data = await post('/api/bioemu2/results', currentInput());
      if (token !== generation || stamp !== inputStamp()) return;
      if (!data.results.length) { window.clearBioemu(); message('No BioEmu result is saved for this pair. Download its GPU input, run it, and import the result.'); return; }
      await show(data.pair_id, data.results[0], token, stamp);
    } catch(e) { if (token === generation) message(e.message); }
  };
  byId('bioemuImport').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    window.clearBioemu(); const token = generation, stamp = inputStamp();
    try {
      if (file.size > 100*1024*1024) throw Error('The ZIP is over 100 MB. Generate fewer motion steps.');
      message('Checking the result ZIP and matching it to your selected input…');
      const data = await post('/api/bioemu2/results', currentInput());
      if (token !== generation || stamp !== inputStamp()) return;
      const imported = await (await checked(await fetch(`/api/bioemu2/import/${data.pair_id}`, {method:'POST',headers:{'Content-Type':'application/zip'},body:file}))).json();
      await show(imported.pair_id, imported.result_id, token, stamp);
    } catch(e) { if (token === generation) message(e.message); }
    finally { event.target.value = ''; }
  };
  byId('bioemuFrame').oninput = event => { pause(); draw(Number(event.target.value)); };
  byId('bioemuPlay').onclick = () => {
    if (timer) { pause(); return; } if (!result || result.frames.length < 2) return;
    if (frame >= result.frames.length-1) draw(0);
    byId('bioemuPlay').textContent = 'Pause';
    timer = setInterval(() => { if (frame >= result.frames.length-1) { pause(); return; } draw(frame+1); }, 500);
  };
  byId('bioemuPanel').addEventListener('toggle', () => { if (byId('bioemuPanel').open) scene?.resize(); else pause(); });
  window.addEventListener('resize', () => scene?.resize());
})();
