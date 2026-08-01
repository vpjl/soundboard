# Soundboard VL — Notice de fonctionnement

## Présentation

Soundboard VL est une application web de gestion et de déclenchement sonore conçue pour la régie de spectacle. Elle s'articule autour de trois espaces distincts.

## L'interface en trois espaces

### Le Garage

Bibliothèque centrale des ressources sonores. C'est ici qu'on importe, organise et prévisualise les fichiers audio. Les sons sont rangés par catégories et restent disponibles pour être assignés à des cues.

### Le Studio

Espace de composition et de configuration des scènes. On y construit les blocs de cues, règle les paramètres de chaque son (volume, fondu, boucle, enchaînement), et structure le déroulement du spectacle.

### La Scène

Vue de performance en temps réel. Interface épurée pour la régie : déclenchement des cues à la volée, contrôle du volume global, indicateurs d'état, navigation entre les scènes.

## Fonctionnalités

- Import et organisation de fichiers audio (mp3, wav, ogg)
- Création de scènes et de blocs de cues
- Déclenchement manuel ou enchaîné des cues
- Réglage individuel : volume, panoramique, fondu entrant/sortant
- Lecture en boucle avec point d'entrée et de sortie configurables
- Superposition de plusieurs pistes simultanées
- Raccourcis clavier configurables
- Prévisualisation en Studio sans impact sur la Scène
- Sauvegarde et chargement de projets

## Commandes globales (Master) — tous modes

- **Tout arrêter** : arrête immédiatement tous les pads en cours de lecture.
- **Arrêter un groupe** : stop groupé — arrête uniquement les pads sélectionnés.
- **Random playlist** : choisir un tag (ou « Tous » pour tous les pads audio du board) et un nombre de pads simultanés (min et max, tiré au hasard entre les deux à chaque lancement), puis lancer — pioche sans répétition parmi les pads audio du groupe, en remplaçant chaque pad dès qu'il se termine. Reclic pour arrêter. Désactive le crossfade (automatique et manuel) tant qu'elle tourne.

## Audio Master

- **Fade in / Fade out global** : durée de fondu entrant et sortant appliquée par défaut à tous les pads (sauf réglage individuel).
- **Ducking global** : atténuation automatique des autres pads lorsqu'un pad prioritaire se déclenche.
- **Reverb globale** : réverbération appliquée globalement à l'ensemble des sorties audio.
- **Égalisation globale** : égaliseur appliqué en sortie master.
- **Raccourcis clavier** : gestion des raccourcis clavier pour déclencher les pads sans souris.

## Mode Garage — construction

> On construit : créer et éditer les sons, organiser le board et les pads.

### Board

- **Ajouter un pad** : ajoute un nouveau pad vide au board courant.
- **Ajouter un board / Dupliquer** : crée un nouveau board ou duplique le board courant avec tous ses pads.
- **Sélectionner un dossier de sons** : relie le board à un dossier local pour retrouver les fichiers audio. À refaire si le dossier est déplacé.
- **Sélectionner un dossier de vidéos** : relie le board à un dossier local pour les fichiers vidéo.
- **Annuler la dernière modification** : annule le dernier réglage modifié ou le dernier pad supprimé (pas à pas).
- **Annuler les modifications du board** : restaure le board tel qu'il était à l'entrée dans le mode (annulation globale).
- **Exporter sons et réglages** : archive complète du board — réglages JSON + fichiers audio. Recommandé pour toute sauvegarde durable (les sons stockés dans le navigateur peuvent être perdus). Conserver les vidéos séparément, puis les relier après import.
- **Exporter les réglages seuls** : exporte uniquement le JSON de configuration, sans les fichiers audio.
- **Importer un board** : importe un board depuis un fichier JSON, avec ou sans audio embarqué.
- **Notice du board** : génère automatiquement une notice du board courant aux formats DOC et PDF (liste des pads, durées, versions).
- **Éditeur de skin** : personnalise l'apparence visuelle du board — couleurs, harmonie chromatique, polices.
- **Sons stockés** : liste les sons stockés dans le navigateur (utilisés ou non). Ce stockage est propre au navigateur, pas au système de fichiers — utiliser l'export pour une copie durable.
- **Supprimer le board** : supprime définitivement le board après confirmation.

### Pad — Import de médias

- **Importer un fichier audio** : charge un fichier audio local (mp3, wav, ogg…) dans le pad.
- **Importer un fichier vidéo** : charge un fichier vidéo local dans le pad.
- **Micro** : enregistre directement au microphone et assigne l'enregistrement au pad.
- **Lecture de texte** : saisit ou importe un texte à lire (synthèse vocale ou affichage).

### Pad — Réglages audio

- **Trim auto** : détecte et coupe automatiquement les silences en début et fin de son.
- **Éditeur audio** : éditeur complet — trim, cut, mute de zones, enveloppe de volume.
- **Loop** : répète le son en boucle continue.
- **Reverse** : lit le son à l'envers.
- **Fade in / out individuel** : durée de fondu propre à ce pad (prioritaire sur le réglage master).
- **Égalisation du pad** : égaliseur appliqué à ce pad uniquement.
- **Duck trigger** : ce pad déclenche le ducking des autres pads quand il joue.
- **Crossfade audio** : configure les déclenchements croisés entre pads ou entre tags.

### Sélection groupée

- **Filtre par tag (OU / ET)** : sélectionne visuellement les pads par type, option ou tag — OU : au moins un des tags ; ET : tous les tags.
- **Inverser / Effacer la sélection** : inverse les pads sélectionnés / désélectionne tout.
- **Masquer les pads non sélectionnés** : n'affiche que les pads de la sélection courante.
- **Modification groupée** : applique un réglage à tous les pads sélectionnés en une seule opération.

## Mode Studio — répétition

> On règle et on répète : peaufiner les sons, vérifier les niveaux, tester cues et fades.

### Versions du board

- **Sauvegarder une version** : crée un instantané local du board courant (8 versions maximum hors archives).
- **Restaurer une version** : revient à l'état d'une version sauvegardée.
- **Renommer une version** : donne un nom explicite à une version (ex : « Filage 14 juin »).
- **Archiver une version** : protège une version de l'écrasement automatique (elle ne compte plus dans le quota de 8).
- **Supprimer une version** : supprime définitivement la version sélectionnée.
- **Skin** : change l'apparence visuelle du board (skin prédéfini).

### Pad en Studio

- **One shot** : relance le son depuis le début à chaque déclenchement.
- **Toggle** : premier clic lance, second clic stoppe et reprend à la même position au prochain déclenchement.
- **Stop** : arrête le pad en appliquant les règles de fade out définies.
- **Pré-écoute Cue** : écoute le pad sur une sortie audio séparée (casque régie) sans l'envoyer en salle — dépend du navigateur et de la configuration audio.
- **Pense-bête du pad** : note de texte libre attachée au pad, visible en studio.
- **Mute / Demute** : coupe ou rétablit le son du pad sans le supprimer de la séquence.
- **Image du pad** : affecte une image, un dessin ou une couleur au pad (selon le skin actif).
- **Dupliquer / Transférer / Déplacer** : duplique le pad, le copie/déplace vers un autre board, ou réordonne les pads par glisser-déposer.

### Cues

- **Activer les cues** : active ou désactive le mode cue pour le board. En mode cue, les pads se déclenchent selon la séquence programmée.
- **Cue suivant** : affiche le prochain cue sans le lancer (anticipation).
- **Lancer le cue courant** : exécute le cue en attente (déclenchement principal en régie).
- **Revenir au début des cues** : réinitialise la séquence au premier cue.
- **Ajouter une étape cue** : insère une nouvelle étape dans la ligne de temps des cues.

### Crossfade

- **Xfade armé** : prépare un fondu enchaîné manuel entre deux pads. Si un seul pad audio joue, il devient la source. S'il y en a plusieurs, choisir la source puis le pad cible — le pad cible démarre en fondu entrant pendant que la source baisse puis s'arrête. La durée utilisée est celle réglée dans l'Audio Master. Annulation : touche Échap ou second clic sur Xfade.
- **Patch bay crossfade** : vue dédiée du câblage crossfade pour configurer les enchaînements complexes entre pads et groupes.

## Mode Scène — live

> On joue : se concentrer sur le spectacle et lancer la machine.

- **Déclenchement des pads** : interface épurée sans les outils d'édition — seuls les contrôles de lecture sont accessibles.
- **Navigation entre scènes** : passage d'une scène à l'autre selon la partition sonore du spectacle.
- **Verrouiller le mode Scène** : protège la sortie du mode Scène par un mot de passe, pour éviter toute modification accidentelle pendant la représentation.
- **Bloc Cues/Crossfade** : quand les cues sont activées, le bloc s'étire à la largeur des pads (aligné sur eux) avec de gros boutons ; au défilement, il se fixe en haut de l'écran pour rester accessible. Inactif, il reste compact.

## Skins et apparence

Le board peut adopter différents skins (apparences), choisis dans le menu Skin ou personnalisés dans l'éditeur de skin.

### Skin Basic/Custom

Skin dédié à l'affichage visuel des pads (image, dessin ou couleur plein cadre). Ses particularités :

- **Affichage illustré** : chaque pad montre son image, son dessin ou sa couleur en plein cadre, avec le titre en surimpression.
- **Rendu épuré** : lorsque l'illustration est affichée, les badges d'options audio (loop, EQ, reverb…), les tags et les contrôles sont masqués pour ne rien superposer à l'illustration — en studio comme en scène.
- **Mode « données »** : le bouton œil d'un pad masque son illustration ; le pad revient alors à l'affichage standard (titre, tags, contrôles, options), en studio comme en scène.
- **Règle générale** : illustration affichée → options et tags masqués ; illustration masquée (ou pad sans illustration) → options et tags visibles, dans les deux modes. Rien n'apparaît jamais par-dessus l'illustration.

## Compatibilité navigateurs

Limites spécifiques à certains navigateurs uniquement.

| Fonctionnalité | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| Stockage persistant des projets | Oui | Oui | limité | Oui |
| Accès au système de fichiers local | Oui | Non | Non | Oui |
| Web MIDI (déclenchement externe) | Oui | Non | Non | Oui |
| Pré-écoute Cue (sortie séparée) | Oui | partiel | partiel | Oui |
| Audio Worklet (traitement avancé) | Oui | Oui | partiel | Oui |

> Note finale : les fichiers audio sont stockés dans le navigateur, pas dans le Finder. Un rechargement sur un autre appareil ou navigateur nécessite de ré-importer les fichiers. Pour une sauvegarde durable, utiliser systématiquement « Exporter sons et réglages ».
