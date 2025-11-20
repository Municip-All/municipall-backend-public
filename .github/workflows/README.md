# GitHub Actions - Configuration de déploiement

## Vue d'ensemble

Ce projet utilise GitHub Actions pour déployer automatiquement l'application sur un VPS OVH selon la branche :
- **Branch `main`** → Déploiement en **Production**
- **Branch `dev`** → Déploiement en **Development**

## Configuration requise sur GitHub

### 1. Secrets à configurer

Allez dans **Settings → Secrets and variables → Actions** de votre repository GitHub et ajoutez les secrets suivants :

#### Pour l'environnement Production (main) :
- `PROD_VPS_HOST` : L'adresse IP ou le hostname de votre VPS OVH (ex: `vps-xxxxx.ovh.net`)
- `PROD_VPS_USERNAME` : Le nom d'utilisateur SSH (généralement `root` ou un utilisateur dédié)
- `PROD_VPS_SSH_KEY` : La clé privée SSH pour se connecter au VPS (voir section suivante)
- `PROD_VPS_PORT` : Le port SSH (optionnel, par défaut : 22)
- `PROD_VPS_DEPLOY_PATH` : Le chemin où déployer l'application (ex: `/var/www/municipall-prod`)

#### Pour l'environnement Development (dev) :
- `DEV_VPS_HOST` : L'adresse IP ou le hostname de votre VPS OVH
- `DEV_VPS_USERNAME` : Le nom d'utilisateur SSH
- `DEV_VPS_SSH_KEY` : La clé privée SSH pour se connecter au VPS
- `DEV_VPS_PORT` : Le port SSH (optionnel, par défaut : 22)
- `DEV_VPS_DEPLOY_PATH` : Le chemin où déployer l'application (ex: `/var/www/municipall-dev`)

### 2. Génération de la clé SSH

Sur votre machine locale, générez une paire de clés SSH :

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

- La clé publique sera dans `~/.ssh/github_actions_deploy.pub`
- La clé privée sera dans `~/.ssh/github_actions_deploy`

### 3. Installation de la clé publique sur le VPS

Copiez la clé publique sur votre VPS OVH :

```bash
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub username@vps-host
```

Ou manuellement :

```bash
# Sur le VPS
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "CONTENU_DE_LA_CLE_PUBLIQUE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 4. Ajout de la clé privée dans GitHub Secrets

```bash
# Afficher la clé privée
cat ~/.ssh/github_actions_deploy
```

Copiez tout le contenu (y compris `-----BEGIN OPENSSH PRIVATE KEY-----` et `-----END OPENSSH PRIVATE KEY-----`) et ajoutez-le dans les secrets `PROD_VPS_SSH_KEY` et `DEV_VPS_SSH_KEY`.

## Configuration requise sur le VPS

### 1. Installation de Node.js et PM2

```bash
# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2 globalement
sudo npm install -g pm2

# Configurer PM2 pour démarrer au boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

### 2. Création des répertoires de déploiement

```bash
# Pour production
sudo mkdir -p /var/www/municipall-prod
sudo chown -R $USER:$USER /var/www/municipall-prod

# Pour development
sudo mkdir -p /var/www/municipall-dev
sudo chown -R $USER:$USER /var/www/municipall-dev
```

### 3. Configuration des variables d'environnement

Créez les fichiers `.env` dans les répertoires de déploiement :

```bash
# Production
nano /var/www/municipall-prod/packages/backend/.env

# Development
nano /var/www/municipall-dev/packages/backend/.env
```

Exemple de fichier `.env` :

```env
NODE_ENV=production
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=municipall_user
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=municipall_db
```

### 4. Configuration de la base de données

Si vous utilisez Docker pour PostgreSQL :

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Démarrer la base de données
cd /var/www/municipall-prod/packages/database
docker-compose up -d
```

### 5. Configuration du firewall (optionnel)

```bash
# Autoriser le port de l'application
sudo ufw allow 3000/tcp  # Pour production
sudo ufw allow 3001/tcp  # Pour development (si port différent)
```

## Workflow de déploiement

### Ce qui se passe lors d'un push :

1. **Checkout du code** : Le code est récupéré depuis GitHub
2. **Installation des dépendances** : `npm install` dans le monorepo et le backend
3. **Build** : Compilation du code TypeScript en JavaScript
4. **Transfer vers le VPS** : Les fichiers sont copiés via SCP
5. **Installation sur le VPS** : Les dépendances de production sont installées
6. **Redémarrage de l'application** : PM2 redémarre ou démarre l'application
7. **Vérification** : Les logs sont affichés pour confirmer le déploiement

### Commandes utiles sur le VPS

```bash
# Voir les applications en cours d'exécution
pm2 list

# Voir les logs
pm2 logs municipall-backend-prod
pm2 logs municipall-backend-dev

# Redémarrer manuellement
pm2 restart municipall-backend-prod
pm2 restart municipall-backend-dev

# Arrêter une application
pm2 stop municipall-backend-prod

# Supprimer une application
pm2 delete municipall-backend-prod
```

## Personnalisation

### Changer les ports

Si vous voulez que dev et prod tournent sur des ports différents, modifiez les fichiers `.env` respectifs :

```env
# Production: /var/www/municipall-prod/packages/backend/.env
PORT=3000

# Development: /var/www/municipall-dev/packages/backend/.env
PORT=3001
```

### Ajouter des étapes de déploiement

Vous pouvez modifier les fichiers `.github/workflows/deploy-*.yml` pour ajouter :
- Des tests avant déploiement
- Des notifications (Slack, Discord, etc.)
- Des migrations de base de données
- Des health checks

### Utiliser le même VPS pour les deux environnements

Si vous utilisez le même VPS pour dev et prod, utilisez les mêmes valeurs pour :
- `*_VPS_HOST`
- `*_VPS_USERNAME`
- `*_VPS_SSH_KEY`
- `*_VPS_PORT`

Mais des chemins différents pour `*_VPS_DEPLOY_PATH`.

## Troubleshooting

### Le déploiement échoue avec une erreur SSH

1. Vérifiez que la clé SSH est correctement configurée
2. Testez la connexion manuellement : `ssh -i ~/.ssh/github_actions_deploy username@vps-host`
3. Vérifiez les permissions : `chmod 600 ~/.ssh/authorized_keys` sur le VPS

### L'application ne démarre pas

1. Vérifiez les logs : `pm2 logs municipall-backend-prod --lines 50`
2. Vérifiez le fichier `.env`
3. Vérifiez que la base de données est accessible

### Erreur de permissions

```bash
# Sur le VPS, ajustez les permissions
sudo chown -R $USER:$USER /var/www/municipall-prod
sudo chown -R $USER:$USER /var/www/municipall-dev
```

## Sécurité

- ⚠️ **Ne commitez JAMAIS** vos clés SSH ou fichiers `.env` dans le repository
- Utilisez des clés SSH différentes pour chaque environnement si possible
- Changez régulièrement vos mots de passe de base de données
- Configurez un firewall sur votre VPS
- Utilisez HTTPS avec Let's Encrypt pour la production

## Support

Pour toute question, consultez la documentation officielle :
- [GitHub Actions](https://docs.github.com/en/actions)
- [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [NestJS](https://docs.nestjs.com/)
