import { EncryptionVault } from './lib/security/encryptionVault.ts';
import { redactPII } from './lib/redactor.ts';
import { GovernanceLedger } from './lib/security/governanceLedger.ts';

async function verifyEncryption() {
  console.log('--- VERIFYING BYOK ENCRYPTION INFRASTRUCTURE ---');

  const testOrgId = '00000000-0000-0000-0000-000000000001';

  // 1. Verify Basic Encryption / Decryption
  console.log('Testing Vault Encrypt/Decrypt...');
  const secret = "Facttic_Confidential_Data_2026";
  const cipher = await EncryptionVault.encryptField(secret, testOrgId);
  const plain = await EncryptionVault.decryptField(cipher, testOrgId);

  if (plain === secret) {
    console.log('✅ Vault Parity: Success');
  } else {
    console.error('❌ Vault Parity: Failed');
  }

  // 2. Verify PII Redactor Integration
  console.log('Testing PII Encryption Integration...');
  const logMessage = "User contact email: developer@facttic.ai";
  const processed = await redactPII(logMessage, testOrgId);
  
  if (processed.includes('EMAIL_ENCRYPTED')) {
    console.log('✅ PII Redactor Integration: Success (Segment Encrypted)');
  } else {
    console.warn('⚠️ PII Redactor Integration: Potential failure or pattern mismatch.');
  }

  // 3. Verify Ledger Integration
  console.log('Testing Ledger Payload Encryption...');
  const ledgerEvent = {
    org_id: testOrgId,
    event_type: 'policy_violation' as any,
    event_payload: {
      user_id: 'user_123',
      violation_details: 'Suspected PII leak',
      secret_context: 'Top Secret Payload',
      __sensitive: ['secret_context']
    }
  };

  const entry = await GovernanceLedger.recordEvent(ledgerEvent);
  
  if (entry && entry.event_payload.secret_context !== 'Top Secret Payload') {
    console.log('✅ Ledger Encryption: Success (Field Encrypted in Block)');
  } else {
    console.error('❌ Ledger Encryption: Failed (Field remained raw)');
  }

  // 4. Verify Rotation
  console.log('Testing Key Rotation...');
  const oldKey = await EncryptionVault.rotateKey(testOrgId);
  const newKey = await EncryptionVault.rotateKey(testOrgId); // Rotate again

  if (oldKey !== newKey) {
    console.log('✅ Key Rotation: Success (Reference sequence advanced)');
  } else {
    console.error('❌ Key Rotation: Failed');
  }
}

verifyEncryption().catch(console.error);
