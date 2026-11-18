import { useEffect, useRef, useState } from 'react'

/**
 * Molecular viewer, built on 3Dmol.js (BSD, David Koes and contributors) — the same library the
 * supplied viewer.zip uses, vendored at /vendor/3Dmol-min.js.
 *
 * Today it renders an experimentally solved complex pulled from the RCSB PDB, so the panel is a
 * working viewer rather than an empty box. When the 3D service lands it will hand us a predicted
 * structure instead: pass it in as `pdbData` and nothing else here has to change.
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

const STYLES = {
  ribbon: { label: 'Ribbon' },
  surface: { label: 'Surface' },
  sticks: { label: 'All atoms' },
}

export default function Viewer3D({ pdbId = '1M17', pdbData = null, height = 'normal', controls = true, ligandCode = null }) {
  const host = useRef(null)
  const viewer = useRef(null)
  const [mode, setMode] = useState('ribbon')
  const [problem, setProblem] = useState(null)
  const [ready, setReady] = useState(false)

  // create the viewer and load the structure once
  useEffect(() => {
    let dead = false
    let surface = null
    const ligandSel = ligandCode ? { resn: ligandCode }
                                 : { hetflag: true, not: { resn: ['HOH', 'WAT'] } }

    loadLibrary()
      .then(($3Dmol) => {
        if (dead || !host.current) return
        const view = $3Dmol.createViewer(host.current, { backgroundColor: '#070910', antialias: true })
        viewer.current = view

        const draw = () => {
          if (dead) return
          view.setStyle({}, { cartoon: { color: '#3d4a63', opacity: 0.9 } })
          // the ligand: the named chemical when we know it, else anything not protein or water
          view.setStyle(ligandSel, {
            stick: {
              radius: 0.16,
              colorscheme: { prop: 'elem', map: { C: '#22d3b8', N: '#4f8ef7', O: '#f06a6a', S: '#f0b429' } },
            },
          })
          view.zoomTo(ligandSel)
          view.zoom(0.55)
          view.render()
          setReady(true)
          if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            view.spin('y', 0.4)
          }
        }

        if (pdbData) {
          view.addModel(pdbData, 'pdb')
          draw()
        } else {
          $3Dmol.download(`pdb:${pdbId}`, view, {}, () => draw())
          // download() gives no error path, so fail softly if nothing arrived
          setTimeout(() => {
            if (!dead && !viewer.current?.getModel()) {
              setProblem('Structure could not be fetched. The viewer needs an internet connection to reach the PDB.')
            }
          }, 9000)
        }
      })
      .catch((error) => !dead && setProblem(error.message))

    return () => {
      dead = true
      try { viewer.current?.spin(false) } catch { /* already gone */ }
      if (surface) surface = null
      viewer.current = null
    }
  }, [pdbId, pdbData, ligandCode])

  // restyle when the mode changes
  useEffect(() => {
    const view = viewer.current
    if (!view || !ready) return
    const ligand = ligandCode ? { resn: ligandCode } : { hetflag: true, not: { resn: ['HOH', 'WAT'] } }
    view.removeAllSurfaces()
    if (mode === 'ribbon') {
      view.setStyle({}, { cartoon: { color: '#3d4a63', opacity: 0.9 } })
    } else if (mode === 'sticks') {
      view.setStyle({}, { stick: { radius: 0.06, color: '#39455c' } })
    } else {
      view.setStyle({}, { cartoon: { color: '#2b3448', opacity: 0.35 } })
      view.addSurface(window.$3Dmol.SurfaceType.VDW,
        { opacity: 0.68, color: '#223049' }, { within: { distance: 8, sel: ligand } })
    }
    view.setStyle(ligand, {
      stick: {
        radius: 0.16,
        colorscheme: { prop: 'elem', map: { C: '#22d3b8', N: '#4f8ef7', O: '#f06a6a', S: '#f0b429' } },
      },
    })
    view.render()
  }, [mode, ready, ligandCode])

  return (
    <div>
      <div className={`viewer${height === 'tall' ? ' tall' : ''}`}>
        <div className="viewer-canvas" ref={host} />
        {problem && <div className="viewer-note">{problem}</div>}
        {!ready && !problem && <div className="viewer-note">Loading structure…</div>}
        {controls && ready && (
          <div className="viewer-overlay">
            {Object.entries(STYLES).map(([key, item]) => (
              <button
                key={key}
                className={`sm ${mode === key ? '' : 'sec'}`}
                onClick={() => setMode(key)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="legend">
        <span><i style={{ background: '#22d3b8' }} /> Compound</span>
        <span><i style={{ background: '#3d4a63' }} /> Protein</span>
        <span className="dim">Drag to rotate · scroll to zoom</span>
      </div>
    </div>
  )
}
