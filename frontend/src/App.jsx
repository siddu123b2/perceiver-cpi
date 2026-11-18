import { useCallback, useEffect, useState } from 'react'
import Backdrop from './Backdrop.jsx'
import Viewer3D from './Viewer3D.jsx'
import { getHealth, getHistory, getModels, getStructure, predict } from './api.js'
import { DATASET_GUIDE, EXAMPLES } from './datasets.js'


const LEVEL_TEXT = {
  exact_complex: { title: 'Solved complex', tone: 'ok',
    note: 'This exact compound and protein have been crystallised together. What you see is the experimental structure, not a prediction.' },
  same_target: { title: 'Solved target', tone: '',
    note: 'A real structure of this protein, bound to a different ligand. The fold and the pocket are genuine; the molecule shown is not the one you entered.' },
  same_compound: { title: 'Solved compound', tone: '',
    note: 'This compound has been crystallised bound to a different protein. Useful for the molecule shape, not for this particular pairing.' },
  none: { title: 'No solved structure', tone: '',
    note: 'Nothing on record for either side of this pair. A predicted pose would need docking.' },
}

const Info = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="6.5" /><path d="M8 7.2v4M8 4.9v.6" strokeLinecap="round" />
  </svg>
)

/* The backend always returns a general note about protein sensitivity. That belongs in the model
   documentation, not stamped on every result, so it is kept out of the result panel and shown once
   in the model section instead. Warnings specific to what the user typed are always shown. */
const GENERAL = 'distinguishes compounds far better than proteins'

function Result({ data, model }) {
  const band = data.band.split(' ')[0]
  const bands = model?.bands ?? {}
  const low = bands.moderate ?? 0
  const high = bands.strong ?? 1
  const span = Math.max(0.001, (high - low) * 2.4)
  const pct = Math.max(3, Math.min(100, ((data.score - (low - span / 2)) / span) * 100))
  const specific = (data.warnings || []).filter((w) => !w.includes(GENERAL))

  return (
    <>
      <div className="score-row">
        <span className="score-val">{data.score.toFixed(2)}</span>
        <span className="score-unit">{data.unit}</span>
        <span className={`chip ${band}`} style={{ marginLeft: 'auto' }}><i />{data.band}</span>
      </div>

      <div className="scale">
        <div className="scale-bar"><div className="scale-fill" style={{ width: `${pct}%` }} /></div>
        <div className="scale-marks">
          <span>weak</span>
          <span>{low}</span>
          <span>{high}</span>
          <span>strong</span>
        </div>
      </div>

      <div className="kv">
        <div>
          <strong style={{ textTransform: 'capitalize' }}>{data.confidence_label || '—'}</strong>
          <span>confidence</span>
        </div>
        <div>
          <strong>±{data.confidence.toFixed(2)}</strong>
          <span>spread</span>
        </div>
        <div>
          <strong>{Math.round(data.similarity_to_training.compound * 100)}%</strong>
          <span>compound match</span>
        </div>
        <div>
          <strong>{Math.round(data.similarity_to_training.protein * 100)}%</strong>
          <span>protein match</span>
        </div>
      </div>

      {specific.map((w) => (
        <div className="note warn" key={w}><Info /><span>{w}</span></div>
      ))}

      <div className="note" style={{ marginTop: '0.75rem' }}>
        <Info />
        <span>
          Confidence is a relative measure from repeated sampling, not a statistical interval.
          Computed in {data.took_seconds}s.
        </span>
      </div>
    </>
  )
}

export default function App() {
  const [models, setModels] = useState([])
  const [model, setModel] = useState('davis')
  const [smiles, setSmiles] = useState(EXAMPLES[0].smiles)
  const [sequence, setSequence] = useState(EXAMPLES[0].sequence)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [online, setOnline] = useState(null)
  const [history, setHistory] = useState([])
  const [structure, setStructure] = useState(null)

  const loadHistory = useCallback(() => {
    getHistory(6).then((h) => setHistory(h.history)).catch(() => {})
  }, [])

  useEffect(() => {
    getHealth().then(() => setOnline(true)).catch(() => setOnline(false))
    getModels().then((m) => setModels(m.models)).catch(() => {})
    loadHistory()
  }, [loadHistory])

  const current = models.find((m) => m.name === model)
  const residues = sequence.replace(/\s+/g, '').length

  async function run(event) {
    event.preventDefault()
    setBusy(true); setError(null); setResult(null); setStructure(null)
    const clean = sequence.replace(/\s+/g, '')
    try {
      setResult(await predict(smiles, clean, model))
      loadHistory()
      // look up a real solved structure for this exact pair; never blocks the score
      getStructure(smiles, clean).then(setStructure).catch(() => setStructure(null))
    } catch (problem) {
      setError(problem.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Backdrop />
      <div className="app">
        <nav className="nav">
          <a className="brand" href="#top"><span className="brand-dot" />Perceiver CPI</a>
          <div className="nav-links">
            <a href="#predict">Predict</a>
            <a href="#models">Models</a>
            <a href="#structure">Structure</a>
          </div>
          <div className={`status ${online === true ? 'up' : online === false ? 'down' : ''}`} style={{ marginLeft: '1.5rem' }}>
            <i />{online === true ? 'Connected' : online === false ? 'Offline' : 'Connecting'}
          </div>
        </nav>

        {/* ------------------------------------------------ hero */}
        <header className="wrap hero" id="top">
          <div className="hero-grid">
            <div>
              <span className="tag">Compound–protein interaction</span>
              <h1>Predict binding<br />affinity in <b>seconds</b>.</h1>
              <p className="lede">
                A nested cross-attention network that reads a molecule and a protein sequence
                together, and returns a quantitative affinity score across three benchmark scales.
              </p>
              <div className="hero-actions">
                <a href="#predict"><button type="button">Run a prediction</button></a>
                <a href="#models"><button type="button" className="sec">Compare models</button></a>
              </div>
              <div className="hero-stats">
                <div><strong>3</strong><span>trained models</span></div>
                <div><strong>183k</strong><span>measured pairs</span></div>
                <div><strong>~1s</strong><span>per prediction</span></div>
              </div>
            </div>
            <Viewer3D pdbId="1M17" controls={false} />
          </div>
        </header>

        {/* ------------------------------------------------ predict */}
        <section className="wrap sec" id="predict">
          <div className="sec-head">
            <span className="tag">Workspace</span>
            <h2>Run a prediction</h2>
            <p>Enter a compound as SMILES and a protein as its amino-acid sequence.</p>
          </div>

          <div className="grid-2">
            <form className="card" onSubmit={run}>
              <div className="card-head">
                <h3>Input</h3>
                <div className="btn-row">
                  {EXAMPLES.map((ex, i) => (
                    <button type="button" className="sec sm" key={ex.name}
                      onClick={() => { setSmiles(ex.smiles); setSequence(ex.sequence); setResult(null); setError(null) }}>
                      {ex.short}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card-pad">
                <div className="field">
                  <label htmlFor="m">Model</label>
                  <select id="m" value={model} onChange={(e) => { setModel(e.target.value); setResult(null) }}>
                    {models.length === 0 && <option value="davis">Davis</option>}
                    {models.map((m) => <option key={m.name} value={m.name}>{m.label} · {m.unit}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="s">Compound <span className="right">SMILES</span></label>
                  <textarea id="s" rows={2} value={smiles} spellCheck="false"
                    onChange={(e) => setSmiles(e.target.value)} placeholder="CC(=O)Oc1ccccc1C(=O)O" />
                </div>
                <div className="field">
                  <label htmlFor="q">
                    Protein
                    <span className="right" style={{ color: residues > 499 ? 'var(--mid)' : undefined }}>
                      {residues ? `${residues} residues` : 'sequence'}
                    </span>
                  </label>
                  <textarea id="q" rows={7} value={sequence} spellCheck="false"
                    onChange={(e) => setSequence(e.target.value)} placeholder="MKKFFDSRRE…" />
                </div>
                <div className="btn-row">
                  <button type="submit" disabled={busy || !smiles.trim() || !sequence.trim()}>
                    {busy ? 'Predicting…' : 'Predict affinity'}
                  </button>
                  <button type="button" className="sec" onClick={() => { setSmiles(''); setSequence(''); setResult(null); setError(null) }}>
                    Clear
                  </button>
                </div>
                {online === false && (
                  <div className="note err"><Info /><span>
                    Backend not reachable. Start it with <code className="mono">uvicorn backend.app:app --port 8000</code>
                  </span></div>
                )}
              </div>
            </form>

            <div className="card">
              <div className="card-head">
                <h3>Result</h3>
                {current && <span className="small dim mono">{current.unit}</span>}
              </div>
              <div className="card-pad">
                {busy && <div className="empty"><div className="spinner" /><span>Running the model…</span></div>}
                {!busy && error && <div className="note err"><Info /><span>{error}</span></div>}
                {!busy && !error && !result && (
                  <div className="empty"><span>Results appear here.</span>
                    <span className="small">The first run takes a moment while the model loads.</span></div>
                )}
                {!busy && result && <Result data={result} model={current} />}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ models */}
        <section className="wrap sec" id="models">
          <div className="sec-head">
            <span className="tag">Models</span>
            <h2>Three scales, three models</h2>
            <p>
              Each model is trained on a different benchmark, so each answers in its own units.
              Scores from different models are not interchangeable.
            </p>
          </div>

          <div className="grid-3">
            {['davis', 'kiba', 'metz'].map((key) => {
              const g = DATASET_GUIDE[key]
              const live = models.find((m) => m.name === key)
              return (
                <div className={`card card-pad model-card ${model === key ? 'on' : ''}`} key={key}
                  onClick={() => setModel(key)} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setModel(key) }}>
                  <div className="top">
                    <h3>{g.title}</h3>
                    <span className="unit">{live?.unit ?? ''}</span>
                  </div>
                  <p>{g.pick}</p>
                  <div className="spec">
                    <div><span>Compounds</span><strong>{live ? live.trained_on.compounds.toLocaleString() : '—'}</strong></div>
                    <div><span>Proteins</span><strong>{live ? live.trained_on.proteins : '—'}</strong></div>
                    <div><span>Strong at</span><strong>{live ? `≥${live.bands.strong}` : '—'}</strong></div>
                  </div>
                </div>
              )
            })}
          </div>

          {models.length > 0 && (
            <div className="card" style={{ marginTop: '1.1rem' }}>
              <div className="card-head"><h3>Benchmark performance</h3>
                <span className="small dim">novel-pair split · lower is better</span></div>
              <div className="card-pad" style={{ paddingTop: '0.9rem' }}>
                <table>
                  <thead><tr><th>Model</th><th>Mean squared error</th><th>Reference implementation</th><th>Measures</th></tr></thead>
                  <tbody>
                    {models.map((m) => (
                      <tr key={m.name}>
                        <td style={{ fontWeight: 500 }}>{m.label}</td>
                        <td className="n">{m.accuracy.our_test_mse}</td>
                        <td className="n dim">{m.accuracy.paper_test_mse}</td>
                        <td className="muted small">{DATASET_GUIDE[m.name]?.measures}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="note" style={{ marginTop: '1rem' }}>
                  <Info />
                  <span>
                    Evaluated where both the compound and the protein were unseen during training —
                    the strictest setting. Models are trained on kinase inhibitors and kinase
                    targets, and are most reliable for compounds resembling that chemistry.
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ------------------------------------------------ structure */}
        <section className="wrap sec" id="structure">
          <div className="sec-head">
            <span className="tag">Structure</span>
            <h2>{structure ? LEVEL_TEXT[structure.level].title : 'Binding pose'}</h2>
            <p>
              {structure
                ? LEVEL_TEXT[structure.level].note
                : 'Run a prediction and this panel searches for a real, experimentally solved structure of your pair.'}
            </p>
          </div>
          <div className="grid-2">
            <Viewer3D
              pdbId={structure?.pdb_ids?.[0] || '1M17'}
              ligandCode={structure?.ligand_code || null}
              height="tall"
            />
            <div className="card card-pad">
              <h3>
                {structure?.pdb_ids?.length
                  ? <>PDB <span className="mono">{structure.pdb_ids[0].toUpperCase()}</span></>
                  : 'EGFR kinase domain with erlotinib'}
              </h3>
              <p className="muted small" style={{ marginTop: '0.5rem' }}>
                {structure?.pdb_ids?.length
                  ? 'Retrieved from the RCSB Protein Data Bank. Rotate to see how the ligand sits inside the pocket.'
                  : 'PDB 1M17 — erlotinib in the ATP-binding cleft, the pocket most kinase inhibitors compete for. Shown as a reference until you run a prediction.'}
              </p>
              <div className="spec" style={{ flexDirection: 'column', gap: '0.7rem' }}>
                <div><span>Source</span><strong>{structure ? 'BindingDB → RCSB PDB' : 'RCSB PDB'}</strong></div>
                <div><span>Ligand code</span><strong>{structure?.ligand_code || '—'}</strong></div>
                <div><span>Other entries</span><strong>
                  {structure?.pdb_ids?.length > 1
                    ? structure.pdb_ids.slice(1, 5).join(', ').toUpperCase()
                    : '—'}
                </strong></div>
              </div>
              <div className="note" style={{ marginTop: '1rem' }}>
                <Info />
                <span>
                  Structures are looked up, never predicted. Pairs with nothing on record go to
                  docking through <span className="mono">POST /predict-3d</span>.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ history */}
        {history.length > 0 && (
          <section className="wrap sec" id="history" style={{ paddingTop: 0 }}>
            <div className="card">
              <div className="card-head"><h3>Recent predictions</h3></div>
              <div className="card-pad" style={{ padding: '0.6rem' }}>
                {history.map((row) => (
                  <div className="hrow" key={row.id}>
                    <span className="small dim" style={{ textTransform: 'capitalize' }}>{row.model}</span>
                    <code>{row.smiles}</code>
                    <span className="small dim mono">{row.sequence_length}aa</span>
                    <strong className="mono" style={{ fontSize: '0.88rem' }}>{row.score.toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <footer>
          <div className="wrap">
            <span>Perceiver CPI · Group G1590</span>
            <span>Nguyen et al., Bioinformatics 39(1), 2023 · 3D viewer by 3Dmol.js</span>
          </div>
        </footer>
      </div>
    </>
  )
}
