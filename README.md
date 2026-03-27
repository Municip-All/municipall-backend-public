<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

  Rôle de chaque fichier

  ┌─────────────────┬──────────────────────────────────────┐
  │     Fichier     │                 Rôle                 │
  ├─────────────────┼──────────────────────────────────────┤
  │ *.entity.ts     │ Définit la structure de la table SQL │
  ├─────────────────┼──────────────────────────────────────┤
  │ *.repository.ts │ Requêtes SQL (find, save, delete...) │
  ├─────────────────┼──────────────────────────────────────┤
  │ *.services.ts   │ Logique métier                       │
  ├─────────────────┼──────────────────────────────────────┤
  │ *.controller.ts │ Routes HTTP (GET, POST...)           │
  ├─────────────────┼──────────────────────────────────────┤
  │ *.module.ts     │ Regroupe tout + enregistre l'entity  │
  └─────────────────┴──────────────────────────────────────┘

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
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
