#!/bin/zsh
# Double-cliquer depuis le Finder : régénère la notice si l'UI a changé, puis
# déploie l'app + la notice sur les Pages Perso Free.
#
# Prérequis (une fois) :
#   - identifiants FTP Free dans ~/.netrc  (voir tools/deploy-free.sh)
#   - python3 + reportlab + svglib        (pip3 install reportlab svglib)
cd "$(dirname "$0")"
clear
echo "Publication de Soundboard Live"
echo

NODE_BIN="/Applications/Codex.app/Contents/Resources/node"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi
if [ -z "$NODE_BIN" ]; then
  echo "Node.js est introuvable. Installez Node.js ou lancez depuis Codex."
  read -k 1
  exit 1
fi

# Tests de fumée avant toute publication (tests/*.test.mjs, environ 30 s).
# En cas d'échec, on demande avant de publier quand même : un soir de
# spectacle, mieux vaut pouvoir passer outre que rester bloqué.
echo "→ Tests…"
echo
if ! "$NODE_BIN" --test --test-concurrency=1 --test-reporter=spec tests/*.test.mjs; then
  echo
  echo "✖ Des tests échouent (voir ci-dessus)."
  echo "  Si Playwright ne trouve pas son navigateur :  npx playwright install chromium"
  echo
  echo -n "Publier quand même ? (o/N) "
  read -k 1 REPONSE
  echo
  if [ "$REPONSE" != "o" ] && [ "$REPONSE" != "O" ]; then
    echo "Publication annulée. Vous pouvez fermer cette fenêtre."
    read -k 1
    exit 1
  fi
fi
echo

APPV="$(grep -oE 'app\.js\?v=[0-9]+' index.html | grep -oE '[0-9]+' | head -1)"
NOTICEV="$(cat .notice-build 2>/dev/null || echo '?')"

if [ "$NOTICEV" != "$APPV" ]; then
  echo "→ Notice en retard (v$NOTICEV → v$APPV) : régénération…"
  echo
  "$NODE_BIN" tools/capture-notice.mjs || { echo "Échec des captures."; read -k 1; exit 1; }
  python3 generate-notice.py            || { echo "Échec du PDF (reportlab installé ?)."; read -k 1; exit 1; }
  echo
else
  echo "→ Notice déjà à jour (v$APPV)"
  echo
fi

echo "→ Déploiement FTP…"
echo
bash tools/deploy-free.sh
STATUS=$?

echo
if [ $STATUS -eq 0 ]; then
  echo "Terminé. Vous pouvez fermer cette fenêtre."
else
  echo "Le déploiement a échoué (voir ci-dessus)."
fi
read -k 1
