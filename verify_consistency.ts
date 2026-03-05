import { ModelConsistencyEngine } from './lib/intelligence/modelConsistencyEngine.ts';

async function verifyModelConsistency() {
  console.log('--- VERIFYING MODEL CONSISTENCY ENGINE ---');

  const testPrompt = "Explaining quantum entanglement to a five-year-old.";
  
  // 1. Run Comparison
  console.log(`Analyzing prompt: "${testPrompt}"`);
  const result = await ModelConsistencyEngine.compareModels(testPrompt, 'gpt-4o', 'claude-3-opus');

  console.log('✅ CONSISTENCY TEST COMPLETED:');
  console.table(result);

  // 2. Verify Logic (Simulated logic checks)
  if (result.similarity_score > 0 && result.similarity_score <= 1.0) {
    console.log('✅ Semantic similarity engine confirmed: Produced valid bounded score.');
  } else {
    console.error('❌ Semantic similarity engine failed: Invalid score range.');
  }

  // 3. Test Identical Strings
  console.log('Testing identical responses (Expect ~1.0)...');
  // Manual call to internal similarity to bypass model simulation
  const score = (ModelConsistencyEngine as any).computeCosineSimilarity(
    "this is a sample test response", 
    "this is a sample test response"
  );
  console.log(`Identical Match Score: ${score}`);
  
  if (score >= 0.99) {
    console.log('✅ Cosine similarity math verified for identical inputs.');
  } else {
    console.error('❌ Cosine similarity math failure.');
  }
}

verifyModelConsistency().catch(console.error);
