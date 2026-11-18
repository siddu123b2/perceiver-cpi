import { useEffect, useRef, useState } from 'react'

/**
 * Molecular viewer on 3Dmol.js (BSD, David Koes and contributors), vendored at
 * /vendor/3Dmol-min.js.
 *
 * Styled the way structural biologists actually present a bound complex: bright green ribbon,
 * the ligand in cyan, the residues lining the pocket picked out in their own colours, hydrogen
 * bonds as yellow dashes, and a wireframe mesh over the cavity so the pocket is visible without
 * hiding what is inside it. Contact residues are numbered, and the numbers are listed beside the
 * viewer so the picture can be read rather than just admired.
 *
 * When the docking service returns a predicted complex, pass it as `pdbData`; nothing else changes.
 */

function loadLibrary() {
  if (window.$3Dmol) return Promise.resolve(window.$3Dmol)
  if (!loadLibrary.pending) {
    loadLibrary.pending = new Promise((resolve, reject) => {
      const tag = document.createElement('script')
      tag.src = '/vendor/3Dmol-min.js'
      tag.onload = () => resolve(window.$3Dmol)
      tag.onerror = () => reject(new Error('Could not load the molecular viewer.'))
      document.head.appendChild(tag)
    })
  }
  return loadLibrary.pending
}

const VIEWS = [['pocket', 'Pocket'], ['surface', 'Surface'], ['ribbon', 'Ribbon']]

const PROTEIN_GREEN = '#21c521'
const LIGAND_CARBON = '#22d3ee'
const RESIDUE_COLOURS = ['#ff8c42', '#ffe74c', '#ff4fa3', '#f2f2f2', '#b084ff', '#4ad991']
const ELEMENTS = { N: '#2f6fe0', O: '#e8402a', S: '#ffd23f', F: '#7ee787', Cl: '#7ee787', Br: '#c97b4a', P: '#ff8c42' }

const POLAR = new Set(['N', 'O'])
const HBOND_MAX = 3.6          // angstroms; generous, this is illustration not analysis

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

export default function Viewer3D({
  pdbId = '1M17', pdbData = null, height = 'normal', controls = true, ligandCode = null,
}) {
  const host = useRef(null)
  const viewer = useRef(null)
  const [view, setView] = useState('pocket')
  const [spinning, setSpinning] = useState(true)
  const [problem, setProblem] = useState(null)
  const [ready, setReady] = useState(false)
  const [contacts, setContacts] = useState([])

  useEffect(() => {
    let dead = false
    setReady(false); setProblem(null); setContacts([])

    loadLibrary()
      .then(($3Dmol) => {
        if (dead || !host.current) return
        host.current.innerHTML = ''
        const v = $3Dmol.createViewer(host.current, { backgroundColor: '#3a3a3a', antialias: true })
        viewer.current = v

        const finish = () => {
          if (dead) return
          if (!v.getModel()) {
            setProblem('Could not fetch this structure — the viewer needs internet access to the PDB.')
            return
          }
          setReady(true)
          setContacts(paint(v, view, ligandCode))
          if (spinning && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            v.spin('y', 0.4)
          }
        }

        if (pdbData) { v.addModel(pdbData, 'pdb'); finish() } else {
          $3Dmol.download(`pdb:${pdbId}`, v, {}, finish)
          setTimeout(() => { if (!dead && !viewer.current?.getModel()) finish() }, 11000)
        }
      })
      .catch((error) => !dead && setProblem(error.message))

    return () => {
      dead = true
      try { viewer.current?.spin(false) } catch { /* gone */ }
      viewer.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdbId, pdbData, ligandCode])

  useEffect(() => {
    if (ready && viewer.current) setContacts(paint(viewer.current, view, ligandCode))
  }, [view, ready, ligandCode])

  useEffect(() => {
    if (!viewer.current || !ready) return
    try { viewer.current.spin(spinning ? 'y' : false) } catch { /* ignore */ }
  }, [spinning, ready])

  return (
    <div>
      <div className={`viewer${height === 'tall' ? ' tall' : ''}`}>
        <div className="viewer-canvas" ref={host} />
        {problem && <div className="viewer-note">{problem}</div>}
        {!ready && !problem && <div className="viewer-note">Building structure…</div>}
        {controls && ready && (
          <div className="viewer-overlay">
            {VIEWS.map(([key, label]) => (
              <button key={key} type="button" onClick={() => setView(key)}
                className={`sm ${view === key ? '' : 'sec'}`}>{label}</button>
            ))}
            <button type="button" className="sm sec" onClick={() => setSpinning((s) => !s)}>
              {spinning ? 'Pause' : 'Spin'}
            </button>
          </div>
        )}
      </div>

      {contacts.length > 0 ? (
        <div className="contacts">
          {contacts.map((c, i) => (
            <span key={c.key} className="contact">
              <b style={{ background: RESIDUE_COLOURS[i % RESIDUE_COLOURS.length] }}>{i + 1}</b>
              {c.label}
              {c.hbonds > 0 && <em>{c.hbonds} H-bond{c.hbonds > 1 ? 's' : ''}</em>}
            </span>
          ))}
        </div>
      ) : (
        <div className="legend">
          <span><i style={{ background: LIGAND_CARBON }} /> Compound</span>
          <span><i style={{ background: PROTEIN_GREEN }} /> Protein</span>
          <span className="dim">Drag to rotate · scroll to zoom</span>
        </div>
      )}
    </div>
  )
}

/** Draw one view. Returns the contact residues so they can be listed beside the picture. */
function paint(v, view, ligandCode) {
  const $3Dmol = window.$3Dmol
  const ligandSel = ligandCode
    ? { resn: ligandCode }
    : { hetflag: true, not: { resn: ['HOH', 'WAT', 'SO4', 'PO4', 'GOL', 'EDO', 'NA', 'CL', 'MG', 'ZN', 'CA', 'K'] } }

  v.removeAllSurfaces()
  v.removeAllShapes()
  v.removeAllLabels()
  v.setStyle({}, {})

  const ligandStyle = {
    stick: { radius: 0.2, colorscheme: { prop: 'elem', map: { C: LIGAND_CARBON, ...ELEMENTS } } },
  }

  if (view === 'ribbon') {
    v.setStyle({}, { cartoon: { color: PROTEIN_GREEN, arrows: true } })
    v.setStyle(ligandSel, ligandStyle)
    v.zoomTo(ligandSel); v.zoom(0.4); v.render()
    return []
  }

  if (view === 'surface') {
    v.setStyle({}, { cartoon: { color: PROTEIN_GREEN, opacity: 0.95 } })
    v.addSurface($3Dmol.SurfaceType.MS, { opacity: 0.72, color: '#9ad6a0' }, { not: { hetflag: true } })
    v.setStyle(ligandSel, ligandStyle)
    v.zoomTo(ligandSel); v.zoom(0.6); v.render()
    return []
  }

  // ---- pocket view: the presentation shot
  v.setStyle({}, { cartoon: { color: PROTEIN_GREEN } })

  const model = v.getModel()
  const ligandAtoms = model ? model.selectedAtoms(ligandSel) : []
  if (ligandAtoms.length === 0) {
    v.setStyle(ligandSel, ligandStyle); v.zoomTo(); v.render()
    return []
  }

  // residues lining the pocket
  const near = model.selectedAtoms({ within: { distance: 4.6, sel: ligandSel }, not: { hetflag: true } })
  const residues = new Map()
  for (const atom of near) {
    const key = `${atom.chain}_${atom.resi}`
    if (!residues.has(key)) {
      residues.set(key, { key, chain: atom.chain, resi: atom.resi, resn: atom.resn, atoms: [], hbonds: 0 })
    }
    residues.get(key).atoms.push(atom)
  }

  // hydrogen bonds: polar ligand atom close to polar protein atom
  for (const entry of residues.values()) {
    for (const protein of entry.atoms) {
      if (!POLAR.has(protein.elem)) continue
      for (const lig of ligandAtoms) {
        if (!POLAR.has(lig.elem)) continue
        if (distance(protein, lig) <= HBOND_MAX) {
          entry.hbonds += 1
          v.addCylinder({
            start: { x: protein.x, y: protein.y, z: protein.z },
            end: { x: lig.x, y: lig.y, z: lig.z },
            radius: 0.055, dashed: true, fromCap: 1, toCap: 1, color: '#ffe74c',
          })
        }
      }
    }
  }

  // the closest residues get a colour, a stick representation and a number
  const ranked = [...residues.values()]
    .map((entry) => ({
      ...entry,
      closest: Math.min(...entry.atoms.flatMap((a) => ligandAtoms.map((l) => distance(a, l)))),
    }))
    .sort((a, b) => (b.hbonds - a.hbonds) || (a.closest - b.closest))
    .slice(0, 6)

  ranked.forEach((entry, i) => {
    const colour = RESIDUE_COLOURS[i % RESIDUE_COLOURS.length]
    v.setStyle({ chain: entry.chain, resi: entry.resi },
      { stick: { radius: 0.15, colorscheme: { prop: 'elem', map: { C: colour, ...ELEMENTS } } },
        cartoon: { color: PROTEIN_GREEN } })
    const anchor = entry.atoms[Math.floor(entry.atoms.length / 2)]
    v.addLabel(String(i + 1), {
      position: { x: anchor.x, y: anchor.y, z: anchor.z },
      backgroundColor: colour, backgroundOpacity: 0.92, fontColor: '#111111',
      fontSize: 11, borderThickness: 0, inFront: true,
    })
  })

  // wireframe mesh over the cavity — shows the pocket without hiding what sits in it
  v.addSurface($3Dmol.SurfaceType.VDW,
    { opacity: 0.85, color: '#7fe3a0', wireframe: true, linewidth: 0.4 },
    { within: { distance: 7.5, sel: ligandSel }, not: { hetflag: true } })

  v.setStyle(ligandSel, ligandStyle)
  v.zoomTo(ligandSel)
  v.zoom(0.52)
  v.render()

  return ranked.map((entry) => ({
    key: entry.key,
    label: `${entry.resn}${entry.resi}`,
    hbonds: entry.hbonds,
  }))
}
