#!/bin/bash

# Exit on any error
set -e

# Load environment variables
source .env

# Check required environment variables
if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ] || [ -z "$DEPLOY_KEY" ]; then
    echo "Missing required deployment variables"
    exit 1
fi

# Deploy to server
echo "Deploying to $DEPLOY_HOST..."

# Copy deployment files
scp -i $DEPLOY_KEY docker-compose.yml $DEPLOY_USER@$DEPLOY_HOST:/opt/pllay-integration/
scp -i $DEPLOY_KEY .env $DEPLOY_USER@$DEPLOY_HOST:/opt/pllay-integration/

# Execute deployment commands
ssh -i $DEPLOY_KEY $DEPLOY_USER@$DEPLOY_HOST << 'ENDSSH'
    cd /opt/pllay-integration
    docker-compose pull
    docker-compose up -d
    docker system prune -f
ENDSSH

echo "Deployment completed successfully"