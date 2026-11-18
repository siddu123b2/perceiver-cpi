"""FastAPI backend for the Perceiver CPI binding-affinity app.

Run it from the project root:

    .venv\\Scripts\\python.exe -m uvicorn backend.app:app --reload --port 8000

Then open http://127.0.0.1:8000/docs for an interactive page listing every endpoint.

    GET  /health       is the server up, and are the models loadable
    GET  /models       what the dropdown should offer, with each model's honest accuracy
    POST /predict      the real thing: smiles + sequence + model -> score, confidence, band
    GET  /history      recent predictions, newest first
    POST /predict-3d   placeholder for the 3D branch, returns 501 (not built in this phase)

The first /predict is slow (a few seconds) because the model loads then; after that it is cached in
memory and responses are fast.
"""
import json
import os
import sqlite3
import sys
import time
from contextlib import asynccontextmanager, closing
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'model_2d'))

import predict_api                                        # noqa: E402
from backend import advisor, structures                    # noqa: E402

DB_PATH = Path(__file__).resolve().parent / 'history.db'

@asynccontextmanager
async def lifespan(_app):
    """Load the models before the server accepts requests.

    Loading happens on first use otherwise, which makes the very first prediction take ~14 seconds
    while every later one takes ~1.2. That is a poor surprise in a live demo, so we pay the cost at
    startup instead: the server takes longer to come up and is then uniformly fast. Set
    PERCEIVER_PRELOAD=0 to skip it (handy with --reload, which restarts on every edit).
    """
    if os.environ.get('PERCEIVER_PRELOAD', '1') != '0':
        for name in predict_api.registry():
            try:
                predict_api._load(name)
                print(f'  loaded model: {name}')
            except Exception as error:                    # a missing checkpoint must not stop boot
                print(f'  could NOT load model {name}: {error}')
    yield


app = FastAPI(
    lifespan=lifespan,
    title='Perceiver CPI — compound–protein binding affinity',
    version='1.0',
    description='Predicts how strongly a compound binds a protein, using the Perceiver CPI model '
                '(Nguyen et al., Bioinformatics 2023). Each dataset has its own scale, so scores '
                'from different models must never be compared with each other.')

# The frontend runs on a different port during development, so the browser needs permission.
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173',
                   'http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_credentials=False, allow_methods=['*'], allow_headers=['*'])


# ----------------------------------------------------------------- history (SQLite)

def connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    """SQLite, not MongoDB: the group's design calls for MongoDB, but CLAUDE.md section 6 allows
    SQLite for the basic version and it needs no server to be installed or running."""
    with closing(connect()) as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT    NOT NULL,
                model      TEXT    NOT NULL,
                smiles     TEXT    NOT NULL,
                sequence   TEXT    NOT NULL,
                score      REAL    NOT NULL,
                unit       TEXT    NOT NULL,
                confidence REAL    NOT NULL,
                band       TEXT    NOT NULL,
                result     TEXT    NOT NULL
            )""")
        connection.commit()


def save_history(result, smiles, sequence):
    with closing(connect()) as connection:
        connection.execute(
            'INSERT INTO history (created_at, model, smiles, sequence, score, unit, confidence,'
            ' band, result) VALUES (?,?,?,?,?,?,?,?,?)',
            (datetime.now(timezone.utc).isoformat(timespec='seconds'), result['model'], smiles,
             sequence, result['score'], result['unit'], result['confidence'], result['band'],
             json.dumps(result)))
        connection.commit()


init_db()


# ----------------------------------------------------------------- request / response shapes

class PredictRequest(BaseModel):
    smiles: str = Field(..., description='The compound, as SMILES. Example: CC(=O)Oc1ccccc1C(=O)O',
                        examples=['CC(=O)Oc1ccccc1C(=O)O'])
    sequence: str = Field(..., description='The protein, as an amino-acid sequence.')
    model: str = Field('davis', description='davis, kiba or metz. Each uses a different scale.')


class Predict3DRequest(BaseModel):
    smiles: str
    sequence: str


# ----------------------------------------------------------------- endpoints

@app.get('/health', summary='Is the server up?')
def health():
    try:
        models = sorted(predict_api.registry())
        loadable = True
        detail = None
    except Exception as error:                            # registry missing or unreadable
        models, loadable, detail = [], False, str(error)
    return {'status': 'ok' if loadable else 'degraded',
            'models': models,
            'models_loadable': loadable,
            'detail': detail,
            'time': datetime.now(timezone.utc).isoformat(timespec='seconds')}


@app.get('/models', summary='What the model dropdown should offer')
def models():
    """Each model with its unit, its band thresholds, and how accurate it honestly is."""
    out = []
    for name, spec in predict_api.available_models().items():
        out.append({
            'name': name,
            'label': name.upper(),
            'unit': spec['unit'],
            'description': spec['description'],
            'bands': {'strong': spec['bands']['strong'], 'moderate': spec['bands']['moderate'],
                      'source': spec['bands']['source']},
            'accuracy': {
                'our_test_mse': spec['test_mse'],
                'paper_test_mse': spec['paper_mse'],
                'guess_the_average_mse': spec['guess_average_mse'],
                'note': 'Mean squared error on the novel-pair test set (a compound and a protein '
                        'the model never saw). Lower is better. Our model is worse than the '
                        'published paper; see models/<name>/model_card.md for why.'},
            'trained_on': spec['trained_on'],
        })
    return {'models': out,
            'warning': 'Scores from different models are on different scales and must never be '
                       'compared with one another.'}


@app.post('/predict', summary='Predict binding affinity for one compound and one protein')
def predict(request: PredictRequest):
    started = time.perf_counter()
    try:
        result = predict_api.predict(request.smiles, request.sequence, request.model)
    except predict_api.InvalidInput as error:
        raise HTTPException(status_code=422, detail=str(error))
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error))
    result['took_seconds'] = round(time.perf_counter() - started, 2)
    try:
        save_history(result, request.smiles, request.sequence)
    except sqlite3.Error:
        result['warnings'] = result['warnings'] + ['This prediction could not be saved to history.']
    return result


@app.get('/history', summary='Recent predictions, newest first')
def history(limit: int = Query(20, ge=1, le=200)):
    with closing(connect()) as connection:
        rows = connection.execute(
            'SELECT id, created_at, model, smiles, score, unit, confidence, band, sequence'
            ' FROM history ORDER BY id DESC LIMIT ?', (limit,)).fetchall()
    return {'count': len(rows),
            'history': [{**dict(row),
                         'sequence_preview': row['sequence'][:40] + ('...' if len(row['sequence']) > 40 else ''),
                         'sequence_length': len(row['sequence']),
                         'sequence': None}
                        for row in rows]}


@app.post('/advise', summary='Which model suits this pair, and why')
def advise(request: Predict3DRequest):
    """Measured, not generated: see backend/advisor.py."""
    try:
        return advisor.advise(request.smiles, request.sequence)
    except predict_api.InvalidInput as error:
        raise HTTPException(status_code=422, detail=str(error))


@app.post('/structure', summary='A real solved structure for this pair, if one exists')
def structure(request: Predict3DRequest):
    """Looks the pair up in BindingDB rather than predicting anything. See backend/structures.py
    for what the three answer levels mean."""
    try:
        found = structures.find(request.smiles, request.sequence)
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
    return found


@app.get('/structure/coverage', summary='How much of the structure index is loaded')
def structure_coverage():
    return structures.stats()


@app.post('/predict-3d', status_code=501, summary='3D binding pose — not built yet')
def predict_3d(request: Predict3DRequest):
    """Deliberately not implemented. The 3D branch (structure prediction, docking, 3D viewer) is
    the next phase and is being built separately; this endpoint exists so the frontend can show
    its placeholder panel and so the interface is already agreed."""
    raise HTTPException(
        status_code=501,
        detail={'message': '3D binding pose — coming in the next phase.',
                'implemented': False,
                'planned_response': {'pdb': '<predicted complex structure, PDB format>',
                                     'docking_score': 'float',
                                     'pose_confidence': 'float'}})
