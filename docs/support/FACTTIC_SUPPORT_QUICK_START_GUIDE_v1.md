# Facttic Quick Start Guide: Webhook Integration

## Step 1: Secure an Organization API Key
Navigate to `Dashboard > Integrations > API Tokens`. Generate a fresh Token.

## Step 2: Establish Your Cryptographic Key (BYOK)
We cannot decrypt your conversations without your explicit consent. Generate a standard `AES-256` key and pass it within your HTTP requests via `x-byok-key`.

## Step 3: Configure Your Voice Provider
Facttic maps natively to Twilio, Retell, Vapi, and ElevenLabs. 

**Vapi Example Implementation (Node.js)**
```javascript
const response = await fetch('https://api.facttic.com/api/webhooks/voice', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${YOUR_FACTTIC_API_KEY}`,
    'x-org-id': 'org_12345678',
    'x-byok-key': 'encoded-aes-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(vapiWebhookEvent)
});
```

## Step 4: Access Governance Telemetry
Within 5 seconds of the webhook `200 OK` return, the Facttic Executive dashboard will populate with extracted PII boundaries, Legal Risk analysis, and deterministically generated severity scorings!
