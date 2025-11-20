# Municipall Monorepo

Ce monorépo contient l'ensemble du projet Municipall, incluant le backend API et la configuration de la base de données.

## 📁 Structure du projet

```
municipall-monorepo/
├── packages/
│   ├── backend/          # API NestJS
│   └── database/         # Configuration PostgreSQL avec Docker
├── package.json          # Configuration du monorépo
└── README.md
```

## 🚀 Démarrage rapide

### Prérequis

- Node.js (v18 ou supérieur)
- npm
- Docker et Docker Compose

### Installation initiale

```bash
# Installation complète (backend + démarrage de la base de données)
npm run setup
```

## 📦 Packages

### Backend (`packages/backend`)

API NestJS avec les modules suivants :
- **Users** : Gestion des utilisateurs
- **Reports** : Gestion des signalements

#### Commandes disponibles

```bash
# Installer les dépendances
npm run backend:install

# Développement avec hot-reload
npm run backend:dev

# Build pour la production
npm run backend:build

# Démarrer en production
npm run backend:start

# Tests
npm run backend:test

# Linter
npm run backend:lint
```

### Database (`packages/database`)

Configuration PostgreSQL avec Docker Compose incluant :
- PostgreSQL (port 5432)
- pgAdmin (port 8080)
- Scripts d'initialisation SQL

#### Commandes disponibles

```bash
# Démarrer la base de données
npm run db:up

# Arrêter la base de données
npm run db:down

# Voir les logs
npm run db:logs

# Réinitialiser la base de données (supprime les données)
npm run db:reset
```

## 🛠️ Développement

### Démarrer l'environnement complet

```bash
# Démarre la base de données et le backend en mode dev
npm run dev
```

### Connexion à la base de données

**PostgreSQL**
- Host: `localhost`
- Port: `5432`
- Database: `my_database`
- User: `postgres`
- Password: `secret`

**pgAdmin**
- URL: http://localhost:8080
- Email: `admin@admin.com`
- Password: `admin`

## 📊 Base de données

### Schéma

#### Table `users`
- `id`: SERIAL PRIMARY KEY
- `name`: VARCHAR(50)
- `email`: VARCHAR(50) UNIQUE
- `password`: VARCHAR(50) (doit contenir #)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

#### Table `report`
- `id`: SERIAL PRIMARY KEY
- `user_id`: INT (FK vers users)
- `content`: VARCHAR(1000)
- `created_at`: TIMESTAMP
- `status`: VARCHAR(20) (pending, readed, solved, rejected)

## 🧪 Tests

```bash
# Tests du backend
npm run backend:test
```

## 📝 Licence

UNLICENSED - Projet privé
