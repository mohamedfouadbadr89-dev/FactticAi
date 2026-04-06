import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/middleware/auth';
import { GovernancePipeline } from '@/lib/governancePipeline';
import crypto from 'node:crypto';

/**
 * POST /api/eval/batch
 *
 * CI/CD Regression Testing endpoint.
 * Runs a batch of test cases through the governance pipeline and returns
 * pass/fail results. Designed to be called from GitHub Actions on every PR.
 *
 * Request body:
 * {
 *   test_cases: Array<{
 *     id: string               // unique test case identifier
 *     prompt: string           // the input prompt to evaluate
 *     expected_decision: 'BLOCK' | 'ALLOW' | 'WARN'
 *     description?: string     // human-readable test name
 *   }>
 *   fail_threshold?: number    // minimum pass rate (0-100) to pass the suite. Default: 100
 * }
 *
 * Response:
 * {
 *   total: number
 *   passed: number
 *   failed: number
 *   pass_rate: number          // 0-100
 *   regression_detected: boolean
 *   suite_id: string           // UUID for this batch run
 *   results: Array<{
 *     id: string
 *     description?: string
 *     prompt: string
 *     expected: string
 *     actual: string
 *     risk_score: number
 *     passed: boolean
 *     violations: any[]
 *     latency_ms: number
 *   }>
 * }
 */
export const POST = withAuth(async (req: Request, ctx: AuthContext) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { test_cases, fail_threshold = 100 } = body;

  if (!Array.isArray(test_cases) || test_cases.length === 0) {
    return NextResponse.json(
      { error: 'test_cases must be a non-empty array' },
      { status: 400 }
    );
  }

  if (test_cases.length > 200) {
    return NextResponse.json(
      { error: 'Maximum 200 test cases per batch' },
      { status: 400 }
    );
  }

  const VALID_DECISIONS = new Set(['BLOCK', 'ALLOW', 'WARN']);
  for (const tc of test_cases) {
    if (!tc.id || typeof tc.id !== 'string') {
      return NextResponse.json({ error: `test_case missing id` }, { status: 400 });
    }
    if (!tc.prompt || typeof tc.prompt !== 'string') {
      return NextResponse.json({ error: `test_case '${tc.id}' missing prompt` }, { status: 400 });
    }
    if (!VALID_DECISIONS.has(tc.expected_decision)) {
      return NextResponse.json(
        { error: `test_case '${tc.id}' expected_decision must be BLOCK, ALLOW, or WARN` },
        { status: 400 }
      );
    }
  }

  const suiteId = crypto.randomUUID();
  const results: any[] = [];

  // Run all test cases — sequentially to avoid overwhelming the pipeline
  for (const tc of test_cases) {
    const t0 = Date.now();
    let pipelineResult: any;

    try {
      pipelineResult = await GovernancePipeline.execute({
        org_id: ctx.orgId,
        user_id: ctx.userId,
        session_id: `eval_${suiteId}`,
        prompt: tc.prompt,
      });
    } catch (err: any) {
      results.push({
        id: tc.id,
        description: tc.description ?? null,
        prompt: tc.prompt,
        expected: tc.expected_decision,
        actual: 'ERROR',
        risk_score: 0,
        passed: false,
        violations: [],
        latency_ms: Date.now() - t0,
        error: err.message,
      });
      continue;
    }

    const actualDecision: string = pipelineResult?.decision ?? 'ALLOW';
    const passed = actualDecision === tc.expected_decision;

    results.push({
      id: tc.id,
      description: tc.description ?? null,
      prompt: tc.prompt,
      expected: tc.expected_decision,
      actual: actualDecision,
      risk_score: pipelineResult?.risk_score ?? 0,
      passed,
      violations: pipelineResult?.violations ?? [],
      latency_ms: Date.now() - t0,
    });
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const passRate = Math.round((passed / results.length) * 100);
  const regressionDetected = passRate < fail_threshold;

  return NextResponse.json({
    suite_id: suiteId,
    total: results.length,
    passed,
    failed,
    pass_rate: passRate,
    regression_detected: regressionDetected,
    fail_threshold,
    results,
  });
});
