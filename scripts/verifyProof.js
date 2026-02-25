import crypto from 'node:crypto';

/**
 * External Proof Verifier (v4.9)
 * 
 * Usage: node verifyProof.js <snapshot_json>
 */
async function verifyGovernanceProof(snapshotJson) {
  try {
    const snapshot = JSON.parse(snapshotJson);
    const { signature, publicKey, ...data } = snapshot;
    const dataToVerify = JSON.stringify(data);

    console.log('--- STARTING GOVERNANCE VERIFICATION ---');
    console.log(`Version: ${data.version}`);
    console.log(`Region:  ${data.regionId}`);
    console.log(`Commit:  ${data.commitHash}`);
    console.log(`Health:  ${data.healthScore}%`);

    // 1. Clock Drift Check (≤ 5s)
    const now = new Date();
    const payloadTime = new Date(data.timestamp);
    const drift = Math.abs(now.getTime() - payloadTime.getTime()) / 1000;
    
    if (drift > 5) {
      console.error(`❌ VERIFICATION_FAILED: Clock drift too high (${drift.toFixed(2)}s)`);
      return false;
    }
    console.log('✅ Clock drift within certified window (≤ 5s)');

    // 2. Cryptographic ed25519 Validation
    const isValid = crypto.verify(
      null,
      Buffer.from(dataToVerify),
      publicKey,
      Buffer.from(signature, 'hex')
    );

    if (isValid) {
      console.log('✅ ed25519 cryptographic signature VALID');
      console.log('--- VERIFICATION SUCCESSFUL ---');
      return true;
    } else {
      console.error('❌ VERIFICATION_FAILED: Cryptographic signature mismatch');
      return false;
    }
  } catch (err) {
    console.error('❌ VERIFICATION_ERROR:', err.message);
    return false;
  }
}

// Simulation logic for Phase 4.9
const exampleSnapshot = process.argv[2];
if (exampleSnapshot) {
  verifyGovernanceProof(exampleSnapshot);
} else {
  console.log('Please provide a snapshot JSON string as the first argument.');
}
