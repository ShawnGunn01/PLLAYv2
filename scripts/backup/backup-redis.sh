#!/bin/bash

# Load environment variables
source .env

# Set backup directory
BACKUP_DIR="/opt/pllay/backups/redis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pllay_redis_$TIMESTAMP.rdb"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Trigger Redis SAVE
redis-cli -h $REDIS_HOST -p $REDIS_PORT SAVE

# Copy RDB file
docker cp $(docker ps -qf name=redis):/data/dump.rdb $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://$BACKUP_BUCKET/redis/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete

# Notify on completion
if [ $? -eq 0 ]; then
    echo "Redis backup completed successfully"
    ./scripts/notify.sh "Redis backup completed: $BACKUP_FILE"
else
    echo "Redis backup failed"
    ./scripts/notify.sh "Redis backup failed" "error"
fi