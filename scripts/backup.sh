#!/bin/bash

# Exit on any error
set -e

# Load environment variables
source .env

# Set backup directory
BACKUP_DIR="/opt/pllay-integration/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
echo "Backing up PostgreSQL database..."
docker-compose exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > "$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz"

# Backup Redis data
echo "Backing up Redis data..."
docker-compose exec -T redis redis-cli SAVE
docker cp $(docker-compose ps -q redis):/data/dump.rdb "$BACKUP_DIR/redis_$TIMESTAMP.rdb"

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed successfully"