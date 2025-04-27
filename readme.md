# Comparaison temps réel : gRPC vs WebSocket

## Présentation du projet

Ce projet est un simulateur pour comparer les latences entre **gRPC** et **WebSocket**.  
L'idée est de voir comment chaque protocole réagit en fonction de la charge.

On peut choisir :
- Le nombre de voitures simulées
- L'intervalle d'envoi des positions en millisecondes

Chaque voiture envoie sa position à intervalles réguliers et on mesure la latence de réception à chaque message.

---

## Objectif du projet

- Comparer visuellement les performances gRPC vs WebSocket.
- Tester la capacité à tenir la charge quand beaucoup de messages sont envoyés.
- Observer l'évolution de la latence.
- Rendre la comparaison simple à lire via des graphiques et des statistiques.

---

## Ce qu'on utilise

- **Frontend** :
  - `HTML5`
  - `TailwindCSS`
  - `Chart.js`

- **Backend** :
  - `Node.js`
  - `Express`
  - `WebSocket (ws)`
  - `Server-Sent Events (SSE)` (pour simuler un serveur gRPC)

- **Infrastructure** :
  - `Docker` + `Docker Compose`

---

## Lancement du projet

### 1. Cloner le projet

```bash
git clone https://github.com/LCRpro/serveur-haute-performance.git
cd serveur-haute-performance
```

### 2. Lancer avec Docker

```bash
docker-compose up --build
```

Cela va automatiquement :
- Démarrer le serveur gRPC (port 50051)
- Démarrer le serveur WebSocket (port 3001)
- Démarrer le frontend (port 8080)

### 3. Accéder à l'application

Aller sur :

```
http://localhost:8080
```

### 4. Arrêter le projet

```bash
docker-compose down
```

---

## Détails des graphiques

- **Un graphique en ligne** :
  - Latence moyenne calculée toutes les 5 secondes

- **Deux graphiques en barres** :
  - Dernière latence moyenne
  - Latence moyenne toutes les 5 secondes

- **Deux tableaux de statistiques** :
  - Un pour gRPC
  - Un pour WebSocket
  - Avec les valeurs : latence, moyenne, min, max, mises à jour/sec et nombre de messages


---
# Analyse des résultats 

## 1. Test avec 100 voitures - 10ms d'intervalle

- gRPC :
  - Latence moyenne : **2.1 ms**
  - Maximum : **66.0 ms**
- WebSocket :
  - Latence moyenne : **3.0 ms**
  - Maximum : **72.0 ms**

📊 **Analyse** :  
À faible charge (peu de voitures, envoi rapide), gRPC et WebSocket sont très proches en termes de performance.  
Les deux gèrent bien 100 voitures sans problème. La latence reste très basse pour les deux technologies.

---

## 2. Test avec 500 voitures - 20ms d'intervalle

- gRPC :
  - Latence moyenne : **10.6 ms**
  - Maximum : **174.0 ms**
- WebSocket :
  - Latence moyenne : **24.2 ms**
  - Maximum : **325.0 ms**

📊 **Analyse** :  
Quand on augmente la charge, gRPC commence à prendre l'avantage.  
La moyenne de latence WebSocket double presque par rapport à gRPC.  
La montée en charge est mieux supportée par gRPC, qui reste beaucoup plus stable et rapide.

---

## 3. Test avec 1000 voitures - 20ms d'intervalle

- gRPC :
  - Latence moyenne : **42.2 ms**
  - Maximum : **682.0 ms**
- WebSocket :
  - Latence moyenne : **3064.1 ms**
  - Maximum : **7206.0 ms**

📊 **Analyse** :  
À très forte charge, WebSocket sature totalement.  
On dépasse largement les 3000ms de latence en moyenne côté WebSocket, ce qui est énorme (plus de 3 secondes de retard pour recevoir les positions).  
Pendant ce temps, gRPC reste autour de 40ms, ce qui reste très correct pour un aussi grand volume.

---

## Avantages et inconvénients

### gRPC

**Avantages :**
- Très performant, même à haute charge.
- Latence très faible.
- Protocoles optimisés (HTTP/2).
- Bonne gestion de flux massifs en temps réel.

**Inconvénients :**
- Un peu plus complexe à mettre en place que WebSocket.
- Moins universel (besoin d'un client compatible gRPC).

---

### WebSocket

**Avantages :**
- Simple à utiliser.
- Natif dans tous les navigateurs.
- Très pratique pour des communications bidirectionnelles.

**Inconvénients :**
- Moins performant à très haute charge.
- La latence peut vite grimper avec beaucoup de messages.
- Moins optimisé que gRPC pour les flux massifs.

---

## Use Cases (exemples d'utilisation)

### gRPC recommandé pour :
- Applications avec **beaucoup de flux temps réel** (ex : tracking GPS massif, trading haute fréquence, jeux multijoueur).
- Communication **service-to-service** en microservices.
- **Plateformes critiques** où chaque milliseconde compte.

### WebSocket recommandé pour :
- **Applications temps réel simples** (chat, notifications).
- **Sites web** qui veulent ajouter une interaction live.
- **Projets légers** où la charge n'est pas extrême.

---



## Conclusion générale

- À faible charge (quand il y a peu de voitures ou que l'intervalle d'envoi est rapide), gRPC et WebSocket fonctionnent très bien. On a des latences très basses, et aucune saturation visible.
- Dès qu'on commence à augmenter un peu la charge (~500 voitures), gRPC reste performant et stable, alors que WebSocket commence à montrer des signes de saturation (latence qui grimpe doucement).
- À très forte charge (~1000 voitures envoyant toutes des positions très fréquemment), WebSocket devient vraiment difficilement utilisable, avec une latence qui explose. De l'autre côté, gRPC tient encore bien le choc et reste utilisable.

De manière générale, on peut dire que :

- gRPC est plus adapté si on veut gérer beaucoup de messages en temps réel, tout en gardant une bonne performance et une latence basse.
- WebSocket reste un très bon choix pour des applications plus légères, où la charge est plus raisonnable et où la simplicité du protocole est un avantage.

---
