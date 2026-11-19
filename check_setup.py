"""Check this copy of the project is set up correctly, and say exactly what is wrong if not.

    python check_setup.py

Written because the usual failure - trained weights not copied in, or copied to the wrong place -
showed up in the browser as "Internal Server Error", which tells nobody anything.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OK, BAD, WARN = '  OK  ', ' FAIL ', ' WARN '
problems = []


def report(state, message, fix=None):
    print(f'[{state}] {message}')
    if state == BAD and fix:
        print(f'        -> {fix}')
        problems.append(message)


print(f'Project root: {ROOT}\n')

# ---- 1. the registry, which lists what should exist
registry_path = ROOT / 'models' / 'registry.json'
if not registry_path.exists():
    report(BAD, 'models/registry.json is missing',
           'You are probably not in the project root, or the clone is incomplete.')
    sys.exit(1)
registry = json.loads(registry_path.read_text(encoding='utf-8'))
report(OK, f'models/registry.json found, lists {len(registry)} models')

# ---- 2. the weights themselves
print()
for name, spec in registry.items():
    folder = ROOT / 'models' / name
    for checkpoint in spec['checkpoints']:
        path = folder / checkpoint
        if path.exists():
            size = path.stat().st_size / 1024 ** 2
            if size < 1:
                report(BAD, f'models/{name}/{checkpoint} is only {size:.2f} MB - truncated?',
                       'Re-copy it; each file should be about 17.8 MB.')
            else:
                report(OK, f'models/{name}/{checkpoint}  ({size:.1f} MB)')
        else:
            report(BAD, f'models/{name}/{checkpoint} is MISSING',
                   f'The weights are not in git. Copy them so this exact path exists: '
                   f'{path.relative_to(ROOT).as_posix()}')

# ---- 3. the most common mistake: a nested models folder
nested = ROOT / 'models' / 'models'
if nested.exists():
    report(BAD, 'There is a models/models folder - the zip was unpacked one level too deep',
           'Move everything from models/models/ up into models/, then delete models/models/.')

stray = list(ROOT.glob('*/models/*/model_0.pt'))
for found in stray:
    if 'models' not in found.relative_to(ROOT).parts[:1]:
        report(WARN, f'Found weights at {found.relative_to(ROOT).as_posix()} - that is not where '
                     f'the app looks')

# ---- 4. scope and structure data
print()
for name in registry:
    scope = ROOT / 'models' / name / 'scope.json'
    report(OK if scope.exists() else BAD, f'models/{name}/scope.json',
           'This one IS in git - your clone may be incomplete.')

index = ROOT / 'data' / 'structures' / 'bindingdb_structures.json'
report(OK if index.exists() else WARN,
       'data/structures/bindingdb_structures.json (3D structure lookup)')
if not index.exists():
    print('        -> Optional. Without it, predictions still work but no structures are found.')

# ---- 5. python packages
print()
for module, why in [('torch', 'the model'), ('rdkit', 'chemistry'), ('fastapi', 'the server'),
                    ('pandas', 'the datasets'), ('tape', 'protein tokenising')]:
    try:
        __import__(module)
        report(OK, f'{module} imports ({why})')
    except ImportError:
        report(BAD, f'{module} is not installed ({why})',
               'Run: pip install -r model_2d/requirements.txt')

# ---- 6. can a model actually load?
print()
if not problems:
    try:
        sys.path.insert(0, str(ROOT / 'model_2d'))
        import predict_api
        first = next(iter(registry))
        predict_api._load(first)
        report(OK, f'the {first} model loads successfully')
    except Exception as error:
        report(BAD, f'loading the model failed: {type(error).__name__}: {error}',
               'If this mentions a missing file, the weights are in the wrong folder.')

print()
if problems:
    print(f'{len(problems)} problem(s) found. Fix the FAIL lines above, then run this again.')
    sys.exit(1)
print('Everything checks out. Start the server with:')
print('    python -m uvicorn backend.app:app --port 8000')
print('then open http://127.0.0.1:8000/')
