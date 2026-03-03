-- Phase 16: Enterprise Configuration & Data Residency
-- Description: Adds hierarchical JSONB settings tracking and immutable configuration versioning for enterprise tenants.

-- 1. Extend Organizations for Data Residency
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS data_region TEXT DEFAULT 'us-east-1';

-- 2. Tenant Configurations Table
-- Stores the active configuration state for an organization.
CREATE TABLE IF NOT EXISTS public.tenant_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id)
);

-- Enable RLS
ALTER TABLE public.tenant_configs ENABLE ROW LEVEL SECURITY;

-- Select policy: Users can view their own org's config
CREATE POLICY "Users can view tenant config for their organization"
ON public.tenant_configs
FOR SELECT
USING (org_id = ANY(public.get_auth_orgs()));

-- Update policy: Only Admins can update config (Assuming role checks exist in application logic or via specific RLS functions)
CREATE POLICY "Admins can update tenant config"
ON public.tenant_configs
FOR UPDATE
USING (org_id = ANY(public.get_auth_orgs()));

-- 3. Tenant Configuration Versions Table
-- Immutable audit log tracking all historical changes to an organization's configuration.
CREATE TABLE IF NOT EXISTS public.tenant_config_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    config_id UUID NOT NULL REFERENCES public.tenant_configs(id) ON DELETE CASCADE,
    settings JSONB NOT NULL,
    version INTEGER NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tenant_config_versions ENABLE ROW LEVEL SECURITY;

-- Select policy: Users can view their own org's config history
CREATE POLICY "Users can view tenant config history for their organization"
ON public.tenant_config_versions
FOR SELECT
USING (org_id = ANY(public.get_auth_orgs()));

-- Prevent Updates/Deletes on audit log
CREATE POLICY "Prevent updates to config versions"
ON public.tenant_config_versions
FOR UPDATE
USING (false);

CREATE POLICY "Prevent deletes on config versions"
ON public.tenant_config_versions
FOR DELETE
USING (false);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_tenant_configs_org ON public.tenant_configs(org_id);
CREATE INDEX IF NOT EXISTS idx_tenant_config_versions_org ON public.tenant_config_versions(org_id);
CREATE INDEX IF NOT EXISTS idx_tenant_config_versions_config_id ON public.tenant_config_versions(config_id);

-- 4. Trigger to automatically create a version record on config updates
CREATE OR REPLACE FUNCTION public.audit_tenant_config_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment version
    NEW.version = OLD.version + 1;
    NEW.updated_at = NOW();

    -- Insert into history table
    INSERT INTO public.tenant_config_versions (org_id, config_id, settings, version, changed_by)
    VALUES (NEW.org_id, NEW.id, NEW.settings, NEW.version, NEW.updated_by);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tenant_config_update
    BEFORE UPDATE ON public.tenant_configs
    FOR EACH ROW
    WHEN (OLD.settings IS DISTINCT FROM NEW.settings)
    EXECUTE FUNCTION public.audit_tenant_config_update();
