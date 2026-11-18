import { useCallback, useEffect, useRef, useState } from 'react'
import Backdrop from './Backdrop.jsx'
import { getHealth, getHistory, getModels, predict } from './api.js'
import { DATASET_GUIDE, EXAMPLES } from './datasets.js'

/** Fades a section in the first time it scrolls into view. */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { node.classList.add('seen'); observer.disconnect() } },
      { threshold: 0.12 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return ref
}

function Section({ id, children }) {
  return <section id={id} className="reveal" ref={useReveal()}>{children}</section>
}

/* ------------------------------------------------------------------ result */

function Result({ data }) {
  const bandClass = data.band.split(' ')[0]           // "strong binder" -> "strong"
  const quality = data.model_quality
  // How far the score sits along this model's own band scale, for the meter.
  const bands = data.bands ?? {}
  const low = bands.moderate ?? 0
  const high = bands.strong ?? 1
  const span = Math.max(0.001, (high - low) * 2.2)
  const progress = Math.max(4, Math.min(100, ((data.score - (low - span / 2)) / span) * 100))

  return (
    <div className="result">
      <div>
        <p className="eyebrow">Predicted affinity</p>
        <div className="score-line">
          <span className="score">{data.score.toFixed(2)}</span>
          <span className="score-unit">{data.unit}</span>
          <span className={`band ${bandClass}`}><i />{data.band}</span>
        </div>
      </div>

      <div className="meter"><span style={{ width: `${progress}%` }} /></div>

      <div className="readout">
        <div>
          <strong>± {data.confidence.toFixed(2)}</strong>
          <span>spread{data.confidence_label ? ` · ${data.confidence_label} confidence` : ''}</span>
        </div>
        <div>
          <strong>{Math.round(data.similarity_to_training.compound * 100)}%</strong>
          <span>compound familiarity</span>
        </div>
        <div>
          <strong>{Math.round(data.similarity_to_training.protein * 100)}%</strong>
          <span>protein familiarity</span>
        </div>
        <div>
          <strong>{data.took_seconds}s</strong>
          <span>computed in</span>
        </div>
      </div>

      <p className="muted">
        The ± is the spread of 30 predictions made with dropout left on. <b>It is not a 95%
        confidence interval</b> — measured coverage is 33–63%. Read it as a relative signal only.
      </p>

      {quality && (
        <p className="muted">
          This model scores <b>{quality.our_test_mse}</b> mean squared error on unseen
          compound–protein pairs, against <b>{quality.paper_test_mse}</b> for the published model
          and <b>{quality.guess_average_mse}</b> for simply predicting the dataset average.
        </p>
      )}

      {data.warnings?.length > 0 && (
        <div className="notes">
          {data.warnings.map((w) => (
            <p className="note" key={w}><b>!</b><span>{w}</span></p>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ app */

export default function App() {
  const [models, setModels] = useState([])
  const [model, setModel] = useState('davis')
  const [smiles, setSmiles] = useState('')
  const [sequence, setSequence] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [online, setOnline] = useState(null)
  const [history, setHistory] = useState([])

  const refreshHistory = useCallback(() => {
    getHistory(6).then((h) => setHistory(h.history)).catch(() => {})
  }, [])

  useEffect(() => {
    getHealth().then(() => setOnline(true)).catch(() => setOnline(false))
    getModels().then((m) => setModels(m.models)).catch(() => {})
    refreshHistory()
  }, [refreshHistory])

  const chosen = models.find((m) => m.name === model)

  async function run(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const answer = await predict(smiles, sequence.replace(/\s+/g, ''), model)
      setResult({ ...answer, bands: chosen?.bands })
      refreshHistory()
      // bring the answer into view on a phone, where it lands below the fold
      requestAnimationFrame(() => {
        document.getElementById('answer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      })
    } catch (problem) {
      setError(problem.message)
    } finally {
      setBusy(false)
    }
  }

  function loadExample(index) {
    setSmiles(EXAMPLES[index].smiles)
    setSequence(EXAMPLES[index].sequence)
    setResult(null)
    setError(null)
  }

  return (
    <>
      <Backdrop />

      <header className="site-header">
        <a className="logo" href="#home">perceiver<sup>CPI</sup></a>
        <nav className="site-nav">
          <a href="#workspace">Predict</a>
          <a href="#datasets">Models</a>
          <a href="#method">Method</a>
          <a href="#structure">3D</a>
        </nav>
      </header>

      <div className="shell">
        <section className="hero" id="home">
          <p className="eyebrow">Compound–protein interaction · Group G1590</p>
          <h1>
            <span>How tightly</span>
            <span>does it <em>bind?</em></span>
          </h1>
          <p className="lede">
            Give the model a compound and a protein. It returns a binding-affinity score, a plain
            reading of what that means, and — just as importantly — an honest account of how much
            to trust it.
          </p>
          <div className="hero-foot">
            <div className="row">
              <a href="#workspace"><button type="button">Start predicting</button></a>
              <a href="#datasets"><button type="button" className="ghost">Which model?</button></a>
            </div>
            <div className="scroll-cue"><i />Scroll</div>
          </div>
        </section>

        {/* ----------------------------------------------------- workspace */}
        <Section id="workspace">
          <p className="eyebrow">01 / The prediction</p>
          <h2>Your <em>pair</em>.</h2>
          <p className="lede" style={{ marginBottom: '2.4rem' }}>
            A compound as SMILES, a protein as its amino-acid sequence, and the model to ask.
          </p>

          <div className="grid two" style={{ alignItems: 'start' }}>
            <form className="panel" onSubmit={run}>
              <div style={{ marginBottom: '1.3rem' }}>
                <label htmlFor="model">Model</label>
                <select id="model" value={model} onChange={(e) => { setModel(e.target.value); setResult(null) }}>
                  {models.length === 0 && <option value="davis">Davis</option>}
                  {models.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.label} — predicts {m.unit}
                    </option>
                  ))}
                </select>
                {chosen && <p className="muted" style={{ marginTop: '0.5rem' }}>{DATASET_GUIDE[chosen.name]?.scaleNote}</p>}
              </div>

              <div style={{ marginBottom: '1.3rem' }}>
                <label htmlFor="smiles">Compound · SMILES</label>
                <textarea
                  id="smiles" rows={3} value={smiles} spellCheck="false"
                  onChange={(e) => setSmiles(e.target.value)}
                  placeholder="CC(=O)Oc1ccccc1C(=O)O"
                />
              </div>

              <div style={{ marginBottom: '1.3rem' }}>
                <label htmlFor="sequence">
                  Protein · amino-acid sequence
                  {sequence.length > 0 && <span style={{ float: 'right', color: sequence.replace(/\s+/g, '').length > 499 ? 'var(--warn)' : 'var(--text-3)' }}>
                    {sequence.replace(/\s+/g, '').length} residues
                  </span>}
                </label>
                <textarea
                  id="sequence" rows={6} value={sequence} spellCheck="false"
                  onChange={(e) => setSequence(e.target.value)}
                  placeholder="MKKFFDSRREQGGSGLGSGSSGGGGSTSGLGSGYIGRVFGIGRQQVTVDEVLAEGGFAIVFLVRTSNGMKCALKRMFVNNEHDLQVCKREIQIMRDLSGHKNIVGYIDSSINNVSSGDVWEVLILMDFCRGGQVVNLMNQRLQTGFTENEVLQIFCDTCEAVARLHQCKTPIIHRDLKVENILLHDRGHYVLCDFGSATNKFQNPQTEGVNAVEDEIKKYTTLSYRAPEMVNLYSGKIITTKADIWALGCLLYKLCYFTLPFGESQVAICDGNFTIPDNSRYSQDMHCLIRYMLEPDPDKRPDIYQVSYFSFKLLKKECPIPNVQNSPIPAKLPEPVKASEAAAKKTQPKARLTDPIPTTETSIAPRQRPKAGQTQPNPGILPIQPALTPRKRATVQPPPQAAGSSNQPGLLASVPQPKPQAPPSQPLPQTQAKQPQAPPTPQQTPSTQAQGLPAQAQATPQHQQQLFLKQQQQQQQPPPAQQQPAGTFYQQQQAQTQQFQAVHPATQKPAIAQFPVVSQGGSQQQLMQNFYQQQQQQQQQQQQQQLATALHQQQLMTQQAALQQKPTMAAGQQPQPQPAAAPQPAPAQEPAIQAPVRQQPKVQTTPPPAVQGQKVGSLTPPSSPKTQRAGHRRILSDVTHSAVFGVPASKSTQLLQAAAAEASLNKSKSATTTPSGSPRTSQQNVYNPSEGSTWNPFDDDNFSKLTAEELLNKDFAKLGEGKHPEKLGGSAESLIPGFQSTQGDAFATTSFSAGTAEKRKGGQTVDSGLPLLSVSDPFIPLQVPDAPEKLIEGLKSPDTSLLLPDLLPMTDPFGSTSDAVIEKADVAVESLIPGLEPPVPQRLPSQTESVTSNRTDSLTGEDSLLDCSLLSNPTTDLLEEFAPTAISAPVHKAAEDSNLISGFDVPEGSDKVAEDEFDPIPVLITKNPQGGHSRNSSGSSESSLPNLARSLLLVDQLIDL"
                />
              </div>

              <div className="row">
                <button type="submit" disabled={busy || !smiles.trim() || !sequence.trim()}>
                  {busy ? 'Predicting…' : 'Predict affinity'}
                </button>
                {EXAMPLES.map((example, index) => (
                  <button type="button" className="ghost tiny" key={example.name} onClick={() => loadExample(index)}>
                    {index === 0 ? 'Example 1' : 'Example 2'}
                  </button>
                ))}
              </div>
              {online === false && (
                <p className="note error-box" style={{ marginTop: '1rem' }}>
                  <b>!</b><span>The prediction server is not responding. Start it with
                  {' '}<code>uvicorn backend.app:app --port 8000</code></span>
                </p>
              )}
            </form>

            <div className="panel" id="answer" style={{ minHeight: '280px' }}>
              {!result && !error && !busy && (
                <div style={{ display: 'grid', placeItems: 'center', height: '100%', minHeight: '240px', textAlign: 'center' }}>
                  <p className="muted">Your result will appear here.<br />The first prediction takes a moment while the model wakes up.</p>
                </div>
              )}
              {busy && (
                <div style={{ display: 'grid', placeItems: 'center', height: '100%', minHeight: '240px' }}>
                  <p className="eyebrow">Reading the molecule…</p>
                </div>
              )}
              {error && <p className="note error-box"><b>!</b><span>{error}</span></p>}
              {result && <Result data={result} />}
            </div>
          </div>
        </Section>

        {/* ----------------------------------------------------- datasets */}
        <Section id="datasets">
          <p className="eyebrow">02 / Choosing a model</p>
          <h2>Three datasets.<br />Three <em>different</em> scales.</h2>
          <p className="lede" style={{ marginBottom: '2.4rem' }}>
            Each model learned from a different set of laboratory measurements, so each answers in
            its own units. <b>Never compare a score from one model with a score from another.</b>
          </p>

          <div className="grid three">
            {['davis', 'kiba', 'metz'].map((key) => {
              const guide = DATASET_GUIDE[key]
              const live = models.find((m) => m.name === key)
              return (
                <article
                  className={`panel ds ${model === key ? 'active' : ''}`}
                  key={key}
                  onClick={() => setModel(key)}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setModel(key) } }}
                >
                  <h3>{guide.title}</h3>
                  <p className="muted" style={{ marginTop: 0 }}>{guide.size}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>{guide.pick}</p>
                  <dl>
                    <dt>Measures</dt><dd style={{ fontFamily: 'var(--sans)' }}>{guide.measures}</dd>
                    <dt>Unit</dt><dd>{live?.unit ?? '—'}</dd>
                    <dt>Strong at</dt><dd>{live ? `≥ ${live.bands.strong}` : '—'}</dd>
                  </dl>
                  <p className="note" style={{ marginTop: '1rem' }}><b>!</b><span>{guide.watch}</span></p>
                </article>
              )
            })}
          </div>

          {models.length > 0 && (
            <div className="panel" style={{ marginTop: '1.6rem' }}>
              <p className="eyebrow" style={{ marginBottom: '1rem' }}>How accurate each one is, honestly</p>
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Our error</th>
                    <th>Published model</th>
                    <th>Guessing the average</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.name}>
                      <td>{m.label}</td>
                      <td className="num" style={{ color: 'var(--gold)' }}>{m.accuracy.our_test_mse}</td>
                      <td className="num">{m.accuracy.paper_test_mse}</td>
                      <td className="num" style={{ color: m.accuracy.our_test_mse > m.accuracy.guess_the_average_mse ? 'var(--error)' : 'var(--text-2)' }}>
                        {m.accuracy.guess_the_average_mse}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="muted" style={{ marginTop: '1rem' }}>
                Mean squared error on pairs where <b>both</b> the compound and the protein were new
                to the model — the hardest and most realistic test. Lower is better. All three are
                worse than the published model, and KIBA does not beat simply predicting the
                dataset average.
              </p>
            </div>
          )}
        </Section>

        {/* ----------------------------------------------------- method */}
        <Section id="method">
          <p className="eyebrow">03 / The method</p>
          <h2>How the model <em>reads</em> a pair.</h2>
          <div className="grid two" style={{ marginTop: '2rem' }}>
            <div className="panel">
              <h3>The compound, twice over</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)' }}>
                The molecule goes through a graph network that walks its atoms and bonds, and
                separately through its Morgan fingerprint — a list of the chemical patterns it
                contains. Cross-attention fuses the two views.
              </p>
            </div>
            <div className="panel">
              <h3>The protein, as a sequence</h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-2)' }}>
                The amino-acid chain is tokenised and passed through stacked 1D convolutions. A
                second, nested cross-attention block then lets the compound attend to the protein.
                <b> Only the first 499 residues are used</b>, which is how the published model works.
              </p>
            </div>
          </div>
          <p className="muted" style={{ marginTop: '1.6rem', maxWidth: '70ch' }}>
            Architecture from Nguyen, Jang, Kim &amp; Kang (2023), <i>Perceiver CPI: a nested
            cross-attention network for compound–protein interaction prediction</i>, Bioinformatics
            39(1). Our models are trained under a strict novel-pair split, where no test compound
            and no test protein appears in training.
          </p>
        </Section>

        {/* ----------------------------------------------------- 3D */}
        <Section id="structure">
          <p className="eyebrow">04 / Next phase</p>
          <h2>The <em>shape</em> of the binding.</h2>
          <div className="panel coming" style={{ marginTop: '2rem' }}>
            <div className="orb" />
            <h3>3D binding pose — coming in the next phase</h3>
            <p className="muted" style={{ maxWidth: '46ch' }}>
              Structure prediction, docking and an interactive viewer will live here. The backend
              endpoint <code>POST /predict-3d</code> already exists and answers 501, with the exact
              response shape the viewer will consume.
            </p>
          </div>
        </Section>

        {/* ----------------------------------------------------- history */}
        {history.length > 0 && (
          <Section id="history">
            <p className="eyebrow">Recent predictions</p>
            <div className="hist" style={{ marginTop: '1.4rem' }}>
              {history.map((row) => (
                <div className="hist-row" key={row.id}>
                  <span className="pill">{row.model}</span>
                  <code>{row.smiles}</code>
                  <span className="muted">{row.sequence_length} res</span>
                  <strong style={{ fontFamily: 'var(--mono)', color: 'var(--gold)' }}>
                    {row.score.toFixed(2)}
                  </strong>
                </div>
              ))}
            </div>
          </Section>
        )}

        <footer>
          <span>Perceiver CPI · Group G1590</span>
          <span>{online === true ? 'Server online' : online === false ? 'Server offline' : 'Checking…'}</span>
        </footer>
      </div>
    </>
  )
}
