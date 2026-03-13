# Facttic Staging Environment Variables
# Matches Production constraints as closely as possible for User Acceptance Testing (UAT).

aws_region           = "us-east-1"
environment          = "staging"
tenant_name          = "facttic-staging-demo"

# Heavier footprint mapping Production execution tiers reliably
ecs_cpu              = "1024"
ecs_memory           = "2048"
rds_instance_class   = "db.r6g.large"

# Deletion protection explicitly enabled mirroring Production to prevent accidental teardowns
enable_deletion_protection = true
