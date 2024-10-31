#!/bin/bash

# Exit on any error
set -e

# Load environment variables
source .env

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Please provide the backup file path"
    exit 1
fi

BACKUP_FILE=$1

# Restore PostgreSQL database
if [[ $BACKUP_FILE == *postgres* ]]; then
    echo "Restoring PostgreSQL database..."
    gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB
fi

# Restore Redis data
if [[ $BACKUP_FILE == *redis* ]]; then
    echo "Restoring Redis data..."
    docker cp $BACKUP_FILE $(docker-compose ps -q redis):/data/dump.rdb
    docker-compose restart redis
fi

echo "Restore completed successfully"