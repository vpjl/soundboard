#!/usr/bin/env bash
# Déploie la version courante du dépôt vers les Pages Perso Free (FTPS), en une
# commande, sans client FTP ni glisser-déposer de fichiers cachés.
#
#   bash tools/deploy-free.sh
#
# Identifiants : dans ~/.netrc (HORS du dépôt, donc jamais uploadable par erreur),
# chmod 600, au format :
#
#   machine ftpperso.free.fr
#     login   TON_IDENTIFIANT_FREE
#     password TON_MOT_DE_PASSE_PAGES_PERSO   # défini dans la console d'abonné Free,
#                                             # ≠ mot de passe du compte Free
#
# (ou un autre chemin via  DEPLOY_NETRC=/chemin/vers/netrc bash tools/deploy-free.sh)
#
# Ce que le script pousse :
#   - .htaccess d'activation PHP à la RACINE du compte (créé s'il manque)
#   - l'app dans soundboard/ : index.html, app.js, styles.css, service-worker.js,
#     manifest.webmanifest, lib/, icons/, api/
#   - soundboard/prive/.htaccess (le verrou)
#
# Ce qu'il NE touche JAMAIS : soundboard/prive/partages.php, prive/boards/,
# prive/admin-config.php — gérés en ligne par admin.php, les écraser effacerait
# les partages actifs.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

HOST="ftpperso.free.fr"
NETRC="${DEPLOY_NETRC:-$HOME/.netrc}"
REMOTE="soundboard"

if [ ! -f "$NETRC" ]; then
  echo "✖ Fichier d'identifiants manquant : $NETRC"
  echo "  Le créer (voir l'en-tête de ce script pour le format), chmod 600, puis relancer."
  exit 1
fi
case "$(cd "$(dirname "$NETRC")" && pwd)/" in
  "$ROOT"/*) echo "✖ $NETRC est dans le dépôt — le placer hors du dépôt (~/.netrc)."; exit 1;;
esac

CURL=(curl -fsS --ssl-reqd --netrc-file "$NETRC" --ftp-pasv --ftp-create-dirs)

put() {
  echo "  ↑ $2"
  "${CURL[@]}" -T "$1" "ftp://$HOST/$2"
}

echo "→ Déploiement vers $HOST"

# 1. Activation PHP 8.5 — .htaccess à la racine du compte (pas dans soundboard/)
tmp="$(mktemp)"
if "${CURL[@]}" -o "$tmp" "ftp://$HOST/.htaccess" 2>/dev/null; then
  if grep -q 'php85' "$tmp"; then
    echo "  = .htaccess racine : 'php85' déjà présent, on n'y touche pas"
  else
    echo "  ! Un .htaccess existe à la racine SANS 'php85 1'."
    echo "    Ajoute-y manuellement ces lignes :"
    echo "        <IfDefine Free>"
    echo "        php85 1"
    echo "        </IfDefine>"
  fi
else
  put ".htaccess" ".htaccess"
fi
rm -f "$tmp"

# 2. Fichiers de l'app
for f in index.html app.js styles.css service-worker.js manifest.webmanifest soundboard-vl-notice.pdf; do
  [ -f "$f" ] && put "$f" "$REMOTE/$f"
done
while IFS= read -r f; do
  put "$f" "$REMOTE/$f"
done < <(find lib icons api -type f ! -name '.DS_Store' | sort)

# 3. Verrou du dossier privé (contenu géré par admin.php, jamais écrasé ici)
put "prive/.htaccess" "$REMOTE/prive/.htaccess"

v="$(grep -oE 'app\.js\?v=[0-9]+' index.html | grep -oE '[0-9]+' | head -1)"
echo "✓ Déployé — version ${v:-?} en ligne dans $REMOTE/"
