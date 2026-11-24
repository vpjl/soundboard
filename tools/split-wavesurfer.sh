#!/usr/bin/env bash
# Redécoupe lib/wavesurfer.esm.js en lib/wavesurfer-1.txt … -3.txt (< 16 Ko
# chacun), recollés au chargement par index.html. Raison : le FTP de Free
# coupe à 16 Ko l'envoi de la bibliothèque entière. À relancer seulement si
# lib/wavesurfer.esm.js change (et adapter la liste dans index.html si le
# nombre de morceaux change).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
s = open('lib/wavesurfer.esm.js', encoding='utf-8').read()
n = 3
size = -(-len(s) // n)
parts = [s[i * size:(i + 1) * size] for i in range(n)]
assert ''.join(parts) == s
for i, p in enumerate(parts, 1):
    assert len(p.encode()) < 16000, f"morceau {i} trop gros : augmenter n"
    open(f'lib/wavesurfer-{i}.txt', 'w', encoding='utf-8', newline='').write(p)
    print(f'lib/wavesurfer-{i}.txt : {len(p.encode())} octets')
PY
