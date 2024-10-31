resource "aws_elasticache_cluster" "main" {
  cluster_id           = var.cluster_id
  engine              = "redis"
  node_type           = var.node_type
  num_cache_nodes     = var.num_cache_nodes
  parameter_group_name = "default.redis6.x"
  port                = 6379
  
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  snapshot_retention_limit = 7
  snapshot_window         = "05:00-09:00"
  
  tags = {
    Name        = "${var.cluster_id}-redis"
    Environment = var.environment
  }
}