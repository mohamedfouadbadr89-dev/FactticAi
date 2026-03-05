import { PredictiveDriftEngine } from './lib/intelligence/predictiveDriftEngine.ts';
import { supabaseServer } from './lib/supabaseServer.ts';

async function verifyPredictiveDrift() {
  console.log('--- VERIFYING PREDICTIVE DRIFT ENGINE ---');

  const testOrgId = '00000000-0000-0000-0000-000000000001'; // Use a standard test org
  const testModel = 'gpt-4o';

  // 1. Check for sufficient historical data
  const { data: metrics } = await supabaseServer
    .from('model_drift_metrics')
    .select('*')
    .eq('org_id', testOrgId)
    .eq('model_name', testModel)
    .limit(2);

  if (!metrics || metrics.length < 2) {
    console.warn('Insufficient historical data in model_drift_metrics. Adding temporary mock data for verification...');
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);

    await supabaseServer.from('model_drift_metrics').insert([
      { org_id: testOrgId, model_name: testModel, drift_score: 0.3, created_at: twoHoursAgo.toISOString() },
      { org_id: testOrgId, model_name: testModel, drift_score: 0.45, created_at: oneHourAgo.toISOString() }
    ]);
  }

  // 2. Run Engine
  console.log('Calculating predictive risk...');
  const signal = await PredictiveDriftEngine.computePredictiveDriftRisk(testOrgId, testModel);

  if (signal) {
    console.log('✅ PREDICTIVE SIGNAL GENERATED:');
    console.table(signal);

    // Verify escalation logic
    // (0.45 - 0.3) / 1 hour = 0.15 momentum
    // (0.8 - 0.45) / 0.15 = 2.33 hours -> should be critical
    if (signal.escalation === 'critical' && signal.predicted_threshold_hours <= 3) {
      console.log('✅ Forecasting logic confirmed: Correctly identified critical escalation trajectory.');
    } else {
      console.warn('⚠️ Escalation logic discrepancy. Check momentum calculations.');
    }
  } else {
    console.error('❌ Failed to generate predictive signal.');
  }

  // 3. Verify event persistence
  const { data: events } = await supabaseServer
    .from('predictive_drift_events')
    .select('*')
    .eq('model_name', testModel)
    .order('created_at', { ascending: false })
    .limit(1);

  if (events && events.length > 0) {
    console.log('✅ Event persistence confirmed in predictive_drift_events table.');
  } else {
    console.error('❌ Event was not persisted correctly.');
  }
}

verifyPredictiveDrift().catch(console.error);
