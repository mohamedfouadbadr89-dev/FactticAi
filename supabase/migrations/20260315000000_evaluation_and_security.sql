-- Evaluation Runs Table
CREATE TABLE IF NOT EXISTS evaluation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_name TEXT NOT NULL,
    scenario TEXT NOT NULL,
    model TEXT NOT NULL,
    risk_score NUMERIC NOT NULL,
    hallucination_flag BOOLEAN NOT NULL DEFAULT FALSE,
    policy_violation BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    user_id UUID,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deployment Configs Table
CREATE TABLE IF NOT EXISTS deployment_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_mode TEXT NOT NULL DEFAULT 'cloud',
    region TEXT NOT NULL,
    provider TEXT NOT NULL,
    vpc_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
