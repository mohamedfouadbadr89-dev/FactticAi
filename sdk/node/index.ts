import https from 'https';

export interface FactticConfig {
    apiKey: string;
    endpoint?: string;
}

export interface TrackPayload {
    prompt: string;
    response: string;
    model: string;
    user_id: string;
}

export interface RiskFeedback {
    risk_score: number;
    policy_flags: string[];
    drift_indicators: string[];
    session_id?: string;
}

export class FactticSDK {
    private apiKey: string;
    private endpoint: string;

    constructor(config: FactticConfig) {
        if (!config.apiKey) throw new Error("Facttic SDK requires an apiKey");
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || "https://api.facttic.ai/api/v1/governance/evaluate";
    }

    /**
     * Submit prompts and responses dynamically to the Facttic Governance API.
     * This orchestrates backend session creation and returns an active threat profile risk score.
     */
    async track(payload: TrackPayload): Promise<RiskFeedback> {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(payload);
            const url = new URL(this.endpoint);

            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data),
                    'Authorization': `Bearer ${this.apiKey}`
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(body) as RiskFeedback);
                    } else {
                        reject(new Error(`Facttic API Error: ${res.statusCode} - ${body}`));
                    }
                });
            });

            req.on('error', e => reject(e));
            req.write(data);
            req.end();
        });
    }
}
