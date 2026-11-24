#!/usr/bin/env bash
# Déploie la version courante du dépôt vers les Pages Perso Free (FTPS), en une
# commande, sans client FTP ni glisser-déposer de fichiers cachés.
#
#   bash tools/deploy-free.sh          → n'envoie que les fichiers modifiés
#   bash tools/deploy-free.sh --all    → renvoie tout (après un doute sur le serveur)
#
# Envoi incrémental : l'empreinte (SHA-256) de chaque fichier envoyé avec succès
# est notée dans tools/.deploy-free-state (hors dépôt). Au déploiement suivant,
# seuls les fichiers dont l'empreinte a changé partent. Un fichier dont l'envoi
# a échoué n'est pas noté, donc il repart à coup sûr la fois d'après — un
# déploiement interrompu reprend là où il s'est arrêté.
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

# Serveur FTP réel : depuis fin 2026, ftpperso.free.fr coupe tout envoi au-delà de
# 16 Ko (« FTP response timeout », fichiers tronqués à 16384 octets). Le serveur
# du compte, <login>.free.fr, fonctionne, mais son certificat ne couvre pas un
# login contenant un point (vincent.laine). On s'y connecte donc via --connect-to
# en gardant ftpperso.free.fr comme nom d'hôte : le certificat reste vérifié
# (au nom ftpperso.free.fr) et ~/.netrc garde son entrée habituelle.
# Autre serveur : FTP_SERVER=hote bash tools/deploy-free.sh ; FTP_SERVER=direct pour l'ancien comportement.
FTP_LOGIN="$(awk -v h="$HOST" '$1=="machine"{f=($2==h)} f&&$1=="login"{print $2; exit}' "$NETRC")"
FTP_SERVER="${FTP_SERVER:-${FTP_LOGIN:+$FTP_LOGIN.free.fr}}"
CURL=(curl -fsS --ssl-reqd --netrc-file "$NETRC" --ftp-pasv --ftp-create-dirs --connect-timeout 20)
if [ -n "$FTP_SERVER" ] && [ "$FTP_SERVER" != "direct" ]; then
  CURL+=(--connect-to "$HOST:21:$FTP_SERVER:21")
fi

# Le FTP de Free a des ratés passagers (« FTP response timeout ») : chaque fichier
# est retenté jusqu'à 5 fois. Boucle bash plutôt que les options --retry* de curl,
# dont certaines (--retry-all-errors) n'existent pas dans les curl anciens.
STATE="$ROOT/tools/.deploy-free-state"
FULL=0
[ "${1:-}" = "--all" ] && FULL=1
[ "$FULL" -eq 1 ] && rm -f "$STATE"
touch "$STATE"
SENT=0
SKIPPED=0

file_hash() {
  if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | cut -d' ' -f1
  else sha256sum "$1" | cut -d' ' -f1; fi
}

# Note l'empreinte d'un fichier envoyé (remplace l'éventuelle ligne précédente).
# Format : "<sha256> <chemin distant>" ; compatible bash 3.2 (macOS), sans tableau associatif.
record_sent() {
  local tmpstate
  tmpstate="$(mktemp)"
  awk -v p="$2" '$2 != p' "$STATE" > "$tmpstate"
  echo "$1 $2" >> "$tmpstate"
  mv "$tmpstate" "$STATE"
}

# Envoie le fichier seulement s'il a changé depuis le dernier envoi réussi.
put_if_changed() {
  local hash
  hash="$(file_hash "$1")"
  if awk -v h="$hash" -v p="$2" '$1 == h && $2 == p { found = 1 } END { exit !found }' "$STATE"; then
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi
  # lib/ et icons/ (bibliothèques et images figées) : si le fichier est déjà en
  # ligne à la bonne taille, on le considère à jour sans le renvoyer. Le FTP de
  # Free coupe à 16 Ko l'envoi de certains fichiers (ex. lib/wavesurfer.esm.js) :
  # inutile de risquer d'écraser une copie en ligne intacte par une copie tronquée.
  case "$1" in
    lib/*|icons/*)
      if [ "$(remote_size "$2")" = "$(local_size "$1")" ]; then
        record_sent "$hash" "$2"
        SKIPPED=$((SKIPPED + 1))
        sleep 2 # cette vérification ouvre aussi une connexion
        return 0
      fi
      sleep 2;;
  esac
  put "$1" "$2" || return 1
  record_sent "$hash" "$2"
  SENT=$((SENT + 1))
  sleep 3 # espacer les connexions (le serveur Free refuse les rafales : 530)
}

# Taille du fichier en ligne (commande FTP SIZE via curl -I), vide si inconnue.
remote_size() {
  "${CURL[@]}" -I "ftp://$HOST/$1" 2>/dev/null | tr -d '\r' | awk -F': ' 'tolower($1) == "content-length" { print $2 }'
}

local_size() { wc -c < "$1" | tr -d ' '; }

put() {
  echo "  ↑ $2"
  local attempt want got log wait
  want="$(local_size "$1")"
  log="$(mktemp)"
  for attempt in 1 2 3 4 5; do
    # Une seule connexion par fichier : envoi puis commande SIZE sur la même
    # session (-Q "-SIZE …" = après le transfert). Le serveur Free répond 530
    # dès la connexion quand on en ouvre trop d'affilée. La taille est lue dans
    # la réponse « 213 <octets> » du journal curl (-v, fichier temporaire effacé).
    # Le FTP de Free peut aussi couper un transfert sans que curl le signale
    # (fichiers tronqués à 16 Ko) : on compare la taille reçue à la locale.
    if "${CURL[@]}" -v -T "$1" "ftp://$HOST/$2" -Q "-SIZE ${2##*/}" 2>"$log"; then
      got="$(tr -d '\r' < "$log" | awk '$1=="<" && $2=="213" {v=$3} END {print v}')"
      if [ -z "$got" ]; then
        echo "    ⚠ taille en ligne invérifiable pour $2"
        rm -f "$log"; return 0
      fi
      [ "$got" = "$want" ] && { rm -f "$log"; return 0; }
      echo "    ✖ envoi incomplet ($got / $want octets)"
    else
      grep -E '^curl: ' "$log" | tail -1 | sed 's/^/    /'
      grep -qE '^< 530' "$log" && echo "    (serveur saturé : trop de connexions rapprochées)"
    fi
    # Attente longue : un 530 ne retombe qu'après une ou deux minutes.
    wait=$((attempt * 30))
    [ "$attempt" -lt 5 ] && { echo "    … nouvel essai ($((attempt + 1))/5) dans $wait s"; sleep "$wait"; }
  done
  rm -f "$log"
  echo "  ✖ échec définitif sur $2"
  return 1
}

echo "→ Déploiement vers $HOST${FTP_SERVER:+ (serveur $FTP_SERVER)}"

# 1. Activation PHP 8.5 — .htaccess à la racine du compte (pas dans soundboard/)
tmp="$(mktemp)"
# Test de connexion + lecture du .htaccess racine. On ne crée ce fichier QUE si le
# serveur répond qu'il n'existe pas (curl 78). Toute autre erreur (connexion coupée,
# timeout…) arrête le déploiement : avant, un simple raté réseau faisait renvoyer
# le .htaccess local à la racine, au risque d'écraser la configuration PHP en ligne.
get_status=0
"${CURL[@]}" -o "$tmp" "ftp://$HOST/.htaccess" 2>/dev/null || get_status=$?
if [ "$get_status" -ne 0 ] && [ "$get_status" -ne 78 ]; then
  rm -f "$tmp"
  echo "✖ Connexion au FTP de Free impossible (erreur curl $get_status) — rien n'a été envoyé."
  echo "  Réessayer plus tard. Diagnostic : curl -v --ssl-reqd --netrc-file ~/.netrc --ftp-pasv ftp://$HOST/"
  exit 1
fi
if [ "$get_status" -eq 0 ]; then
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
appv="$(grep -oE 'app\.js\?v=[0-9]+' index.html | grep -oE '[0-9]+' | head -1)"
noticev="$(cat .notice-build 2>/dev/null || echo '?')"
if [ "$noticev" != "$appv" ]; then
  echo "  ⚠ notice PDF bâtie pour v${noticev}, app en v${appv}."
  echo "    Pour la mettre à jour :  npm run capture-notice && python3 generate-notice.py"
fi
# Ordre : d'abord tout ce que la page charge, index.html et le service worker EN
# DERNIER. Ainsi, si l'envoi s'interrompt, la page en ligne reste l'ancienne et
# cohérente, au lieu d'un nouvel index.html (?v=nouveau) qui chargerait un
# app.js encore ancien — et le mettrait en cache sous le nouveau numéro.
# lib/ : seulement les bibliothèques réellement chargées, citées dans index.html
# ou app.js. Les restes du spike de l'éditeur, minimap et timeline, ne servent
# pas, et le FTP de Free coupe l'envoi de certaines bibliothèques à 16 Ko.
# Liste construite dans une fonction : le bash 3.2 de macOS analyse mal les
# commentaires placés dans une substitution de processus.
deploy_list() {
  find icons api -type f ! -name '.DS_Store'
  find lib -type f ! -name '.DS_Store' | while IFS= read -r lf; do
    if grep -qF "$(basename "$lf")" index.html app.js; then echo "$lf"; fi
  done
}
while IFS= read -r f; do
  put_if_changed "$f" "$REMOTE/$f"
done < <(deploy_list | sort)

for f in app.js styles.css manifest.webmanifest soundboard-vl-notice.pdf service-worker.js index.html; do
  [ -f "$f" ] && put_if_changed "$f" "$REMOTE/$f"
done

# 3. Verrou du dossier privé (contenu géré par admin.php, jamais écrasé ici)
put_if_changed "prive/.htaccess" "$REMOTE/prive/.htaccess"

echo "  ($SENT fichier(s) envoyé(s), $SKIPPED inchangé(s) ignoré(s))"

v="$(grep -oE 'app\.js\?v=[0-9]+' index.html | grep -oE '[0-9]+' | head -1)"
echo "✓ Déployé — version ${v:-?} en ligne dans $REMOTE/"
