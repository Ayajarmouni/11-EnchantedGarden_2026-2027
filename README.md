# Enchanted Garden

## Description du jeu

*Enchanted Garden* est un jeu d'exploration et de protection dans lequel tu
diriges une troupe de fées gardiennes. Trois jardins enchantés ont perdu leur
lumière et sont envahis par des créatures d'ombre. Pour les restaurer, récolte
des fragments de cristal et réveille toutes les fleurs de chaque jardin.

Clique ou touche un endroit du jardin : toutes les fées s'y dirigent avec un
mouvement fluide et ralentissent à l'arrivée. Un repère lumineux indique leur
destination. Récolte des fragments de cristal et offre-en **deux ou trois** à
chaque fleur pour la faire éclore. Quand toutes les fleurs d'un jardin sont
éveillées, celui-ci rayonne et l'écran de fin propose le jardin suivant. Après
le troisième jardin, la lumière revient et la partie est gagnée. Protéger les
esprits rapporte des récompenses, mais n'est pas requis pour restaurer les
fleurs. Utilise la touche **F** près d'eux et l'onde magique pour repousser les
ombres et purifier les zones de corruption. Les lucioles, les papillons et les
esprits se déplacent de façon autonome.

Le jeu présente une ambiance lumineuse et féerique, avec des jardins aux
couleurs pastel, des cristaux scintillants, des fleurs animées et des effets
sonores doux accompagnés d'une musique féerique générée dans le navigateur :
une mélodie cristalline portée par des accords lents et enveloppants.
Clique sur **SON** pour activer ou couper la musique et les effets sonores; le
curseur **Volume de la musique** règle séparément le niveau de la mélodie. Le
son démarre après cette interaction, conformément aux règles du navigateur. Un
objectif guidé aide à repérer la prochaine tâche. Tu peux
choisir la difficulté, régler plusieurs paramètres de déplacement et observer
les comportements de steering grâce au mode debug.

Le jeu est aussi une démonstration interactive des comportements de steering
étudiés dans les dossiers 1 à 8. Les préférences et les meilleurs temps sont
sauvegardés dans le navigateur.

## Lancer le jeu

Depuis la racine du dépôt, démarrer un serveur HTTP :

```sh
python -m http.server 8000
```

Ouvrir ensuite <http://localhost:8000/11-EnchantedGarden/>. p5.js est embarqué
dans `libraries/`.

Le décor est éclairé comme un jardin féerique au petit matin : chaque niveau
utilise un dégradé pastel différent (rose, menthe, lavande et bleu lune), des
halos lumineux et des points scintillants.

## Quête, progression et commandes

- Restaure les trois jardins successivement : éveille toutes les fleurs du
  jardin courant, puis choisis **JARDIN SUIVANT**. Après le troisième jardin,
  l'écran de victoire termine la partie.
- Cliquez ou touchez le jardin pour envoyer toutes les fées vers ce point. Le
  repère scintillant montre la destination; elles ralentissent en s'en approchant.
- Les fées récoltent automatiquement les cristaux en passant près d'eux. Un
  cristal réapparaît après quelques secondes : il faut donc parfois repasser
  pour obtenir assez de fragments.
- Suivez l’objectif courant, la distance de la cible la plus proche et la flèche
  de bord lorsqu’une cible est hors écran.
- Traversez les cristaux pour récolter des fragments. Chaque fleur demande
  **2 ou 3 fragments** ; approchez-vous et appuyez sur **E** pour en offrir un.
  Les cristaux réapparaissent après quelques secondes jusqu’à ce que le jardin
  ait reçu tous les fragments requis.
- Approchez-vous d'un esprit libre et appuyez sur **F** pour le protéger;
  éloignez d'abord toute ombre qui le menace.
- **Espace** libère une onde protectrice (rayon de 145 px) qui repousse les
  ombres et purifie les zones de corruption proches. L’interface indique son
  rayon et son temps restant.
- Les vagues ajoutent des ombres et font apparaître une zone de corruption qui
  blesse les esprits voisins. Les fleurs éveillées soignent les esprits; protéger
  un esprit rapporte deux souvenirs et faire éclore une fleur en rapporte un.
  Si tous les esprits sont perdus avant la floraison complète, la partie est
  perdue.
- Éveillez toutes les fleurs pour restaurer chaque jardin. Le jardin s'illumine
  et propose le suivant; après le troisième, l'écran de victoire termine la
  partie. Protéger les esprits rapporte des souvenirs, sans bloquer la victoire.
- Le menu **Réglages** permet de choisir de **1 à 6 fées** et de **1 à 5 fleurs**
  par jardin. Toutes les fées suivent la destination choisie; le jardin contient
  le même nombre de cristaux que de fleurs.
- Les esprits se régénèrent près de la fée ou d'une fleur éveillée ; les ombres
  les poursuivent et les blessent. Une fleur nouvellement éveillée fait éclore
  un esprit héritier aux gènes légèrement mutés.
- **P** ou **Échap** met en pause; le bouton pause reprend la simulation.
- **G** ou le bouton **IA** affiche les cibles choisies et les vecteurs de
  steering (arrivée, poursuite, fuite, séparation, cohésion, évitement, etc.).
  Les menus proposent aussi le ralenti et l’accélération de la simulation.
- Le bouton **SON** active les sons synthétiques doux après une interaction
  utilisateur, ainsi que la musique d'ambiance. Le volume de la musique se règle
  indépendamment dans le menu **Réglages**.
- Le menu **Réglages** permet de modifier les vitesses et la force des fées,
  la vitesse des esprits et des ombres, le nombre de fleurs (et donc de cristaux,
  de 1 à 5), le maximum d'ombres simultanées (de 1 à 6) et la difficulté
  **Détente / Aventure**. Il contient aussi la portée de perception des ombres
  (60–220 px), la cohésion des lucioles (0–2) et l’intervalle entre les vagues
  (15–60 s). Ces préférences sont conservées localement; en mode Détente,
  l’intervalle des vagues est augmenté de 35 %.

## Comment le jeu fonctionne

### Boucle de jeu

1. Dans **Réglages**, choisis le nombre de fées (1 à 6) et de fleurs (1 à 5).
   Le jardin contient le même nombre de cristaux que de fleurs. Les réglages
   sont sauvegardés dans le navigateur.
2. Clique ou touche un point du jardin. Toutes les fées reçoivent cette
   destination, s'y dirigent et ralentissent en approchant. Elles se séparent
   légèrement pour ne pas se superposer.
3. En passant près d'un cristal, une fée ramasse un fragment. Approche-toi
   d'une fleur endormie et appuie sur **E** pour lui donner un fragment. Selon
   la fleur, il faut en offrir deux ou trois avant qu'elle s'éveille.
4. Les ombres arrivent par vagues, poursuivent les esprits et peuvent les
   blesser. Une onde repousse les ombres et purifie les zones de corruption;
   protéger un esprit proche avec **F** rapporte des souvenirs.
5. L'éclosion de toutes les fleurs éclaire le jardin et termine le niveau.
   Passe au jardin suivant depuis l'écran de fin; après le troisième, tu gagnes.
   Les esprits sont une source de récompenses, mais si tous sont perdus avant
   l'éclosion complète, la partie se termine par une défaite.

### Organisation technique

Le jeu est réalisé en JavaScript avec p5.js et se lance sans compilation.
`index.html` charge les scripts et les classes dans l'ordre nécessaire. À
chaque image, `sketch.js` met à jour la scène, les objectifs, les interactions
et l'affichage de l'interface. Les fonctions de progression gèrent la collecte,
l'éclosion, les vagues et la victoire.

Les entités mobiles héritent de `Vehicle`, qui centralise la position, la
vitesse, l'accélération et les comportements de steering. Chaque comportement
calcule une force à ajouter à l'accélération; cette force est limitée par
`maxForce`, et la vitesse résultante par `maxSpeed`. Les sous-classes combinent
plusieurs forces avec des poids adaptés au rôle de l'entité :

- `GardenFairy` se dirige vers la destination et évite les rochers et les autres
  fées.
- `GardenSpirit` suit son chemin, cherche les fleurs, se regroupe et fuit les
  ombres lorsqu'elles sont proches.
- `ShadowCreature` poursuit les esprits, mais fuit la fée lorsqu'une onde la
  rend momentanément dangereuse.
- `GardenFirefly` suit le circuit et combine séparation, alignement et cohésion.
- `GardenButterfly` visite les fleurs en errant et en évitant les obstacles.

Les itinéraires reposent sur `GardenPath` et la projection d'un point sur un
segment dans `path.js`. `GardenDebugVehicle` expose les forces calculées pour
le mode debug sans modifier la classe de base. La musique et les effets sonores
sont synthétisés par l'API Web Audio dans `audio.js`, après activation par le
joueur.

## Comportements enseignés

| Dossier d'origine | Utilisation dans le jeu |
| --- | --- |
| 1 — Seek | Les lucioles et les esprits utilisent `seek` pour rejoindre un point; les fées utilisent la variante `arrive`. |
| 2 — Pursue / Evade | Les ombres prédisent la position de leur esprit-proie avec `pursue`; les esprits prédisent la menace et fuient avec `evade`. |
| 3 — Arrival | La fée ralentit avant sa destination au lieu de la traverser. |
| 4 — Wander | Quand elle n'a pas de destination, la fée erre; les lucioles et esprits ajoutent une errance persistante. |
| 5-1 — Scalar Projection | `projectPointToSegment()` projette un point sur le segment borné du chemin, dans `path.js`. |
| 5-2 — Path Following | Les esprits suivent un couloir simple vers leur fleur d'origine. |
| 5-3 — Path Following Complex | Les lucioles suivent un circuit fermé à plusieurs segments; le suivi projette une position future puis vise plus loin sur la piste. |
| 6 — Obstacle Avoidance | Chaque agent projette sa trajectoire et s'écarte des rochers avant de les atteindre. |
| 7 — Boids | Les lucioles s'alignent, se rapprochent et se séparent; les esprits utilisent une séparation plus douce. |
| 8 — Evolutionary Steering | Les esprits ont des paramètres héréditaires de suivi, d'attraction des fleurs et de fuite, ainsi qu'un rayon de perception. Un esprit parent transmet ses gènes à un enfant avec mutation. C'est une version simplifiée de l'évolution, pas une reproduction complète du modèle du dossier. |

Les papillons sont aussi des véhicules autonomes : ils visitent les fleurs,
volent en petits groupes et se détournent des rochers. Les comportements
génétiques et de steering sont des adaptations pédagogiques, pas la reproduction
complète de tous les exercices d'origine.

## Tests

Depuis ce dossier :

```sh
node --test tests/*.test.cjs
```
