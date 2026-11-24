# Changelog

Historique des changements publiés, regroupés par période. Pour le détail version par version, consulter `git log` (chaque commit d'une livraison porte son numéro, par exemple « — v1045 »).

## v1051 - 2026-11-24

- Écritures dans `localStorage` protégées (`storeSet`) : un stockage plein n'interrompt plus une sauvegarde, l'app prévient une fois par session.
- Import d'un board : seules les illustrations intégrées (`data:image/…`) sont gardées, une adresse externe est ignorée.
- Icône de l'onglet (`<link rel="icon">`), fin du 404 sur `favicon.ico`.
- Retrait de 5 fonctions jamais appelées.
- Tests de fumée : 8 tests (ajout export avec pad vidéo, stockage plein, illustrations importées).
- Console de partage (hors version de l'app) : la définition du mot de passe maître exige le fichier `prive/.autoriser-config` (`bash tools/deploy-free.sh --autoriser-config`) ; `publier.command` lance les tests avant de déployer.

## v1036 à v1050 - octobre et novembre 2026

- Crossfade : le fade-out d'un pad n'est plus annulé par le ducking, le mute ou le volume (v1036).
- Scène : boucle d'animation limitée aux pads actifs (v1038-v1041), préchargement en fond après un rechargement (v1043), mémoire bornée et streaming des longues pistes (v1045), stockage persistant, Wake Lock et garde contre le rechargement (v1047).
- Chargement : polices des skins auto-hébergées, minification esbuild au déploiement (v1048).
- Déploiement Free : envoi incrémental, `index.html` en dernier, fichiers de plus de 16 Ko découpés (`api/admin-inc/`, `lib/wavesurfer-1..3.txt`), connexion via le serveur du compte.
- Outillage : `tools/bump-version.sh` et contrôle de version bloquant au déploiement, tests de fumée Playwright (`npm test`).
- Option « Déclencher dès l'appui » essayée en v1049 puis retirée en v1050 (gain non perceptible).

## v991 à v1035 - septembre 2026

- Garage spécialisé « construction du board » : réglages audio en studio, layout de pad compacté et identique pour tous les skins (v1008-v1014).
- Historique garage : pile Annuler persistante, frise d'annulation multi-niveaux horodatée, badge studio/garage par étape (v1016-v1029).
- Skin « mosaïque » : une illustration lâchée sur l'en-tête est découpée en une pièce par pad (v999) ; repli sur portable pour un board partagé.
- Enregistrements micro en MP4/AAC, ou convertis en WAV, lisibles sur iPhone (v1031-v1032).
- Bascule studio/garage : coupe le son en cours (v1033).
- Import d'un board : suffixe « (#n) » si le nom existe déjà (v1030).
- Chargement plus rapide (lecture différée des blobs, v991), overlay de progression (v993), suppression de pad ciblée.
- Console de partage : plafond d'upload relevé à 300 Mio (v1035), réorganisation des partages actifs.

## v899 à v985 - début septembre 2026

- Layout Studio/Scène 100 % CSS, sans couche d'épinglage JS (v923) ; îlot Cues fixe et cluster stop dans la barre (v936).
- Grand nettoyage CSS : `@layer` (base < mode < skin), retrait de centaines de `!important` et de blocs morts (v937-v977).
- Plafond du nombre de colonnes de pads selon la largeur d'écran (v916-v918) ; « x colonnes maximum » dans le bloc board (v962).
- Panneau effets live plein pad, progression et VU au verso (v899, v972) ; cycle à 4 temps du bouton œil (v976).
- Projection vidéo pilotée depuis la régie : repli plein écran, bouton « Lancer » si la lecture est refusée, bouton « Fermer » (v978-v984).

## v831 à v890 - fin août 2026

- Partage d'un board par lien et mot de passe : `api/share.php`, mode invité cloisonné (base IndexedDB séparée), layout « light » en scène (v831-v890).
- Console web `api/admin.php` : création et révocation des liens, mot de passe maître, sessions maison et upload en tranches (contraintes de Free Pages Perso).
- Déploiement Free en une commande (`tools/deploy-free.sh`, identifiants dans `~/.netrc`) et `publier.command` (notice régénérée puis déploiement).
- Notice estampillée avec la version de l'app.
- « Sauvegarder tous les sons » : un sous-dossier par board ; fenêtre « Sons stockés » avec tri.

## v689 à v829 - août 2026

- Compresseur/limiteur sur le bus master (v689-v691).
- Effets live par pad (filtre, distorsion, flanger, delay) au verso du pad (v703-v727).
- Contrôle à distance régie/façade via un relais WebSocket local (v725) : pads, cues, volumes, crossfade armé, Audio master, Random playlist, mode studio/scène, effets live.
- Bloc master : stop global, stop groupé et mute global sur une ligne, badges d'options déplacés (v757-v767).
- Crossfade armé indépendant des cues (v746).
- Sprite SVG pour les icônes (203 → 104 symboles).
- Import d'un board par glisser-déposer du `.json` en garage.

## v565 à v688 - fin juillet et début août 2026

- Random playlist : groupes, simultanéité min/max, anti-répétition, lancement synchronisé (v583-v593, v640).
- Rester dans le mode courant après import, export ou reliaison (v588).
- Notice PDF (`notice.md` et script de régénération), licence CC BY-NC-SA 4.0.
- Numéro de version affiché dérivé du `?v=` de `app.js` (v628).
- Aspect du board : étendue latérale et compacité des pads (v633-v647).
- Micro : flux pré-branché, 4 états explicites, autorisation à l'ouverture (v657-v662) ; trim auto avec sensibilité réglable (v661).
- Board : créateur, export unifié en un bouton avec choix réglages/sons (v652), restauration des versions par menu (v649).
- Service worker : `updateViaCache: "none"` et vérification au retour au premier plan.
- VU cue mesuré sur le signal réel.

## v564 - 2026-07-27

- Refonte des skins (phases 5a-6) : harmonies, roue chromatique partagée, tags/cues/badges qui suivent le skin, annulation pas à pas dans l'éditeur, export/import de skins perso.
- Aide contextuelle refondue : board garage, board studio, réglages audio du pad, éditeur audio, panneau « Sons stockés ».
- Sélection manuelle des pads (studio et garage) avec édition en masse.
- Garage : distribution multi-fichiers par glisser-déposer, suppression groupée, panneau « Sons stockés » (déduplication, export ZIP/dossier local), section « Infos board », annulation pas à pas.
- Icônes board/garage revues ; le bouton « reset board » reste en garage.
- Correctifs : durée du pad centrée, scène mobile, bloc cues en scène, avertissement export vidéo, création de board, sélecteur de mode sur portable.
- Resynchronisation des numéros de version, précache du service worker tolérant aux échecs individuels.

## v423 - 2026-06-26

- Ajout de `--color_pad_title_text` pour séparer le titre des pads de `--color_ui_text`.
- Ajout du réglage « Pads / Titre » dans l'éditeur de skins.

## v422 - 2026-06-26

- Synchronisation de la version affichée, des assets `index.html` et du cache `service-worker.js`.
- Création de la documentation projet dans `docs/`.

## Versions précédentes

Les versions antérieures ne sont pas résumées ici : `git log --oneline`.
