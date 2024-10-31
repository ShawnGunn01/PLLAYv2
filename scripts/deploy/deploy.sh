#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env

# Build and tag Docker image
docker build -t $ECR_REPOSITORY:$VERSION .
docker tag $ECR_REPOSITORY:$VERSION $ECR_REPOSITORY:latest

# Push to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY
docker push $ECR_REPOSITORY:$VERSION
docker push $ECR_REPOSITORY:latest

# Update ECS service
aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --force-new-deployment

# Wait for deployment to complete
aws ecs wait services-stable \
    --cluster $ECS_CLUSTER \
    --services $ECS_SERVICE

# Run database migrations
npm run migrate

# Notify deployment completion
./scripts/notify.sh "Deployment completed successfully: v$VERSION"