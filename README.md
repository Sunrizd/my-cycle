# My Cycle - Suivi de Cycle Menstruel Respectueux de la Vie Privée

My Cycle est une application moderne de suivi du cycle menstruel, auto-hébergeable, conçue pour la confidentialité et la simplicité. Elle permet aux utilisateurs de suivre leurs cycles, symptômes et humeurs sans que leurs données ne quittent leur propre serveur.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14-green)

## 🌟 Fonctionnalités Clés

-   **Confidentialité Avant Tout** : Toutes les données sont stockées localement dans une base de données SQLite. Aucun suivi externe ni utilisation par des tiers.
-   **Suivi de Cycle** : Enregistrez les dates de début et de fin de vos règles.
-   **Prédictions Intelligentes** : Prédit automatiquement vos prochaines règles, le jour de l'ovulation et la fenêtre de fertilité en fonction de votre historique.
-   **Journal des Symptômes** : Suivez l'intensité des saignements, les crampes, l'humeur et d'autres symptômes sur une échelle de 1 à 5.
-   **Statistiques Visuelles** : Visualisez des graphiques et des tendances pour la durée de votre cycle et de vos règles.
-   **Tableau de Bord Admin** : Gestion des utilisateurs et statistiques système intégrées.
-   **Design Responsive** : Interface utilisateur entièrement responsive qui fonctionne parfaitement sur ordinateur et mobile.
-   **Mode Sombre/Clair** : Basculez entre les thèmes selon vos préférences.
-   **Chiffrement des Données** : Vos données sensibles (cycles, symptômes, paramètres, profil) sont chiffrées (AES-256-GCM) avant d'être enregistrées en base de données pour une sécurité maximale.
-   **Partage Partenaire** : Partagez un accès en lecture seule à votre calendrier via un lien unique sécurisé.
-   **SEO & PWA** : Optimisé pour les moteurs de recherche et installable comme une application native (PWA).

## 🛠️ Stack Technologique

-   **Frontend** : Vanilla JavaScript (ES Modules), Vite, CSS.
-   **Backend** : Node.js, Express.
-   **Base de Données** : SQLite (stockage local fiable et performant, chiffré).
-   **Authentification** : Authentification basée sur JWT.
-   **Sécurité** : Chiffrement AES-256-GCM pour les données utilisateur.

## 🚀 Pour Commencer

### Prérequis

-   **Node.js** (v14 ou supérieur)
-   **npm** (généralement inclus avec Node.js)

### Installation

1.  **Cloner le dépôt**
    ```bash
    git clone https://github.com/Sunrizd/my-cycle.git
    cd my-cycle
    ```

2.  **Installer les Dépendances**
    ```bash
    npm install
    ```

3.  **Configurer l'Environnement**
    Copiez le fichier d'exemple d'environnement et configurez-le :
    ```bash
    cp .env.example .env
    ```
    Modifiez `.env` et définissez vos secrets :
    -   `FRONTEND_PORT` : Port pour le frontend Vite (défaut : 5173).
    -   `PORT` : Port pour le serveur backend (défaut : 3005).
    -   `JWT_SECRET` : Une longue chaîne aléatoire pour signer les jetons de session.
    -   `DEFAULT_ADMIN_USER` : Nom d'utilisateur pour le compte administrateur initial.
    -   `DEFAULT_ADMIN_PASS` : Mot de passe pour le compte administrateur initial.
    -   `ALLOWED_HOSTS` : Liste des hôtes autorisés séparés par des virgules (ex: `localhost,example.com`).
    -   `ENCRYPTION_KEY` : **Critique**. Clé hexadécimale de 64 caractères pour le chiffrement des données. Ne la perdez pas !
    -   `VITE_APP_URL` : URL publique de votre instance (pour le SEO et le partage).

### Lancer Localement

Pour démarrer à la fois le frontend (Vite) et le backend (Node) simultanément :

```bash
npm run dev
```



-   **Frontend** : `http://localhost:5173` (ou votre port configuré)
-   **Backend** : `http://localhost:3005` (ou votre port configuré)

## 📂 Structure du Projet

```
my-cycle/
├── data/               # Base de données SQLite (period_tracker.db)
├── public/             # Actifs statiques et favicons
├── server/             # Serveur Backend Express
│   ├── routes.js       # Routes API (avec chiffrement)
│   ├── auth.js         # Logique d'authentification
│   ├── crypto.js       # Module de chiffrement AES-256-GCM
│   └── db.js           # Gestion de la base de données
├── src/                # Code source Frontend
│   ├── assets/         # Images et icônes
│   ├── components/     # Composants UI (Modal, Calendar, etc.)
│   └── main.js         # Point d'entrée

├── .env.example        # Modèle de variables d'environnement
└── package.json        # Dépendances du projet et scripts
```

## 📜 Scripts

-   `npm run dev` : Démarre le client et le serveur en mode développement avec horodatage des logs.
-   `npm run build` : Compile le frontend pour la production.
-   `npm run server` : Lance uniquement le serveur backend.
-   `npm run client` : Lance uniquement le serveur de développement frontend.
-   `npm run lint` : Lance ESLint.
-   `npm test` : Lance les tests avec Vitest.


## 🔐 Configuration Admin

L'application prend en charge un rôle administrateur pour gérer les utilisateurs.

**Configuration Initiale** :
Lorsque vous lancez le serveur pour la première fois, il tente de créer un utilisateur administrateur par défaut basé sur votre configuration `.env` (`DEFAULT_ADMIN_USER`, `DEFAULT_ADMIN_PASS`).



## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.
