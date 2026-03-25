-- Create external_integrations table for voice provider webhooks
CREATE TABLE IF NOT EXISTS public.external_integrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id),
  provider text NOT NULL,
  webhook_secret text,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can see their org integrations" 
  ON public.external_integrations FOR SELECT
  USING (org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage integrations" 
  ON public.external_integrations FOR ALL
  USING (org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid()));
