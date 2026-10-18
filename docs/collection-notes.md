> Historical collection notes. Counts describe successive collection stages, and some interface descriptions are historical. See the root README for the current release and publishing instructions. Raw browser snapshots referenced below are not included in the public release.

# Olander Atlas

Site privé pour explorer les transitions publiées dans les sets de Jeremy Olander, comparer deux sélections et ouvrir les passages à écouter.

## Collection et couverture

La collecte du 18 octobre 2026 a parcouru le profil Jeremy Olander de 1001Tracklists jusqu'au message « No more tracklists found » : **209 tracklists indexées**, correspondant au compteur du profil. Cela couvre le catalogue visible de ce profil à cette date, pas toutes ses performances dans le monde ni celles de son autre alias Dhillon.

Les champs récupérées / indexées de dist/dataset.json décrivent la couverture des pages détaillées. collection.detailsComplete est vrai uniquement quand toutes les pages de l'index ont été collectées. Les tracklists publiées peuvent elles-mêmes être incomplètes et leur ordre n'a pas été vérifié à l'oreille.

Les 209 pages détaillées de Jeremy ont été récupérées. Avec le mix de Rezident, les quatre listes de Mattheis et les 28 sets de soutien, la collection contient 242 tracklists, 1 594 morceaux identifiés et 2 658 enchaînements distincts. Deux autres enregistrements de Mattheis sont conservés sans tracklist. Les 311 lignes explicitement attribuées à d'autres DJs dans des émissions partagées sont exclues du répertoire de Jeremy.

Les trois sets du premier prototype provenant de WatchTheDJ sont remplacés par leur source 1001 lorsque la même performance a été récupérée. Le mix de Rezident reste présent comme premier exemple d'élargissement par un morceau partagé. Les liens sources, les versions, les positions et les repères temporels sont conservés.

## Mattheis

Le lien #sets?dj=Mattheis ouvre les résultats. Le choix du DJ dans la bibliothèque ou dans l'explorateur permet de passer de Jeremy à Mattheis. Chaque DJ conserve son propre corpus ; l'élargissement utilise les morceaux partagés dans leur version exacte.

Le profil 1001Tracklists de Mattheis indique zéro tracklist au 18 octobre 2026. Les quatre listes les plus récentes de la catégorie MixesDB consultée datent de 2022 : Draaimolen (9 septembre), Future Intel (4 août), Operator Radio (6 mai) et Observatory 030/OpenLab (20 avril). Elles fournissent 45 positions, 32 morceaux identifiés et 25 transitions distinctes. Pour OpenLab, seules les dix positions explicitement attribuées à Mattheis sont importées ; les quatorze positions de Hakk sont exclues. Les repères sont approximatifs, à la minute.

Deux enregistrements sont référencés à écouter avant identification : Anthony Linell & Mattheis, Draaimolen 2024 (mis en ligne le 24 juin 2025 ; la page indique aussi une sortie au 31 mars 2025) et Blijdorp 2022 (mis en ligne le 4 avril 2023). La recherche n'a pas confirmé de set de Mattheis plus récent. Les commentaires de Blijdorp proposent des identifications qui n'ont pas été validées. Ces références sont enregistrées dans recordings et ne créent aucun morceau ou lien dans le graphe.

Les captures publiques utiles sont conservées dans collector/mattheis-tracklists.json et collector/mattheis-recordings.json. Reconstruction complète :

    python3 collector/build_mattheis.py
    python3 collector/build_1001.py /chemin/vers/les/snapshots/1001 --additional collector/mattheis-dataset.json

Les noms différents des morceaux restent séparés. Un point d'interrogation faisant partie d'un titre nommé ne signifie pas que ce morceau est inconnu ; un « ? » isolé reste un ID.

## Découvrir les DJs et les autres producteurs

Une seule destination, #explorer, rassemble la recherche de morceaux, DJs et sets. La recherche porte sur tout par défaut ; Tout / Morceaux / DJs / Sets filtrent la même liste. Le panneau de droite utilise toujours la même tracklist complète, avec le morceau surligné et centré. Un clic sur un titre conserve son set et permet de poursuivre l’exploration. Les transitions se déplient sous la liste.

- Morceaux → Ses productions : ses crédits de production, avec versions distinctes.
- Morceaux → Ses sélections : les autres producteurs sélectionnés par le DJ, avec les exclusions et options existantes.
- DJs → Qui jouent ses morceaux : preuves de soutien et versions exactes ; Répertoire partagé conserve l’autre exploration.
- Sets : la collection et les enregistrements à identifier, dans le même panneau.

Les anciens liens #discover, #sets, #peers et #compare ouvrent leurs équivalents dans cet explorateur. Les filtres, la recherche, le DJ, la version et l’occurrence dans le set sont conservés dans le lien. Comparer deux sets ouvre une section dans le même espace et réutilise les tracklists complètes. L’import/export reste dans Outils.

La collecte complémentaire a examiné les 30 premières tracklists de l'onglet Supports de son profil 1001Tracklists, dont 28 sets d'autres DJs du 16 juillet au 16 octobre 2026. Ils sont importés intégralement, avec les limites de sections. Certains noms de DJs sont du texte dans le titre et non des liens ; ces crédits sont conservés. Ainsi, Dimensions est attribué à la section Jordan Counsel de Progmatic Radio 002, pas à l'hôte Sean Harvey.

Dans cette collection, la vue par défaut documente 19 artistes/DJs individuels et deux sessions partagées, avec Rezident inclus depuis la collection initiale. Un set Lane 8 & Kasbo ne prouve pas lequel des deux a choisi le morceau : la session reste collective. Inclure les remixes et edits donne 25 DJs ou sessions. L'autre sens donne 602 références identifiées d'autres producteurs, réparties dans 152 tracklists. Ce sont des résultats partiels, pas un classement exhaustif des soutiens de Jeremy.

L’explorateur a une recherche, un tri, des liens d’écoute et toute la tracklist collectée du set choisi, affichée directement dans le panneau. Le morceau sélectionné est surligné et centré automatiquement ; Recentrer permet de le retrouver après défilement. Les positions, IDs, superpositions et limites de sections sont conservés. Les résultats sont affichés par groupes de trente sans limiter la recherche aux lignes visibles. Une liste compacte permet de choisir un DJ ou un morceau, puis un panneau adjacent expose les passages documentés. Le sélecteur de passage permet de parcourir les exemples sans répéter les mêmes blocs. Les recherches, filtres et sélections restent en mémoire pendant la navigation ; les liens de l’explorateur conservent l’identifiant exact et le périmètre, et le bouton Retour du navigateur retrouve la destination précédente. Le lien vers les répertoires partagés conserve l'ancienne exploration des DJs liés, distincte d'une preuve qu'ils ont joué une production de Jeremy.

Reconstruction de l'échantillon de soutiens et de la collection complète :

    python3 collector/build_supports.py /chemin/vers/les/snapshots/supports
    python3 collector/build_1001.py /chemin/vers/les/snapshots/1001 --additional collector/mattheis-dataset.json --additional collector/fahlberg-dataset.json --supports collector/supports-dataset.json

L'archive livrée inclut l'index et les 28 snapshots de soutien dans collector/supports-snapshots. Le constructeur donne une URL de module différente aux données quand leur contenu change, pour éviter qu'un navigateur garde une ancienne collection en cache.

Sur mobile, une seule partie de l’explorateur est visible à la fois : la liste ou le passage choisi. La sélection déplace le focus vers le passage ; « Résultats » ramène au champ de recherche. Les voisins du graphe sont présentés dans des groupes lisibles avant / morceau / après. L’explorateur utilise aussi un sélecteur d’exemple plutôt qu’une longue répétition de tracklists. Le choix du DJ est commun à tous les filtres. La version claire utilise une seule police et une palette blanche, noire et grise. Les explications et outils secondaires sont rangés dans Sources, Filtres et Outils ; les résultats restent dans la même liste. L’ancienne palette verte a été remplacée à la demande explicite de l’utilisateur.

## Copier un morceau

Le bouton à deux feuilles copie « Artiste — Titre », avec le remix ou l’edit exact. Il est disponible sur les cartes du graphe, les voisins d’un passage, les résultats, les versions et les lignes des tracklists. La copie confirme le résultat sans ouvrir un autre morceau.

## Comparaison demandée

L’outil Comparer, accessible dans Outils et par l’ancien lien #compare, démarre avec Live from My Living Room (1 octobre 2026, 13 positions, durée indiquée 1:06:46) et Beach Stage, Balance Croatia Festival (8 août 2026, 24 positions, durée indiquée 2:00:05).

Il montre les morceaux identifiés communs, leurs voisins, les intitulés provisoires communs et les liens d'écoute. Les médianes entre repères sont de 4:49 et 5:03. Elles décrivent la cadence des changements indiqués, pas la durée des fondus ou le temps exact durant lequel un morceau est audible.

Cette analyse utilise les tracklists. Le BPM joué, les tonalités, l'énergie sonore et les gestes de mixage nécessitent une écoute ou une analyse audio.

## Utilisation et conservation

Ouvrir le site privé ou lancer depuis ce dossier :

    python3 -m http.server 8765 --bind 127.0.0.1 --directory dist

Puis ouvrir http://127.0.0.1:8765/. Aucun module externe n'est nécessaire. Une police Google Fonts est utilisée ; les polices du système prennent le relais si elle est indisponible.

Les ajouts par texte ou JSON restent dans le stockage de ce navigateur, sur cet appareil et cette adresse. Ils ne sont pas synchronisés entre appareils. Exporter la collection avant de supprimer les données du navigateur. Réimporter une source met son set à jour. Une ancienne copie WatchTheDJ reconnue ne remplace pas la source 1001 plus détaillée et ne crée pas de doublon.

## Règles du graphe

- Les identifiants 1001 sont conservés. Une copie hors 1001 reçoit la même identité uniquement si son artiste et son titre normalisés correspondent à un seul identifiant connu.
- Remixes, edits et bootlegs restent séparés. Des différences de graphie sans identifiant commun peuvent encore créer des doublons.
- Une transition relie uniquement deux positions principales identifiées et consécutives dans un même set et une même section continue.
- IDs et titres provisoires restent visibles, mais n'établissent pas de liens automatiques. Certains titres provisoires sont déjà reconnus par 1001 ; le graphe garde cette règle prudente.
- Les suggestions non confirmées sont ignorées. Les superpositions structurées sont conservées séparément.
- Dans un programme avec plusieurs DJs et des sections explicitement attribuées, seules les positions attribuées à Jeremy sont importées. scopeNote le signale. Les limites de sections interrompent les transitions et autorisent un redémarrage des repères.
- Un repère qui recule sans changement de section est écarté des liens d'écoute et conservé dans sourceTimeSeconds. accuracyNote le signale. L'ordre publié reste inchangé.
- Un set partagé sans attribution détaillée ne permet pas d'affecter chaque choix à un DJ. Les crédits collectifs sont conservés.
- Les liens comptent les tracklists sources distinctes. Répéter un enchaînement dans une tracklist n'augmente pas ce compteur. Une performance republiée sous plusieurs URLs peut encore compter plusieurs fois ; les trois copies connues du prototype sont rapprochées de leur source 1001.
- Les liens YouTube de l'explorateur ouvrent avant le morceau précédent quand son repère existe. La comparaison ouvre 30 secondes avant le repère du morceau choisi. Si le lecteur d'une émission peut appartenir à un autre DJ, l'outil ouvre la source plutôt que d'attribuer cet audio à Jeremy.

## Extraction et reprise

Les pages 1001 sont parcourues dans le navigateur de l'utilisateur, sans API non documentée, lecture de cookies, proxy ou résolution automatique de CAPTCHA. Les snapshots contiennent des métadonnées des tracklists, pas des jetons de connexion ni les contenus publicitaires.

Le dossier work/1001-collection de cette conversation contient l'index, les snapshots et la progression. L'archive source livrée contient aussi une copie de l'index et des 209 snapshots dans collector/snapshots. La collecte s'arrête devant une limitation ou une vérification humaine. Une reprise doit espacer les visites et utiliser les URLs déjà indexées sans recollecter les fichiers existants.

collector/build_1001.py reconstruit les données depuis ces snapshots :

    python3 collector/build_1001.py /chemin/vers/les/snapshots

Sans option, une collection incomplète est refusée. --allow-partial permet de publier les données déjà obtenues en affichant leur couverture partielle. collector/collect.py conserve le collecteur des quatre sources initiales ; il ne collecte pas 1001.

## Validation

    node --test tests/*.test.mjs

Les tests couvrent les crédits de production, les aliases, les remixes, les sets partagés, les sélections attribuées, les inconnus, les trous, les superpositions, les versions, les répétitions, les réimports, les identifiants, les copies d'un même set, les limites de sections, les liens et les véritables morceaux communs des deux sets demandés. L'interface est vérifiée dans le navigateur, y compris la comparaison et l'affichage mobile.

La publication conserve une collection fixe. Les ajouts dans le navigateur n'altèrent pas le dépôt ni le site hébergé. Aucune collecte récurrente n'est planifiée.


## Fahlberg — collecte du 18 octobre 2026

Le profil 1001Tracklists comporte 14 sources visibles, dont quatre datées de 2024 à 2026. Trois sets solo ont été ajoutés : CLSR / Soho House Stockholm (30 mai 2026, 29 entrées), Green Valley / Road To Tomorrowland Brasil (24 mai 2025, publié le 3 juillet 2025, 22 entrées), et Ibiza Global Radio (22 juillet 2024, 11 entrées). Bar15 (13 décembre 2025) était déjà collecté : sa vue Fahlberg contient uniquement les 24 positions explicitement créditées Jeremy Olander & Fahlberg. Les dix sources antérieures à 2024 sont indexées mais n’ont pas été importées dans cette collecte récente.

Les 62 nouvelles entrées conservent huit IDs et quatre superpositions. Aucun lien ne traverse un ID ni une frontière de section. La collection complète passe à 245 sources, 1 637 morceaux identifiés distincts et 2 701 transitions distinctes. Le périmètre Fahlberg compte quatre sources, 64 morceaux identifiés et 56 transitions ; les sessions partagées restent collectives. Les miroirs YouTube et Mixcloud de Green Valley sont rattachés à la même source.

Reconstruction (snapshots inclus dans l’archive source) :

```sh
python3 collector/build_fahlberg.py collector/fahlberg-snapshots
python3 collector/build_1001.py collector/snapshots --additional collector/mattheis-dataset.json --additional collector/fahlberg-dataset.json --supports collector/supports-dataset.json
node --test tests/*.test.mjs
```

## Langues

L’interface démarre en anglais par défaut. Un petit drapeau dans l’en-tête ouvre une fenêtre proposant English, Français et 한국어 ; le choix est mémorisé séparément de la collection dans ce navigateur. Les dates, nombres, boutons, messages de copie, formulaires, erreurs, limites et notes rédigées par l’application sont traduits. Les noms d’artistes, titres de morceaux et URLs restent ceux des sources. Changer de langue conserve la recherche, le morceau et son occurrence dans le set, ainsi que le graphe ouvert et les choix de comparaison. La langue de l’interface est indépendante de celle du navigateur.

## Collecte annuelle des producteurs joués par Olander — 18 octobre 2026

Les onze sources Olander datées de 2026 ont été relues. Le plus récent set répertorié est Live from My Living Room, le 1 octobre 2026 ; aucune nouvelle source Olander ne manquait au catalogue collecté. La sélection des producteurs se fonde sur leurs morceaux identifiés joués en version originale dans ces sources : productions de Jeremy/Dhillon, remixes, edits, reworks, bootlegs et sélections collectives sont exclus de cette sélection initiale. Les versions Original Mix, Extended Mix et Club Mix sans autre remixeur sont acceptées. Les 50 occurrences admissibles donnent 42 profils liés ; un crédit Mcgregor ne dispose pas de profil lié. Cornucopia est explicitement l’alias de Guy J, dont les sets sont inclus.

Les sets des producteurs sont recherchés du 18 octobre 2025 au 18 octobre 2026 inclus. Leur ordre complet est conservé, y compris les remixes : le filtre original sert à choisir les producteurs, pas à supprimer des lignes de leurs mixes. Les dates sont celles des sources ; une date de publication n’est pas présentée comme une date de performance certaine. Les listes 1001Tracklists ont été collectées uniquement depuis le DOM du navigateur, avec une pause après la limitation temporaire du site et une cadence réduite ensuite. Les alternatives MixesDB et les descriptions officielles sont archivées. Les miroirs connus sont réconciliés par la source et l’enregistrement.

`collector/annual-targets.json` explique chaque producteur retenu par son morceau, sa position et son set Olander. `collector/annual-coverage.json` détaille les profils vérifiés, les sources répertoriées et les éventuelles sources en attente ; ces nombres ne prétendent pas couvrir tous les enregistrements existant sur Internet.

Reconstruction depuis les snapshots de l’archive :

```sh
python3 collector/select_annual_producers.py collector/annual-snapshots
python3 collector/normalize_annual_alternatives.py collector/annual-snapshots
python3 collector/build_annual.py collector/annual-snapshots
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_annual_collector.py'
```

La reconstruction complète avec `build_1001.py` accepte `--additional collector/annual-dataset.json` après les collections Mattheis et Fahlberg ; ce fichier actualise les sources déjà présentes. Le chargement du navigateur rétablit les sources officielles actuelles et conserve les sources personnelles et les enregistrements personnels. Les producteurs disposant de sets importés sont proposés dans le sélecteur de DJ existant.

Bilan : 141 nouvelles tracklists, 3724 nouvelles entrées ; 386 sources, 2698 morceaux identifiés distincts et 3996 transitions distinctes au total. Les 43 profils ont été vérifiés sur la période ; aucune des 144 sources 1001 répertoriées dans cette fenêtre ne reste en attente. Quatre sources supplémentaires Ryan Elliott proviennent de MixesDB.


## Layer J et CVMRN — collecte du 18 octobre 2026

Période : 18 octobre 2025 au 18 octobre 2026 inclus. La première page de Layer J comporte les six sources récentes puis des sources plus anciennes ; les 20 sources historiques ne sont pas toutes importées. Le profil CVMRN comporte sept sources, dont six dans la période ; Asbury Park (2020) reste hors périmètre. Les deux fenêtres sont complètes au regard de ces index publics.

Cinq nouveaux sets Layer J ont été ajoutés : Layershow 011, COSmix 014, Layershow 010, Layershow 009 et COSmix 005. Spybar était déjà présent et a été actualisé sans doublon. Les performances Layershow conservent leur date d’événement et leur date de publication séparément. Six sources CVMRN sont ajoutées : Anjunakitchen, Enhanced Sessions 858 et 839, SILO Dallas, Ultra Miami et Group Therapy 657. Dans les trois émissions à plusieurs DJs, seules les lignes explicitement attribuées à CVMRN sont importées ; les choix des animateurs ne lui sont pas affectés. Le lien source conserve l’accès à l’émission complète. Les lecteurs non instanciés dans les pages restent absents plutôt que d’inventer une URL audio.

Les deux collections comptent 199 entrées (121 Layer J, 78 CVMRN), IDs et superpositions compris. Onze nouvelles sources au total ; les imports personnels restent conservés.

Reconstruction depuis les snapshots inclus dans l’archive source :

```sh
python3 collector/build_recent_djs.py collector/recent-djs-snapshots
node --test tests/*.test.mjs
```

La reconstruction globale via `build_1001.py` accepte `--additional collector/recent-djs-dataset.json` en dernier, après la collection annuelle. Le fichier remplace les sources reconnues sans augmenter leur nombre.

Après cet ajout : 397 sources, 2770 morceaux identifiés distincts et 4083 transitions distinctes.
