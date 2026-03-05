import { normalizeResponse, generateFingerprint } from './lib/intelligence/responseFingerprint';

const testResponse1 = "Hello, world! This is a   test.";
const testResponse2 = "hello, world this is a test";

const norm1 = normalizeResponse(testResponse1);
const norm2 = normalizeResponse(testResponse2);

console.log(`Norm 1: "${norm1}"`);
console.log(`Norm 2: "${norm2}"`);

if (norm1 === norm2) {
  console.log("SUCCESS: Normalization is deterministic.");
} else {
  console.log("FAILURE: Normalization mismatch.");
}

const f1 = generateFingerprint(testResponse1, "hash1", "gpt-4", 0.7);
const f2 = generateFingerprint(testResponse2, "hash1", "gpt-4", 0.7);

console.log(`Fingerprint 1: ${f1.fingerprint}`);
console.log(`Fingerprint 2: ${f2.fingerprint}`);

if (f1.fingerprint === f2.fingerprint) {
  console.log("SUCCESS: Fingerprinting is deterministic.");
} else {
  console.log("FAILURE: Fingerprinting mismatch.");
}
