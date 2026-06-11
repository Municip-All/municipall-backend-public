# Municip'All — Backend API

API REST NestJS pour la plateforme **Municip'All**, solution SaaS de marque blanche dédiée aux collectivités françaises. Elle alimente l'application mobile citoyenne, le backoffice mairie et le panneau d'administration plateforme.

## Vue d'ensemble

| Élément | Détail |
|---------|--------|
| Framework | NestJS 11, TypeScript 5 |
| Base de données | PostgreSQL + PostGIS (TypeORM) |
| Cache / files | Redis 7, BullMQ |
| Auth | JWT (Passport), RBAC par permissions |
| Documentation | Swagger UI sur `/docs` |
| Préfixe API | `/api/v1` |
| Port par défaut | `3000` |

## Architecture

```
src/
├── main.ts                 # Bootstrap, Swagger, CORS, préfixe global
├── app.module.ts           # Module racine
├── core/                   # Auth, guards, decorators, interceptors
├── database/               # Migration de schéma (production)
├── modules/                # Modules métier
└── shared/                 # DTOs et types partagés
```

### Modules actifs

| Module | Rôle |
|--------|------|
| **Auth** | Inscription, connexion citoyen et backoffice, JWT |
| **Users** | Profil, avatar, mot de passe, préférences, push token |
| **Reports** | Signalements citoyens géolocalisés + chat |
| **CityConfig** | Configuration multi-tenant par commune, limites GeoJSON |
| **Events** | Événements municipaux |
| **ConstructionWorks** | Travaux et chantiers |
| **ContactMessages** | Tickets de contact citoyen–mairie |
| **Staff** | Invitations équipe, KPIs, activité |
| **Notifications** | Push Expo + WebSocket temps réel |
| **Widgets** | Données agrégées pour widgets ville |
| **Weather** | Proxy OpenWeatherMap |
| **Admin** | Administration plateforme (webadmin) |
| **AiEngine** | Classification IA des signalements (OpenAI) |
| **Audit** | Journalisation des actions |

### Multi-tenant

Chaque requête peut porter l'en-tête `x-tenant-id` pour cibler une commune. Les guards globaux (`JwtAuthGuard`, `PermissionsGuard`, `TenantGuard`) appliquent l'authentification et les droits.

## Prérequis

- Node.js 18+
- npm
- Docker et Docker Compose (pour PostgreSQL, Redis, pgAdmin)

## Installation

```bash
npm install
cp .env.example .env
# Éditer .env avec vos valeurs
```

## Démarrage

### Infrastructure locale (PostgreSQL + Redis + pgAdmin)

```bash
docker compose up -d
```

| Service | Port | Accès |
|---------|------|-------|
| PostgreSQL (PostGIS) | `5432` | user: `postgres`, db: `municipall` |
| Redis | `6379` | — |
| pgAdmin | `8080` | http://localhost:8080 |

### API en développement

```bash
npm run start:dev
```

- API : http://localhost:3000/api/v1
- Swagger : http://localhost:3000/docs

En développement, TypeORM synchronise automatiquement le schéma. En production, `DatabaseSchemaService` applique les migrations sans suppression de données.

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `NODE_ENV` | Environnement | `development` |
| `PORT` | Port HTTP | `3000` |
| `DATABASE_HOST` | Hôte PostgreSQL | `localhost` |
| `DATABASE_PORT` | Port PostgreSQL | `5432` |
| `DATABASE_USER` | Utilisateur DB | `postgres` |
| `DATABASE_PASSWORD` | Mot de passe DB | — |
| `DATABASE_NAME` | Nom de la base | `municipall` |
| `REDIS_HOST` | Hôte Redis | `localhost` |
| `REDIS_PORT` | Port Redis | `6379` |
| `JWT_SECRET` | Clé de signature JWT | — |
| `PLATFORM_ADMIN_KEY` | Clé routes `/admin` (header `x-platform-admin-key`) | — |
| `OPENAI_API_KEY` | Classification IA des signalements | — |
| `OPENWEATHER_API_KEY` | API météo | — |
| `JSON_BODY_LIMIT` | Taille max du body JSON | `15mb` |
| `DB_ENSURE_SCHEMA` | Forcer sync schéma en prod | `false` |

## Scripts npm

| Commande | Description |
|----------|-------------|
| `npm run start` | Démarrage standard |
| `npm run start:dev` | Mode watch (hot-reload) |
| `npm run start:prod` | Production (`node dist/main`) |
| `npm run build` | Compilation TypeScript |
| `npm run lint` | ESLint + fix |
| `npm run test` | Tests unitaires (Jest) |
| `npm run test:e2e` | Tests end-to-end |
| `npm run test:cov` | Couverture de tests |

## Conventions de code

Chaque module NestJS suit la structure :

| Fichier | Rôle |
|---------|------|
| `*.entity.ts` | Structure de la table SQL |
| `*.repository.ts` | Requêtes SQL |
| `*.service.ts` | Logique métier |
| `*.controller.ts` | Routes HTTP |
| `*.module.ts` | Regroupement et enregistrement |

## Déploiement Docker

Le dépôt inclut plusieurs fichiers Compose :

| Fichier | Usage |
|---------|-------|
| `docker-compose.yml` | Infra locale (Postgres, Redis, pgAdmin) |
| `docker-compose.dev.yml` | Stack dev (backend port `3001`) |
| `docker-compose.prod.yml` | Stack production |
| `docker-compose.proxy.yml` | Nginx Proxy Manager |

Le `Dockerfile` utilise Node 20 Alpine en build multi-stage.

## Écosystème Municip'All

| Projet | Rôle |
|--------|------|
| [municipall-frontend-public](../municipall-frontend-public) | Site vitrine marketing |
| [municipall-mobile-public](../municipall-mobile-public) | Application mobile citoyenne |
| [municipall-web-backoffice-public](../municipall-web-backoffice-public) | Backoffice mairie |
| [municipall-webadmin-public](../municipall-webadmin-public) | Administration plateforme |

## Licence

UNLICENSED — Projet privé
