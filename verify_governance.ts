import { ReviewQueue } from './lib/governance/reviewQueue.ts';

async function verifyReviewLifecycle() {
  console.log('--- VERIFYING HUMAN REVIEW GOVERNANCE SYSTEM ---');

  const testSessionId = '00000000-0000-0000-0000-000000000001'; // Mock session
  const testAuditorId = '00000000-0000-0000-0000-000000000001'; // Mock auditor (service role or test user)

  // 1. Enqueue
  console.log('Step 1: Enqueueing high-risk session...');
  await ReviewQueue.enqueueSession(testSessionId, 88.5);

  // 2. Fetch Pending
  console.log('Step 2: Fetching pending reviews...');
  const pending = await ReviewQueue.getReviews('pending');
  const target = pending.find(r => r.session_id === testSessionId);

  if (target) {
    console.log('✅ Session enqueued successfully.');
    
    // 3. Assign
    console.log('Step 3: Assigning auditor...');
    await ReviewQueue.assignReviewer(target.id, testAuditorId);
    
    // 4. Resolve
    console.log('Step 4: Resolving review with forensic notes...');
    await ReviewQueue.resolveReview(target.id, "Forensic audit confirmed policy bypass. Mitigated.");
    
    // 5. Verify Resolved
    const resolved = await ReviewQueue.getReviews('resolved');
    const finalized = resolved.find(r => r.id === target.id);
    
    if (finalized && finalized.status === 'resolved') {
      console.log('✅ Full lifecycle verified: Enqueue -> Assign -> Resolve');
    } else {
      console.error('❌ Resolution verification failed.');
    }
  } else {
    console.error('❌ Enqueue verification failed.');
  }
}

verifyReviewLifecycle().catch(console.error);
