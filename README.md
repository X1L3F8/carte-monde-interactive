# Carte du monde interactive

Application web simple affichant une carte du monde interactive avec Leaflet. En cliquant sur un pays, un panneau latéral à droite s'ouvre avec quelques informations (nom, description courte, statistiques de base).

## Démarrage

1. Ouvrez le fichier `index.html` dans un navigateur moderne (Chrome, Edge, Firefox…).
   - Pour éviter certains problèmes de chargement du GeoJSON en `file://`, il est recommandé d'utiliser un petit serveur statique.
2. Exemple avec Node.js (dans ce dossier) :

```bash
npx serve .
```

Puis ouvrez l'URL indiquée (par défaut http://localhost:3000 ou similaire).

## Fonctionnalités

- Carte du monde interactive (zoom, déplacement à la souris) basée sur OpenStreetMap + Leaflet.
- Surbrillance des pays au survol.
- Clic sur un pays pour ouvrir un panneau d'information sur la droite.
- Panneau latéral animé (slide) contenant :
  - Nom du pays.
  - Description courte.
  - Quelques statistiques (population, PIB, superficie, capitale) pour certains pays.
- Données supplémentaires pour : France, États-Unis, Canada, Brésil, Allemagne, Chine, Inde, Japon.

## Personnalisation

- Ajoutez / modifiez les données dans `COUNTRY_STATS` dans `main.js` pour enrichir les informations de chaque pays.
- Adaptez le style du panneau et de la carte dans `style.css`.
