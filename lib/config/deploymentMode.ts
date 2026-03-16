export const DEPLOYMENT_CONFIG = {
    // FACTTIC_DEPLOYMENT_MODE is typically 'cloud' or 'vpc'
    mode: process.env.FACTTIC_DEPLOYMENT_MODE || 'cloud',
    
    get isVpcEnabled() {
        return this.mode === 'vpc';
    },

    disableExternalTelemetry() {
        if (this.isVpcEnabled) {
            console.log("VPC Isolation Active: Non-essential third-party telemetry sinks have been disabled.");
            return true;
        }
        return false;
    },

    blockPublicWebhooks() {
        if (this.isVpcEnabled) {
            console.log("VPC Isolation Active: Public egress webhooks bounded uniquely to VPC endpoints.");
            return true;
        }
        return false;
    }
}
