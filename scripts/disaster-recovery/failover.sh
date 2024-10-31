#!/bin/bash

# Load environment variables
source .env

# Initiate RDS failover
aws rds failover-db-cluster \
    --db-cluster-identifier $DB_CLUSTER

# Wait for failover to complete
aws rds wait db-cluster-available \
    --db-cluster-identifier $DB_CLUSTER

# Update application configuration
aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --force-new-deployment

# Notify failover completion
./scripts/notify.sh "Database failover completed"