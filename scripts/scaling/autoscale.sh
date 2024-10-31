#!/bin/bash

# Load environment variables
source .env

# Get current metrics
CPU_USAGE=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ClusterName,Value=$ECS_CLUSTER \
    --start-time $(date -u -v-5M '+%Y-%m-%dT%H:%M:%SZ') \
    --end-time $(date -u '+%Y-%m-%dT%H:%M:%SZ') \
    --period 300 \
    --statistics Average \
    --query 'Datapoints[0].Average' \
    --output text)

# Scale up if CPU usage is high
if [ $(echo "$CPU_USAGE > 70" | bc) -eq 1 ]; then
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --desired-count $(($CURRENT_COUNT + 1))
    
    ./scripts/notify.sh "Scaling up ECS service due to high CPU usage: ${CPU_USAGE}%"
fi

# Scale down if CPU usage is low
if [ $(echo "$CPU_USAGE < 30" | bc) -eq 1 ]; then
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --desired-count $(($CURRENT_COUNT - 1))
    
    ./scripts/notify.sh "Scaling down ECS service due to low CPU usage: ${CPU_USAGE}%"
fi