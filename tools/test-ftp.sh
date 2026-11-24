#!/usr/bin/env bash
# Diagnostic ponctuel : qu'est-ce qui fait couper l'envoi de api/admin.php ?
# (contenu complet ? extension .php ? écrasement du fichier existant ?)
# À supprimer une fois le problème réglé.
cd "$(dirname "$0")/.."
NETRC="$HOME/.netrc"; HOST="ftpperso.free.fr"
LOGIN="$(awk -v h="$HOST" '$1=="machine"{f=($2==h)} f&&$1=="login"{print $2; exit}' "$NETRC")"
C=(curl -sS --netrc-file "$NETRC" --ssl-reqd --ftp-pasv --connect-timeout 15 --max-time 60
   --connect-to "$HOST:21:$LOGIN.free.fr:21")
size() { "${C[@]}" -I "ftp://$HOST/soundboard/$1" 2>/dev/null | tr -d '\r' | awk -F': ' 'tolower($1)=="content-length"{print $2}'; }
TMP="$(mktemp -d)"
head -c "$(wc -c < api/admin.php)" /dev/zero | tr '\0' 'a' > "$TMP/neutre"
want=$(wc -c < api/admin.php | tr -d ' ')

test_one() { # $1 libellé, $2 fichier local, $3 nom distant (dans soundboard/)
  printf '%s : ' "$1"
  "${C[@]}" -T "$2" "ftp://$HOST/soundboard/$3" 2>"$TMP/err" || true
  local got; got="$(size "$3")"
  if [ "$got" = "$want" ]; then echo "OK"; else echo "BLOQUÉ (reçu ${got:-?}) $(tr -d '\n' < "$TMP/err")"; fi
  "${C[@]}" -o /dev/null "ftp://$HOST/" -Q "DELE soundboard/$3" 2>/dev/null
  sleep 5
}

test_file() { # $1 fichier local → envoyé en .txt, taille comparée à la sienne
  want=$(wc -c < "$1" | tr -d ' ')
  test_one "$1 ($want octets)" "$1" "test-$(basename "$1").txt"
}
test_file styles.css
test_file app.js
test_file lib/wavesurfer.esm.js
rm -rf "$TMP"
