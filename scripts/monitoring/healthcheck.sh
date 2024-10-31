#!/bin/bash

# Load environment variables
source .env

# Check API health
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ $API_STATUS -ne 200 ]; then
    ./scripts/notify.sh "API health check failed: $API_STATUS" "error"
fi

# Check database connection
DB_STATUS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\q' 2>&1)
if [ $? -ne 0 ]; then
    ./scripts/notify.sh "Database connection check failed: $DB_STATUS" "error"
fi

# Check Redis connection
REDIS_STATUS=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT ping)
if [ "$REDIS_STATUS" != "PONG" ]; then
    ./scripts/notify.sh "Redis connection check failed" "error"
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    ./scripts/notify.sh "High disk usage: ${DISK_USAGE}%" "warning"
fi