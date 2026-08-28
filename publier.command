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
