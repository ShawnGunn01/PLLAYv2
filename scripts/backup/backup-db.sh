#!/bin/bash

# Load environment variables
source .env

# Set backup directory
BACKUP_DIR="/opt/pllay/backups/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pllay_db_$TIMESTAMP.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform database backup
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://$BACKUP_BUCKET/db/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete

# Notify on completion
if [ $? -eq 0 ]; then
    echo "Database backup completed successfully"
    ./scripts/notify.sh "Database backup completed: $BACKUP_FILE"
else
    echo "Database backup failed"
    ./scripts/notify.sh "Database backup failed" "error"
fi