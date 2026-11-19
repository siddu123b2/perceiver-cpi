"""The Assist button: explains a result in plain language, and answers questions about it.

Grounded, not open-ended. The model is given ONLY values this app computed - the score, the band
and its thresholds, how familiar the inputs are, the measured laboratory value when there is one,
and the residues and contacts found in the structure. It is instructed to answer from that alone
and to say "not available" otherwise.

That restriction is the whole point. Asked about binding pockets or interaction energies we have
not measured, an unconstrained model will invent residue numbers and distances very convincingly.
In a tool that reports scientific results, a confident invention is worse than a refusal.

Set the key in the environment; it is never written to a file:

    PowerShell:  $env:GEMINI_API_KEY = "..."
    bash:        export GEMINI_API_KEY=...
"""
import json
import os

import httpx

# Tried in order. Model names change and popular ones get overloaded (503), so the first that
# answers wins rather than the app failing because one name went stale or busy.
MODELS = ['gemini-flash-latest', 'gemini-3.7-flash', 'gemini-2.5-flash']
MODEL = MODELS[0]
BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
TIMEOUT = 45.0

SYSTEM = """You explain compound-protein binding predictions to a student using this app.

RULES, in order of importance:
1. Use ONLY the numbers in the DATA block. Never state a residue, distance, interaction energy,
   pocket or binding mechanism that is not in it. If asked for something not there, say plainly
   that the app did not measure it, and say what would be needed to get it.
2. Never invent a citation, a PDB entry, or an experimental value.
3. The score is a prediction from a model that is less accurate than the published one. Do not
   present it as established fact. If the data says the inputs are unlike the training set, say
   the prediction is an extrapolation.
4. The confidence label is relative, from repeated sampling with dropout. It is NOT a statistical
   confidence interval and must never be described as one.
5. Scores from different datasets are on different scales and must never be compared.

STYLE: plain English, short paragraphs, no bullet lists unless comparing options, no
preamble. Plain text only - no markdown, no LaTeX, no $pK_d$ notation; write pKd.
Around 120 words unless asked for more. Explain terms a final-year student might not know."""


def available():
    return bool(os.environ.get('GEMINI_API_KEY'))


def _facts(context):
    """Flatten the app's own output into the only thing the model is allowed to use."""
    lines = []
    if context.get('score') is not None:
        lines.append(f"Predicted affinity: {context['score']} {context.get('score_label', '')}")
        lines.append(f"Band: {context.get('band')} "
                     f"(this dataset calls >= {context.get('bands', {}).get('strong')} strong, "
                     f">= {context.get('bands', {}).get('moderate')} moderate)")
        lines.append(f"Model used: {context.get('dataset')}")
        lines.append(f"Confidence label (relative, not an interval): {context.get('confidence_label')}")
    sim = context.get('similarity_to_training') or {}
    if sim:
        lines.append(f"Compound similarity to this model's training compounds: {sim.get('compound')}"
                     f" (below {sim.get('in_scope_floor', {}).get('compound')} counts as unfamiliar)")
        lines.append(f"Protein similarity to this model's training proteins: {sim.get('protein')}"
                     f" (below {sim.get('in_scope_floor', {}).get('protein')} counts as unfamiliar)")
    measured = context.get('source_measurements') or []
    lines.append(f"Measured laboratory value for this exact pair: "
                 f"{', '.join(str(m.get('original_score')) for m in measured) if measured else 'none on record'}")
    if context.get('truncated'):
        lines.append(f"The model read only the first {context.get('sequence_limit')} residues of "
                     f"{context.get('sequence_tokens')}.")
    advice = context.get('advice') or {}
    if advice:
        lines.append(f"Model recommendation from measured similarity: {advice.get('recommended')} "
                     f"({advice.get('confidence')}). {advice.get('summary')}")
        for option in advice.get('options', []):
            lines.append(f"  - {option['model']}: fit {option['fit_score']}, "
                         f"compound {option['compound_similarity']}, protein {option['protein_similarity']}")
    structure = context.get('structure') or {}
    if structure:
        lines.append(f"Structure lookup: {structure.get('level')} - {structure.get('detail')}")
        if structure.get('pdb_ids'):
            lines.append(f"  PDB entries: {', '.join(structure['pdb_ids'][:4])}; "
                         f"ligand code {structure.get('ligand_code') or 'not named'}")
    contacts = context.get('contacts') or []
    if contacts:
        lines.append('Contacts measured in the structure (distance only, not full interaction '
                     'analysis):')
        for c in contacts[:10]:
            lines.append(f"  - {c.get('residue')} at {c.get('distance')} A")
    else:
        lines.append('No interaction contacts were measured for this pair.')

    lines.append('NOT AVAILABLE in this app: binding free energies, docking scores, interaction '
                 'types (hydrogen bond vs salt bridge vs stacking), kinetics, selectivity across '
                 'targets, toxicity, and any pocket not listed above.')
    return '\n'.join(lines)


def ask(context, question=None):
    key = os.environ.get('GEMINI_API_KEY')
    if not key:
        return {'ok': False,
                'answer': 'The assistant is not configured. Set GEMINI_API_KEY in the environment '
                          'where the server runs, then restart it.'}

    task = (question.strip() if question else
            'Explain this result to me: what the number means, how much to trust it, and whether '
            'this was the right model to use.')
    prompt = f'{SYSTEM}\n\nDATA (the only facts you may use):\n{_facts(context)}\n\nQUESTION: {task}'

    # thinkingBudget 0: these models otherwise spend most of maxOutputTokens on internal
    # reasoning, which truncated the visible answer to a single clause. The budget is also
    # raised well above what the reply needs, so a little thinking cannot eat it again.
    payload = {'contents': [{'parts': [{'text': prompt}]}],
               'generationConfig': {'temperature': 0.2, 'maxOutputTokens': 2048,
                                    'thinkingConfig': {'thinkingBudget': 0}}}
    response = None
    last = 'no model answered'
    for name in MODELS:
        try:
            response = httpx.post(f'{BASE}/{name}:generateContent',
                                  params={'key': key}, timeout=TIMEOUT, json=payload)
        except httpx.HTTPError as error:
            last = f'could not reach the service ({error})'
            continue
        if response.status_code == 200:
            break
        if response.status_code in (404, 429, 503):
            # stale name, rate limited, or busy - try the next one
            last = f'{name} returned {response.status_code}'
            response = None
            continue
        detail = ('the API key was rejected; check it is valid and the Generative Language API is '
                  'enabled') if response.status_code in (400, 403) else response.text[:160]
        return {'ok': False, 'answer': f'The assistant returned an error '
                                       f'({response.status_code}): {detail}'}

    if response is None:
        return {'ok': False,
                'answer': f'The assistant is busy or unavailable right now ({last}). '
                          f'The prediction and structure above are unaffected - try Assist again '
                          f'in a moment.'}

    try:
        body = response.json()
        text = body['candidates'][0]['content']['parts'][0]['text'].strip()
    except (KeyError, IndexError, json.JSONDecodeError):
        return {'ok': False, 'answer': 'The assistant returned an unexpected response.'}
    return {'ok': True, 'answer': text, 'model': str(response.url).split('/')[-1].split(':')[0]}
