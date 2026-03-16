export const IncidentCreator = {
    evaluateIncident(riskScore: number, driftResult: any) {
        // Pure function, decide if incident should be created
        if (riskScore >= 90 || driftResult.drift_detected) {
            return {
                create_incident: true,
                incident_type: 'critical_violation',
                severity: riskScore >= 90 ? 'critical' : 'high',
                action_taken: 'block_agent'
            };
        } else if (riskScore > 50) {
            return {
                create_incident: true,
                incident_type: 'policy_warning',
                severity: 'medium',
                action_taken: 'alert_security_team'
            };
        }
        return { create_incident: false };
    }
};
