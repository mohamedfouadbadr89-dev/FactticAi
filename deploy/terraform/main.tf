terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- VPC Isolation Architecture ---
resource "aws_vpc" "facttic_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "Facttic-Enterprise-VPC"
    Environment = var.environment
    Tenant      = var.tenant_name
  }
}

# Web Subnets (ECS/Fargate Frontend)
resource "aws_subnet" "facttic_public_1" {
  vpc_id                  = aws_vpc.facttic_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "Facttic-Public-1"
  }
}

# Database Subnets (RDS/Aurora)
resource "aws_subnet" "facttic_private_1" {
  vpc_id            = aws_vpc.facttic_vpc.id
  cidr_block        = "10.0.100.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "Facttic-Private-DB-1"
  }
}

# --- Database Tier ---
resource "aws_db_subnet_group" "facttic_db_subnet" {
  name       = "facttic-db-subnet-group"
  subnet_ids = [aws_subnet.facttic_private_1.id]
}

resource "aws_rds_cluster" "facttic_aurora" {
  cluster_identifier      = "facttic-enterprise-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.3"
  database_name           = "facttic"
  master_username         = "facttic_admin"
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.facttic_db_subnet.name
  skip_final_snapshot     = true
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.facttic_customer_key.arn 
}

# --- BYOK Encryption Key Layer ---
resource "aws_kms_key" "facttic_customer_key" {
  description             = "Facttic Enterprise BYOK Master Key (${var.tenant_name})"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "facttic_key_alias" {
  name          = "alias/facttic/byok/${var.tenant_name}"
  target_key_id = aws_kms_key.facttic_customer_key.key_id
}

# --- Compute Tier (ECS) ---
resource "aws_ecs_cluster" "facttic_cluster" {
  name = "facttic-cluster-${var.environment}"
}

resource "aws_ecs_task_definition" "facttic_app" {
  family                   = "facttic-nextjs"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024
  memory                   = 2048

  container_definitions = jsonencode([
    {
      name      = "facttic-web"
      image     = "${var.ecr_repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "DATABASE_URL", value = "postgres://facttic_admin:${var.db_password}@${aws_rds_cluster.facttic_aurora.endpoint}:5432/facttic" }
      ]
    }
  ])
}

# --- Variables ---
variable "aws_region" {
  default = "us-east-1"
}

variable "tenant_name" {
  description = "The corporate ID of the enterprise tenant mapping this deployment"
  type        = string
}

variable "environment" {
  default = "production"
}

variable "db_password" {
  sensitive = true
}

variable "ecr_repository_url" {
  type = string
}
