import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

export function encryptData(plaintext: string, base64Key: string): string {
  if (!base64Key) {
    throw new Error('Customer BYOK key is required for encryption.');
  }

  const keyBuffer = Buffer.from(base64Key, 'base64');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Invalid BYOK key length. Expected ${KEY_LENGTH} bytes, got ${keyBuffer.length}`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

export function decryptData(cipherPayload: string, base64Key: string): string {
  if (!cipherPayload || !base64Key) {
    throw new Error('Both cipherPayload and customer BYOK key are required for decryption.');
  }

  const keyBuffer = Buffer.from(base64Key, 'base64');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Invalid BYOK key length. Expected ${KEY_LENGTH} bytes, got ${keyBuffer.length}`);
  }

  const parts = cipherPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid cipher payload format structure.');
  }

  const [ivStr, authTagStr, encryptedStr] = parts;
  
  const iv = Buffer.from(ivStr, 'base64');
  const authTag = Buffer.from(authTagStr, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedStr, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

const mockByokKey = 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=';

const helperPayloadStr = JSON.stringify({
   transcript: 'Decrypted Transcript Result',
   audio: 'https://test/audio',
   participants: [],
   metadata: { testMeta: true }
});

try {
  console.log('--- ENCRYPTING ---');
  const cipher = encryptData(helperPayloadStr, mockByokKey);
  console.log('CIPHER:', cipher);
  console.log('--- DECRYPTING ---');
  const plain = decryptData(cipher, mockByokKey);
  console.log('PLAIN:', plain);
  const parsed = JSON.parse(plain);
  console.log('PARSED:', parsed);
} catch (e) {
  console.error('ERROR:', e);
}
