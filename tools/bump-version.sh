#!/usr/bin/env bash
# Numéro de version de l'app, tenu à 5 endroits dans 2 fichiers :
#   index.html         styles.css?v=N  et  app.js?v=N
#   service-worker.js  CACHE_NAME "soundboard-live-vN", styles.css?v=N, app.js?v=N
# (les ?v= des fichiers de lib/ ont leur propre numéro : jamais touchés ici)
#
#   bash tools/bump-version.sh           → version suivante (N+1)
#   bash tools/bump-version.sh 1060      → fixe la version à 1060
#   bash tools/bump-version.sh --check   → vérifie que les 5 numéros concordent
#                                          (code de sortie 1 sinon)
#
# Compatible bash 3.2 (macOS) ; perl -pi plutôt que sed -i, dont la syntaxe
# diffère entre macOS et Linux.
set -eu
cd "$(dirname "$0")/.."

FILES="index.html service-worker.js"

# Tous les numéros trouvés, un par ligne.
all_versions() {
  grep -ohE '(styles\.css|app\.js)\?v=[0-9]+|soundboard-live-v[0-9]+' $FILES \
    | grep -oE '[0-9]+$'
}

check() {
  local count distinct
  count="$(all_versions | wc -l | tr -d ' ')"
  distinct="$(all_versions | sort -u)"
  if [ "$count" != "5" ] || [ "$(echo "$distinct" | wc -l | tr -d ' ')" != "1" ]; then
    echo "✗ Numéros de version incohérents ($count trouvés sur 5 attendus) :" >&2
    grep -nE '(styles\.css|app\.js)\?v=[0-9]+|soundboard-live-v[0-9]+' $FILES >&2
    echo "  Corriger avec :  bash tools/bump-version.sh <numéro>" >&2
    return 1
  fi
  echo "$distinct"
}

if [ "${1:-}" = "--check" ]; then
  v="$(check)" || exit 1
  echo "✓ Version cohérente : v$v"
  exit 0
fi

current="$(all_versions | sort -n | tail -1)"
if [ -n "${1:-}" ]; then
  case "$1" in *[!0-9]*) echo "Numéro invalide : $1" >&2; exit 2;; esac
  next="$1"
else
  next=$((current + 1))
fi

perl -pi -e "s/(styles\.css|app\.js)\?v=\d+/\${1}?v=$next/g; s/soundboard-live-v\d+/soundboard-live-v$next/g" $FILES

v="$(check)" || exit 1
echo "✓ v$current → v$v (index.html, service-worker.js)"
