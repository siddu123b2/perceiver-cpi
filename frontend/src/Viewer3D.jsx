import { useEffect, useRef, useState } from 'react'

/**
 * Molecular viewer, on 3Dmol.js (BSD, David Koes and contributors), vendored at
 * /vendor/3Dmol-min.js — the same library the supplied viewer.zip uses.
 *
 * The point of this panel is to look like a molecule, not like a wireframe. So the default view is
 * a solid molecular SURFACE for the protein with the ligand sitting inside its pocket, which is how
 * these complexes are normally illustrated. The residues lining the pocket are picked out in a
 * warmer colour, so the cavity the drug occupies is visible rather than implied.
 *
 * Views:
 *   pocket   surface over the pocket region only, protein ribbon behind it — the drug in its site
 *   surface  the whole protein as a solid body, ligand showing through
 *   ribbon   secondary structure, for seeing the fold
 *
 * When the docking service returns a predicted complex, pass it as `pdbData` and nothing else here
 * changes.
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

const VIEWS = [
  ['pocket', 'Pocket'],
  ['surface', 'Surface'],
  ['ribbon', 'Ribbon'],
]

// Element colours for the ligand. Warm carbon against the cool protein makes the drug read
// instantly, which is the whole job of the picture.
const LIGAND_COLOURS = {
  C: '#f5b942', N: '#4f8ef7', O: '#f0685f', S: '#f2d23b',
  F: '#5fd4a8', Cl: '#5fd4a8', Br: '#c97b4a', I: '#a06cd5', P: '#f09a4a',
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

  useEffect(() => {
    let dead = false
    setReady(false)
    setProblem(null)

    loadLibrary()
      .then(($3Dmol) => {
        if (dead || !host.current) return
        host.current.innerHTML = ''
        const v = $3Dmol.createViewer(host.current, {
          backgroundColor: '#0b0f17',
          antialias: true,
        })
        viewer.current = v
        // a soft outline makes the surface read as a solid body rather than a flat blob
        v.setViewStyle({ style: 'outline', color: '#000000', width: 0.03 })

        const finish = () => {
          if (dead) return
          if (!v.getModel()) {
            setProblem('Could not fetch this structure. The viewer needs internet access to the PDB.')
            return
          }
          setReady(true)
          paint(v, view, ligandCode)
          if (spinning && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            v.spin('y', 0.35)
          }
        }

        if (pdbData) {
          v.addModel(pdbData, 'pdb')
          finish()
        } else {
          $3Dmol.download(`pdb:${pdbId}`, v, {}, finish)
          setTimeout(() => { if (!dead && !ready && !viewer.current?.getModel()) finish() }, 11000)
        }
      })
      .catch((error) => !dead && setProblem(error.message))

    return () => {
      dead = true
      try { viewer.current?.spin(false) } catch { /* gone already */ }
      viewer.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdbId, pdbData, ligandCode])

  useEffect(() => {
    if (ready && viewer.current) paint(viewer.current, view, ligandCode)
  }, [view, ready, ligandCode])

  useEffect(() => {
    const v = viewer.current
    if (!v || !ready) return
    try { v.spin(spinning ? 'y' : false) } catch { /* ignore */ }
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
      <div className="legend">
        <span><i style={{ background: '#f5b942' }} /> Compound</span>
        <span><i style={{ background: '#5e7a9e' }} /> Pocket</span>
        <span><i style={{ background: '#2f3d52' }} /> Protein</span>
        <span className="dim">Drag to rotate · scroll to zoom</span>
      </div>
    </div>
  )
}

/** Draw one of the three views. Separated out so switching view never rebuilds the model. */
function paint(v, view, ligandCode) {
  const $3Dmol = window.$3Dmol
  const ligand = ligandCode
    ? { resn: ligandCode }
    : { hetflag: true, not: { resn: ['HOH', 'WAT', 'SO4', 'PO4', 'GOL', 'EDO', 'NA', 'CL', 'MG', 'ZN'] } }

  v.removeAllSurfaces()
  v.setStyle({}, {})

  const ligandStyle = {
    stick: { radius: 0.21, colorscheme: { prop: 'elem', map: LIGAND_COLOURS } },
    sphere: { radius: 0.34, colorscheme: { prop: 'elem', map: LIGAND_COLOURS } },
  }

  if (view === 'ribbon') {
    v.setStyle({}, { cartoon: { color: '#44557a', arrows: true, thickness: 0.9 } })
  } else if (view === 'surface') {
    v.setStyle({}, { cartoon: { color: '#2f3d52', opacity: 0.55 } })
    v.addSurface($3Dmol.SurfaceType.MS,
      { opacity: 0.88, color: '#36465f' }, { not: { hetflag: true } })
  } else {
    // pocket: ribbon for context, a solid surface only over the residues lining the site
    v.setStyle({}, { cartoon: { color: '#263247', opacity: 0.75 } })
    v.addSurface($3Dmol.SurfaceType.MS,
      { opacity: 0.92, color: '#5e7a9e' },
      { within: { distance: 7.0, sel: ligand }, not: { hetflag: true } })
  }

  v.setStyle(ligand, ligandStyle)
  v.zoomTo(ligand)
  v.zoom(view === 'ribbon' ? 0.42 : 0.62)
  v.render()
}
