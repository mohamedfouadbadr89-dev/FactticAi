import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface MaturityIndexResult {
    org_id: string;
    maturity_score: number;
    metrics: {
        policy_coverage: number;
        drift_stability: number;
        risk_exposure: number;
        incident_frequency: number;
    }
}

export class MaturityIndex {
    /**
     * Calculates the Governance Maturity Score computing explicitly against active policies,
     * historical forensics, and executed simulation traces.
     */
    static async calculateMaturity(org_id: string): Promise<MaturityIndexResult> {
        // Default Baseline Values
        let policy_coverage = 0;
        let drift_stability = 100; // Starts perfect until drift decays it
        let risk_exposure = 100;
        let incident_frequency = 100; 

        // 1. Policy Coverage: Measure against the 4 core rule types
        const { data: policies, error: polErr } = await supabase
            .from('governance_policies')
            .select('rule_type')
            .eq('org_id', org_id);

        if (!polErr && policies) {
            const uniqueRules = new Set(policies.map(p => p.rule_type)).size;
            // 4 Core Types defined: hallucination_rate, tone_violation, pii_exposure, instruction_override
            policy_coverage = Math.min((uniqueRules / 4) * 100, 100); 
        }

        // 2. Drift Stability: Map through behavior_forensics scores natively
        const { data: forensics, error: forErr } = await supabase
            .from('behavior_forensics')
            .select('signal_score')
            .eq('org_id', org_id)
            .order('created_at', { ascending: false })
            .limit(100);

        if (!forErr && forensics && forensics.length > 0) {
            const avgDrift = forensics.reduce((acc, curr) => acc + curr.signal_score, 0) / forensics.length;
            // Decay stability explicitly by recorded behavioral anomalies
            drift_stability = Math.max(100 - (avgDrift * 100), 0);
        }

        // 3. Risk Exposure: Measured via Simulation failures explicitly
        const { data: simulations, error: simErr } = await supabase
            .from('simulation_runs')
            .select('risk_score, blocked')
            .eq('org_id', org_id)
            .order('run_timestamp', { ascending: false })
            .limit(50);

        if (!simErr && simulations && simulations.length > 0) {
            const failedSims = simulations.filter(s => !s.blocked).length;
            const avgRisk = simulations.reduce((acc, curr) => acc + curr.risk_score, 0) / simulations.length;
            // Decay risk exposure scaling explicitly by non-intercepted breach arrays
            risk_exposure = Math.max(100 - (avgRisk * 50) - (failedSims * 2), 0);
        }

        // 4. Incident Frequency: Derived from Active Turn Violations or Guardrail triggers
        const { count: triggers } = await supabase
            .from('ledger_events') // Mock bridging to explicit incidents assuming ledger maps them
            .select('*', { count: 'exact', head: true })
            .eq('org_id', org_id)
            .eq('event_type', 'guardrail_intercept');

        if (triggers !== null) {
            // Drop explicitly for repeated structural violations per bounds
            incident_frequency = Math.max(100 - (triggers * 5), 0);
        }

        // --- COMPUTE WEIGHTED MATURITY SCORE ---
        // Coverage 30%, Stability 25%, Risk Exposure 25%, Incident Frequency 20%
        const maturity_score = Math.round(
            (policy_coverage * 0.30) + 
            (drift_stability * 0.25) + 
            (risk_exposure * 0.25) + 
            (incident_frequency * 0.20)
        );

        const result: MaturityIndexResult = {
            org_id,
            maturity_score,
            metrics: {
                policy_coverage: Math.round(policy_coverage),
                drift_stability: Math.round(drift_stability),
                risk_exposure: Math.round(risk_exposure),
                incident_frequency: Math.round(incident_frequency),
            }
        };

        // Persist evaluated calculation
        await supabase.from('governance_maturity_scores').insert({
            org_id,
            maturity_score: result.maturity_score,
            policy_coverage: result.metrics.policy_coverage,
            drift_stability: result.metrics.drift_stability,
            risk_exposure: result.metrics.risk_exposure
        });

        return result;
    }
}
