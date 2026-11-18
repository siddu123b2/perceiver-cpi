/** Everything that talks to the FastAPI backend.
 *
 * In development Vite proxies /api to http://127.0.0.1:8000 (see vite.config.js), so the browser
 * only ever talks to one origin. Set VITE_API_BASE to point somewhere else if the backend moves.
 */
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

async function request(path, options) {
  let response
  try {
    response = await fetch(BASE + path, options)
  } catch {
    throw new Error('Could not reach the prediction server. Is the backend running on port 8000?')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    // FastAPI puts the message in `detail`, which is a string for our validation errors
    // and an object for the 3D placeholder.
    const detail = body?.detail
    throw new Error(typeof detail === 'string' ? detail : detail?.message || `Request failed (${response.status})`)
  }
  return body
}

export const getHealth = () => request('/health')
export const getModels = () => request('/models')
export const getHistory = (limit = 8) => request(`/history?limit=${limit}`)

export const predict = (smiles, sequence, model) =>
  request('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smiles, sequence, model }),
  })

/** Looks up a real solved structure for this pair. Never predicts - see backend/structures.py. */
export const getStructure = (smiles, sequence) =>
  request('/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smiles, sequence }),
  })

/** Reserved for pose prediction by docking. The backend answers 501 today, on purpose. */
export const predict3d = (smiles, sequence) =>
  request('/predict-3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ smiles, sequence }),
  })
