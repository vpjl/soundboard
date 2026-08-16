#!/bin/zsh
cd "$(dirname "$0")"
clear
echo "Demarrage du controle a distance..."
echo
NODE_BIN="/Applications/Codex.app/Contents/Resources/node"
if [ ! -x "$NODE_BIN" ]; then
  NODE_BIN="$(command -v node)"
fi

if [ -z "$NODE_BIN" ]; then
  echo "Node.js est introuvable."
  echo "Installez Node.js ou lancez l'app depuis Codex."
  read -k 1
  exit 1
fi

"$NODE_BIN" remote-relay.js
echo
echo "Le serveur s'est arrete. Vous pouvez fermer cette fenetre."
read -k 1
