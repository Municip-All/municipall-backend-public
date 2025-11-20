# Database - Municipall PostgreSQL

Configuration Docker Compose pour la base de données PostgreSQL de Municipall.

## Démarrage

```bash
docker-compose up -d
```

## Arrêt

```bash
docker-compose down
```

## Accès

### PostgreSQL
- Host: `localhost`
- Port: `5432`
- Database: `my_database`
- User: `postgres`
- Password: `secret`

### pgAdmin
- URL: http://localhost:8080
- Email: `admin@admin.com`
- Password: `admin`

## Scripts d'initialisation

Les fichiers SQL dans le dossier `init/` sont exécutés automatiquement au premier démarrage :
- `001_schema.sql` : Création des tables
- `002_schema.sql` : Insertion des données initiales

Pour plus d'informations, consultez le [README principal](../../README.md).
