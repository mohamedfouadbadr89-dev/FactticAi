# Facttic Integration Testing Environment Variables
# Injected via GitHub Actions during Automated Test Pipeline runs against ephemeral targets.

aws_region           = "us-east-1"
environment          = "integration"
tenant_name          = "facttic-ci-runner"

# Smaller footprint for CI runs, optimizing cost over long-lived performance
ecs_cpu              = "256"
ecs_memory           = "512"
rds_instance_class   = "db.t4g.micro"

# Ephemeral databases will be automatically provisioned and torn down
enable_deletion_protection = false
