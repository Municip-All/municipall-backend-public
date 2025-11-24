# Déploiement GitHub Actions – Backend Nest.js

Ce dépôt utilise le workflow `.github/workflows/deploy.yml` pour livrer automatiquement l'API Nest.js, PostgreSQL et Redis sur un VPS OVH via Docker Compose. Le workflow se déclenche à chaque `push` sur `main` et peut être lancé manuellement (`workflow_dispatch`) pour d'autres environnements.

## 1. Secrets GitHub

Définissez les secrets suivants (communs à tous les environnements) :

| Secret | Description |
| --- | --- |
| `VPS_HOST` | Nom d'hôte ou IP du VPS OVH. |
| `VPS_USER` | Utilisateur SSH limité (ex. `deploy`). |
| `SSH_KEY` | Clé privée OpenSSH utilisée par le workflow. |
| `SSH_PORT` | Port SSH (défaut `22`). |

## 2. Fonctionnement du workflow

1. **Checkout & Node 20** – Prépare l'environnement CI.
2. **`npm ci` + tests + build** – Valide le backend Nest.js avant la livraison.
3. **Packaging** – Crée `deploy.tar.gz` (backend, `docker-compose.yml`, fichiers nécessaires).
4. **Transfert** – Copie l'archive sur le VPS (`/home/deploy/apps/municipall-backend`).
5. **Déploiement Compose** – Décompresse dans `releases/<commit>`, bascule le lien `current` et exécute `docker compose --env-file .env.<env> up -d` pour `backend`, `postgres`, `redis`. Les volumes conservent toutes les données.
6. **Nettoyage** – Seuls les trois derniers releases sont conservés.

## 3. Préparation du VPS (utilisateur `deploy`)

```bash
# Créer l'utilisateur et l'ajouter au groupe docker
sudo adduser deploy
sudo usermod -aG docker deploy

# Préparer l'arborescence
sudo mkdir -p /home/deploy/apps/municipall-backend/releases
sudo chown -R deploy:deploy /home/deploy/apps

# Installer Docker + plugin compose
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker

# Copier la clé publique GitHub Actions
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub deploy@VPS_HOST
```

### Fichiers `.env.<env>` sur le serveur

Créez un fichier par environnement directement dans son dossier `DEPLOY_PATH` (ex. `/home/deploy/apps/municipall-backend/production/.env.production`, `/home/deploy/apps/municipall-backend/dev/.env.dev`). Exemple de contenu :

```env
NODE_ENV=production
DEPLOY_ENV=production
BACKEND_PORT=3000
POSTGRES_PORT=5432
POSTGRES_DB=municipall
POSTGRES_USER=municipall
POSTGRES_PASSWORD=change_me
JWT_SECRET=change_me
REDIS_PASSWORD=change_me
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=change_me
PGADMIN_PORT=8080
```

Créez un fichier par environnement (`.env.dev`, `.env.staging`, …). Ils ne sont jamais copiés depuis GitHub : gardez-les sur le VPS.

## 4. Docker Compose attendu

- Fichier `docker-compose.yml` à la racine (fourni dans ce dépôt) avec les services `backend`, `postgres`, `redis` et `pgadmin`.
- Les ports exposés peuvent être ajustés par environnement via `BACKEND_PORT`, `POSTGRES_PORT` et `PGADMIN_PORT` (pratique pour faire tourner plusieurs stacks sur le même VPS).
- Volumes : `postgres_data`, `redis_data`, `pgadmin_data` → aucune réinitialisation de données entre déploiements.
- La commande `docker compose --env-file .env.production up -d` doit fonctionner localement sur le VPS.

## 5. Étendre à plusieurs environnements

- Lancer manuellement le workflow et renseigner `environment` (`production`, `staging`, `dev`, ...).
- Ajouter le fichier `.env.<env>` correspondant sur le VPS.
- Optionnel : adapter `DEPLOY_PATH`/`APP_NAME` dans le workflow si vous séparez physiquement les environnements.

## 6. Rollback & maintenance

```bash
cd /home/deploy/apps/municipall-backend
ls releases            # choisir un commit précédent
ln -sfn releases/<commit_id> current
cd current && docker compose --env-file .env.production up -d backend
```

- Seul l'utilisateur `deploy` (non-root) est utilisé par GitHub Actions.
- Gardez vos volumes (`postgres_data`, `redis_data`) pour préserver les données.
- Ne commitez jamais de secrets `.env` dans le dépôt.

Avec cette configuration, `deploy.yml` fournit un déploiement reproductible, sécurisé et prêt pour de futurs environnements.
