"""Tests for the backend.

  .venv\\Scripts\\python.exe -m pytest backend -v

The real prediction tests load the model, so the first one takes a few seconds. They use a compound
and protein taken from the Davis test set, which the model has never been trained on.
"""
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.app import app   # noqa: E402

client = TestClient(app)

# A compound and protein taken verbatim from the Davis novel-pair TEST set, so the model has
# never been trained on this pair. The sequence contains X, which is a real character in TAPE's
# vocabulary and appears in 68 Davis rows.
SMILES = 'CCCS(=O)(=O)Nc1ccc(F)c(C(=O)c2c[nH]c3ncc(Cl)cc23)c1F'
SEQUENCE = (
    'LKMNKLPSNRGNTLREVQLMNRLRHPNILRFMGVCVHQGQLHALTEYMNGGTLEXLLSSPEPLSWPVRLHLALDIARGLRYLHSKG'
    'VFHRDLTSKNCLVRREDRGFTAVVGDFGLAEKIPVYREGARKEPLAVVGSPYWMAPEVLRGELYDEKADVFAFGIVLCELIARVPA'
    'DPDYLPRTEDFGLDVPAFRTLVGDDCPLPFLLLAIHCCNLEPSTRAPFTEITQHLEWILEQLPEPAPLTXTA')


def test_health():
    response = client.get('/health')
    assert response.status_code == 200
    body = response.json()
    assert body['status'] == 'ok'
    assert body['models_loadable'] is True
    assert set(body['models']) == {'davis', 'kiba', 'metz'}


def test_models_lists_all_three_with_honest_accuracy():
    body = client.get('/models').json()
    names = {model['name'] for model in body['models']}
    assert names == {'davis', 'kiba', 'metz'}
    for model in body['models']:
        assert model['unit'] in {'pKd', 'pKi', 'KIBA score'}
        # every model must own up to being worse than the paper
        assert model['accuracy']['our_test_mse'] > model['accuracy']['paper_test_mse']
        assert model['bands']['strong'] > model['bands']['moderate']
    assert 'never be compared' in body['warning']


def test_predict_returns_a_usable_answer():
    response = client.post('/predict', json={'smiles': SMILES, 'sequence': SEQUENCE,
                                             'model': 'davis'})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body['unit'] == 'pKd'
    assert 4.0 < body['score'] < 12.0, f'score {body["score"]} is outside the Davis label range'
    assert body['band'] in {'strong binder', 'moderate binder', 'weak binder'}
    assert body['confidence'] >= 0
    assert body['confidence_label'] in {'low', 'medium', 'high', None}
    assert 'NOT a 95%' in body['confidence_note']
    # the protein caveat must always be shown
    assert any('proteins' in warning for warning in body['warnings'])


def test_same_input_gives_the_same_answer():
    payload = {'smiles': SMILES, 'sequence': SEQUENCE, 'model': 'davis'}
    first = client.post('/predict', json=payload).json()
    second = client.post('/predict', json=payload).json()
    assert first['score'] == second['score']
    assert first['confidence'] == second['confidence']


def test_an_input_from_the_dataset_is_not_flagged_as_an_extrapolation():
    """Both of these appear in the Davis data, so similarity must be 1.0 and no scope warning
    should fire."""
    body = client.post('/predict', json={'smiles': SMILES, 'sequence': SEQUENCE,
                                         'model': 'davis'}).json()
    assert body['similarity_to_training']['compound'] == 1.0
    assert body['similarity_to_training']['protein'] == 1.0
    assert not any('extrapolation' in w for w in body['warnings'])
    assert not any('trained on kinases' in w for w in body['warnings'])


def test_an_unrelated_protein_is_flagged():
    """Haemoglobin is not a kinase. The user must be told the answer is out of scope."""
    haemoglobin = ('MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAF'
                   'SDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH')
    body = client.post('/predict', json={'smiles': SMILES, 'sequence': haemoglobin,
                                         'model': 'davis'}).json()
    assert body['similarity_to_training']['protein'] < 0.1
    assert any('trained on kinases' in w for w in body['warnings'])


@pytest.mark.parametrize('payload, expected_in_message', [
    ({'smiles': 'not a molecule', 'sequence': SEQUENCE, 'model': 'davis'}, 'not a valid SMILES'),
    ({'smiles': SMILES, 'sequence': 'MKKF123XYZ!!', 'model': 'davis'}, 'not amino acids'),
    ({'smiles': SMILES, 'sequence': SEQUENCE, 'model': 'nonsense'}, 'Unknown model'),
    ({'smiles': '', 'sequence': SEQUENCE, 'model': 'davis'}, 'SMILES string'),
    ({'smiles': SMILES, 'sequence': 'MKKF', 'model': 'davis'}, 'residues long'),
    ({'smiles': SMILES, 'sequence': '>header\nMKKFF', 'model': 'davis'}, 'FASTA'),
])
def test_bad_input_is_rejected_with_a_helpful_message(payload, expected_in_message):
    response = client.post('/predict', json=payload)
    assert response.status_code == 422, response.text
    assert expected_in_message in response.json()['detail']


def test_history_records_predictions():
    before = client.get('/history').json()['count']
    client.post('/predict', json={'smiles': SMILES, 'sequence': SEQUENCE, 'model': 'davis'})
    body = client.get('/history').json()
    assert body['count'] >= min(before + 1, 20)
    newest = body['history'][0]
    assert newest['model'] == 'davis'
    assert newest['sequence_length'] == len(SEQUENCE)
    assert newest['sequence'] is None, 'the full sequence should not be sent back in the list'


def test_predict_3d_is_an_honest_placeholder():
    response = client.post('/predict-3d', json={'smiles': SMILES, 'sequence': SEQUENCE})
    assert response.status_code == 501
    detail = response.json()['detail']
    assert detail['implemented'] is False
    assert 'next phase' in detail['message']
