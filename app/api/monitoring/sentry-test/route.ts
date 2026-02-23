import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simulate Sentry exception capture
    throw new Error('Sentry Test Error: Validating Next.js SDK Error Boundary');
  } catch (error) {
    // In a real Sentry setup, this is where Sentry.captureException(error) runs automatically.
    console.error('[Sentry Event Captured]', error);
    return NextResponse.json(
      { error: 'Simulated Sentry Error Captured successfully' },
      { status: 500 }
    );
  }
}
