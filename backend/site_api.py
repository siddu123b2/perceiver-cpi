"""The /api/* endpoints the cpi.html front end calls.

That page was written against the project partner's 3D demo backend. This module implements the
same contract on top of our own trained models, so the page works as the project's real interface:

  POST /api/predict          affinity score for a pair, plus whether a solved structure exists
  GET  /api/pairs            browse and search the cleaned Davis / KIBA / Metz data
  GET  /api/pairs/{id}       one pair, with the laboratory measurements behind it
  POST /api/jobs             the docking job. Honest 503 until the 3D service is connected.
  GET  /api/coverage         how much of the data has a solved structure

Field names and shapes are dictated by cpi.js and are not ours to choose: `score_label`,
`source_measurements`, `sequence_limit` and so on are read directly by that file.
"""
import hashlib
import os
import sys
from functools import lru_cache
from pathlib import Path

import httpx
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'model_2d'))

import predict_api                      # noqa: E402
from backend import advisor, assistant, structures  # noqa: E402

router = APIRouter(prefix='/api')

DATASETS = ('davis', 'kiba', 'metz')
DOCKING_TIMEOUT = 900.0          # folding plus docking can take ten minutes
SEQUENCE_LIMIT = 499                    # residues the model actually reads
PAGE = 50


class AssistRequest(BaseModel):
    context: dict = {}
    question: str = ''


class Query2D(BaseModel):
    dataset: str = 'davis'
    smiles: str = ''
    sequence: str = ''
    method: str = 'lookup'


@lru_cache(maxsize=4)
def table(name):
    """The cleaned dataset, with a stable id per row so the page can link back to it."""
    if name not in DATASETS:
        raise HTTPException(status_code=404, detail=f'Unknown dataset {name!r}')
    frame = pd.read_csv(ROOT / 'data' / f'{name}.csv')
    frame['id'] = [
        hashlib.md5(f'{s}|{q}'.encode()).hexdigest()[:12]
        for s, q in zip(frame['smiles'], frame['sequence'])
    ]
    return frame


def measurements_for(name, smiles, sequence):
    """Every laboratory value recorded for this exact pair, so a prediction can be checked."""
    frame = table(name)
    rows = frame[(frame['smiles'] == smiles) & (frame['sequence'] == sequence)]
    return [{'original_score': round(float(r.label), 4), 'row_id': int(i)}
            for i, r in rows.iterrows()]


@router.get('/pairs')
def pairs(dataset: str = 'davis', q: str = '', matched: bool = False, offset: int = 0):
    """Search the dataset. `matched` keeps only pairs we can show a real structure for.

    A search looks through the WHOLE dataset, not a window of it - with 30k to 118k rows per
    dataset, scanning a slice meant a specific compound would usually not be found. Only the
    unfiltered browse is paged, since there is nothing to search for there.
    """
    frame = table(dataset)
    if q:
        needle = q.strip()
        frame = frame[frame['smiles'].str.contains(needle, case=False, regex=False)
                       | frame['sequence'].str.upper().str.contains(needle.upper(), regex=False)]
        total = len(frame)
        frame = frame.iloc[offset:]
    else:
        total = len(frame)
        frame = frame.iloc[offset:]

    found = []
    for _, row in frame.iterrows():
        if matched:
            hit = structures.find(row['smiles'], row['sequence'])
            available = hit['level'] in ('exact_complex', 'same_target', 'same_compound')
            if not available:
                continue
        else:
            available = None            # not looked up: checking every row would be far too slow
        found.append({
            'id': row['id'],
            'smiles': row['smiles'],
            'sequence_preview': row['sequence'][:28] + '…',
            'pose_available': available,
            'total_matches': total,
        })
        if len(found) >= PAGE:
            break
    return found


@router.get('/pairs/{pair_id}')
def pair(pair_id: str, dataset: str = 'davis'):
    frame = table(dataset)
    rows = frame[frame['id'] == pair_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail='No such pair in this dataset.')
    row = rows.iloc[0]
    return {
        'id': pair_id,
        'smiles': row['smiles'],
        'sequence': row['sequence'],
        'measurements': measurements_for(dataset, row['smiles'], row['sequence']),
    }


@router.post('/predict')
def predict(request: Query2D):
    """The affinity score, in the shape cpi.js expects."""
    dataset = request.dataset if request.dataset in DATASETS else 'davis'
    try:
        result = predict_api.predict(request.smiles, request.sequence, dataset)
    except predict_api.InvalidInput as error:
        raise HTTPException(status_code=422, detail=str(error))
    except FileNotFoundError as error:
        # The usual cause: the trained weights were never copied in, or landed in the wrong
        # folder. Without this the browser gets a bare 500 and shows "Internal Server Error",
        # which tells the user nothing.
        raise HTTPException(
            status_code=503,
            detail=f'The {dataset} model files are missing: {error}. The weights are not in the '
                   f'git repository - copy the models folder in so the files sit at '
                   f'models/{dataset}/model_0.pt, then restart the server. '
                   f'Run: python check_setup.py')
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f'The prediction failed: {type(error).__name__}: {error}')

    sequence = ''.join(request.sequence.split())
    structure = structures.find(request.smiles, sequence)
    suggestion = advisor.advise(request.smiles, sequence)

    return {
        'score': result['score'],
        'score_label': result['unit'],
        'band': result['band'],
        'confidence': result['confidence'],
        'confidence_label': result['confidence_label'],
        'dataset': dataset,
        'bands': {'strong': predict_api.registry()[dataset]['bands']['strong'],
                  'moderate': predict_api.registry()[dataset]['bands']['moderate']},
        'source_measurements': measurements_for(dataset, request.smiles, sequence),
        'truncated': len(sequence) > SEQUENCE_LIMIT,
        'sequence_limit': SEQUENCE_LIMIT,
        'sequence_tokens': len(sequence),
        'similarity_to_training': result['similarity_to_training'],
        'warnings': result['warnings'],
        'structure': structure,
        'advice': {
            'recommended': suggestion['recommended'],
            'confidence': suggestion['confidence'],
            'summary': suggestion['summary'],
            'options': suggestion['options'],
        },
    }


# Docking runs in the partner's service (AutoDock Vina, P2Rank, PLIP). Point this at it and the
# job endpoints forward there; leave it unset and they say so honestly instead of faking a job.
#   $env:PERCEIVER_DOCKING_URL = "http://192.168.1.42:8010"
DOCKING_URL = os.environ.get('PERCEIVER_DOCKING_URL', '').rstrip('/')
NOT_CONNECTED = ('Pose prediction by docking is not connected to this server. A solved '
                 'experimental structure is shown instead when one exists. To connect it, set '
                 'PERCEIVER_DOCKING_URL - see docs/3D_INTEGRATION.md.')


def _forward(method, path, json_body=None):
    """Pass a job request through to the docking service, unchanged."""
    if not DOCKING_URL:
        raise HTTPException(status_code=503, detail=NOT_CONNECTED)
    try:
        with httpx.Client(timeout=DOCKING_TIMEOUT) as client:
            response = client.request(method, f'{DOCKING_URL}{path}', json=json_body)
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=503,
            detail=f'The docking service at {DOCKING_URL} did not answer ({error}). Check it is '
                   f'running with --host 0.0.0.0 and that both machines are on the same network.')
    if response.status_code >= 400:
        try:
            detail = response.json().get('detail', response.text[:200])
        except ValueError:
            detail = response.text[:200]
        raise HTTPException(status_code=response.status_code, detail=detail)
    return response.json()


@router.get('/docking/status')
def docking_status():
    """Is a docking service configured, and is it answering?"""
    if not DOCKING_URL:
        return {'connected': False, 'url': None, 'detail': NOT_CONNECTED}
    try:
        with httpx.Client(timeout=5.0) as client:
            ok = client.get(f'{DOCKING_URL}/api/complexes').status_code < 500
        return {'connected': ok, 'url': DOCKING_URL,
                'detail': 'Reachable.' if ok else 'Configured but returning errors.'}
    except httpx.HTTPError as error:
        return {'connected': False, 'url': DOCKING_URL, 'detail': f'Not reachable: {error}'}


@router.post('/jobs')
def jobs(request: Query2D):
    """Start a docking job on the partner's service."""
    return _forward('POST', '/api/jobs', request.model_dump())


@router.get('/jobs/{job_id}')
def job_status(job_id: str):
    return _forward('GET', f'/api/jobs/{job_id}')


@router.get('/coverage')
def coverage():
    stats = structures.stats()
    return {
        'processed': stats.get('source_rows', 0),
        'valid_pairs': stats.get('exact_pairs', 0),
        'pose_ready_pairs': stats.get('exact_pairs', 0),
        'animation_ready_pairs': 0,
        'structures': stats,
        'datasets': {name: int(len(table(name))) for name in DATASETS},
    }


@router.post('/assist')
def assist(request: AssistRequest):
    """Explain a result, or answer a question about it. Grounded - see backend/assistant.py."""
    return assistant.ask(request.context, request.question)


@router.get('/assist/status')
def assist_status():
    return {'available': assistant.available(), 'model': assistant.MODEL}
