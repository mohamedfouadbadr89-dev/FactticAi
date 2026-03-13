import { EvidenceLedger } from './lib/evidence/evidenceLedger';

const event = {
  session_id: 'e4250284-8178-433b-8ea9-6fa6ebf1cf8c',
  org_id: '864c43c5-0484-4955-a353-f0435582a4af',
  event_type: 'governance_decision',
  prompt: 'Test prompt',
  model: 'default',
  decision: 'PROCEED',
  risk_score: 10,
  violations: [],
  guardrail_signals: {},
  latency: 15
};

async function testRPC() {
  console.log("Testing EvidenceLedger.write()...");
  try {
    const res = await EvidenceLedger.write(event);
    console.log("SUCCESS:", res);
  } catch (err) {
    console.error("ERROR from RPC:", err);
  }
}

testRPC();
