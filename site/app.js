'use strict';
const el=id=>document.getElementById(id);
let viewer, ligand, pocket, protein, metadata, original=[], direction=[1,0,0], anim=null, loadToken=0;
let rows=[], contactShapes=[], surfaceId=null, currentPose=100, currentArtifactBase=null;
const ligandStyle={stick:{radius:.19,colorscheme:{prop:'elem',map:{C:'#ffcb72',N:'#7c9cff',O:'#ff7878',S:'#edda6c',F:'#a7e6a0',Cl:'#a7e6a0'}}}};
async function get(url,json=false){const r=await fetch(url);if(!r.ok)throw new Error(`Could not load ${url} (HTTP ${r.status}).`);return json?r.json():r.text();}
function status(s){el('status').textContent=s;}
function stop(){if(anim)cancelAnimationFrame(anim);anim=null;el('play').textContent='Play approach illustration';}
function clearContacts(){for(const shape of contactShapes)viewer.removeShape(shape);contactShapes=[];}
function drawContacts(){
  clearContacts(); if(!metadata)return;
  const bound=currentPose===100;
  el('contactState').textContent=bound?'':'Contact lines hidden while the compound is moved. Listed distances describe the bound pose.';
  if(!bound||!el('contacts').checked)return;
  const pa=pocket.selectedAtoms({});
  // One line per residue, to keep the binding site readable.
  const seen=new Set();
  for(const c of metadata.contacts){if(seen.has(c.residue))continue;seen.add(c.residue);const a=original[c.ligand_atom],b=pa[c.pocket_atom];if(!a||!b)continue;
    contactShapes.push(viewer.addLine({start:{x:a[0],y:a[1],z:a[2]},end:{x:b.x,y:b.y,z:b.z},color:'#b6c7f7',dashed:true,linewidth:1}));
  }
}
function pose(value){
  if(!ligand)return;
  currentPose=value;
  const offset=(1-value/100)*16,atoms=ligand.selectedAtoms({});
  atoms.forEach((a,i)=>{a.x=original[i][0]+direction[0]*offset;a.y=original[i][1]+direction[1]*offset;a.z=original[i][2]+direction[2]*offset;});
  ligand.setStyle({},ligandStyle);drawContacts();viewer.render();
  el('sceneTitle').textContent=value===100?'Experimental bound structure':'Illustrated approach · artificial motion';
}
async function toggleSurface(){
  if(surfaceId!==null){viewer.removeSurface(surfaceId);surfaceId=null;}
  if(el('surface').checked&&pocket){const s=viewer.addSurface($3Dmol.SurfaceType.VDW,{opacity:.20,color:'#44c7c2'},{model:pocket});surfaceId=s.surfid;await s;}
  viewer.render();
}
function styleProtein(){if(!protein)return;protein.setStyle({},el('full').checked?{cartoon:{color:'#879bb6',opacity:.78}}:{});viewer.render();}
async function toggleProtein(){
  if(el('full').checked&&!protein&&metadata){
    const current=loadToken,pdb=metadata.pdb_id;status('Reading full protein from your archive…');
    try{const text=await get(`${currentArtifactBase || '/api/complex/'+pdb}/protein.pdb`);if(current!==loadToken)return;protein=viewer.addModel(text,'pdb');styleProtein();status('Full protein loaded.');}
    catch(e){status(e.message);el('full').checked=false;}
  }else styleProtein();
}
async function loadComplex(config){
  const id=el('pdb').value.trim().toLowerCase(),found=rows.find(r=>r.pdb_id===id);
  if(!config?.base&&!found){status('Choose a PDB ID from the available processed structures.');return;}
  stop();const token=++loadToken;el('load').disabled=true;el('play').disabled=true;status(`Loading ${id.toUpperCase()||'sequence model'}…`);
  try{
    const base=config?.base || `/api/complex/${id}`;
    const [meta,pdb,sdf]=await Promise.all([get(`${base}/metadata.json`,true),get(`${base}/pocket.pdb`),get(`${base}/ligand.sdf`)]);
    if(token!==loadToken)return;
    viewer.removeAllModels();viewer.removeAllShapes();viewer.removeAllSurfaces();viewer.removeAllLabels();contactShapes=[];surfaceId=null;protein=null;metadata=meta;currentArtifactBase=base;
    pocket=viewer.addModel(pdb,'pdb');pocket.setStyle({},{stick:{radius:.11,colorscheme:{prop:'elem',map:{C:'#44c7c2',N:'#7c9cff',O:'#ff7878',S:'#edda6c'}}}});
    pocket.setHoverable({},true,(a,v)=>{if(!a.label)a.label=v.addLabel(`${a.chain}:${a.resn}${a.resi} · ${a.atom}`,{position:a,fontSize:12,backgroundColor:'#132437',backgroundOpacity:.9});},(a,v)=>{if(a.label){v.removeLabel(a.label);delete a.label;}});
    ligand=viewer.addModel(sdf,'sdf');ligand.setStyle({},ligandStyle);original=ligand.selectedAtoms({}).map(a=>[a.x,a.y,a.z]);
    const mean=xs=>xs.reduce((acc,a)=>acc.map((x,i)=>x+a[i]/xs.length),[0,0,0]);
    const lc=mean(original),pc=mean(pocket.selectedAtoms({}).map(a=>[a.x,a.y,a.z]));direction=lc.map((x,i)=>x-pc[i]);const norm=Math.hypot(...direction);direction=norm>.1?direction.map(x=>x/norm):[1,0,0];
    el('complexTitle').textContent=(meta.display_name||meta.pdb_id||id).toUpperCase();el('affinity').textContent=meta.pose_source || `Structure's reference label: ${meta.affinity_raw} · p${meta.affinity_type} ${meta.p_affinity_operator} ${Number(meta.p_affinity).toFixed(3)}`;
    el('quality').textContent=meta.training_eligible?'Accepted for the prepared training pool.':`View only: ${(meta.exclusion_reasons||[]).join(', ').replaceAll('_',' ').toLowerCase()}.`;
    el('atoms').textContent=meta.ligand_atoms;el('residues').textContent=meta.pocket_residues;el('download').href=`${base}/graph.npz`;
    el('contactList').replaceChildren();const seen=new Set();
    for(const c of meta.contacts){if(seen.has(c.residue))continue;seen.add(c.residue);const div=document.createElement('div');div.className='contact';const label=document.createElement('span'),distance=document.createElement('b');label.textContent=c.residue;distance.textContent=`${c.distance.toFixed(2)} Å`;div.append(label,distance);el('contactList').append(div);}
    el('position').value=100;pose(100);viewer.zoomTo({model:[pocket,ligand]});viewer.render();await toggleSurface();await toggleProtein();
    if(token!==loadToken)return false;
    status(`${id.toUpperCase()} · ${meta.pocket_atoms} pocket atoms · ${meta.contacts.length} nearby atom pairs. Distances are geometric contacts.`);
    return true;
  }catch(e){if(token===loadToken)status(`Cannot display this complex: ${e.message}`);return false;}
  finally{if(token===loadToken){el('load').disabled=false;el('play').disabled=false;}}
}
el('load').onclick=loadComplex;el('pdb').onkeydown=e=>{if(e.key==='Enter')loadComplex();};
el('position').oninput=()=>{stop();pose(Number(el('position').value));};
el('contacts').onchange=()=>{drawContacts();viewer.render();};el('surface').onchange=()=>toggleSurface().catch(e=>status(e.message));el('full').onchange=toggleProtein;
el('reset').onclick=()=>{stop();el('position').value=100;pose(100);viewer.zoomTo({model:[pocket,ligand]});viewer.render();};
el('play').onclick=()=>{if(anim){stop();return;}if(!ligand)return;el('position').value=0;pose(0);viewer.zoomTo({model:[pocket,ligand]});viewer.render();const started=performance.now();el('play').textContent='Pause illustration';const tick=now=>{const p=Math.min(100,(now-started)/45);el('position').value=p;pose(p);if(p<100)anim=requestAnimationFrame(tick);else{el('position').value=100;pose(100);stop();}};anim=requestAnimationFrame(tick);};
async function init(){try{
  if(!window.$3Dmol)throw new Error('The local 3D library is missing. Check viewer/vendor/3Dmol-min.js.');
  viewer=$3Dmol.createViewer(el('molecule'),{backgroundColor:'#101927',antialias:true});
  rows=await get('/api/complexes',true);el('inventory').textContent=`${rows.length.toLocaleString()} structures available. Search by PDB ID.`;
  const frag=document.createDocumentFragment();for(const r of rows){const o=document.createElement('option');o.value=r.pdb_id;o.label=r.affinity_raw;frag.append(o);}el('ids').append(frag);
  await loadComplex();window.addEventListener('resize',()=>viewer.resize());
}catch(e){status(e.message);}}
if(!window.CPI_MODE)init();
