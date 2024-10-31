terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr        = var.vpc_cidr
  environment     = var.environment
  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  cluster_name    = "${var.project_name}-${var.environment}"
  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.private_subnets
  environment     = var.environment
  container_image = var.container_image
  container_port  = var.container_port
  desired_count   = var.desired_count
  cpu             = var.cpu
  memory          = var.memory
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  identifier        = "${var.project_name}-${var.environment}"
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnets
  environment       = var.environment
  engine_version    = "13.7"
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"
  
  cluster_id        = "${var.project_name}-${var.environment}"
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnets
  environment       = var.environment
  node_type         = var.redis_node_type
  num_cache_nodes   = var.redis_num_nodes
}

# Load Balancer
module "alb" {
  source = "./modules/alb"
  
  name            = "${var.project_name}-${var.environment}"
  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  environment     = var.environment
  certificate_arn = var.certificate_arn
}