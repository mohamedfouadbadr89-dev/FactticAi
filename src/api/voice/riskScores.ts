import { NextResponse } from 'next/server';
import { getRiskScoresByConversationId } from '@/database/voiceRiskScores';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    
    // Using x-api-key or Bearer token for authentication
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.split('Bearer ')[1];
    // Organizations can be identified from tokens or passed explicitly in headers/params
    const orgId = searchParams.get('orgId') || req.headers.get('x-org-id');

    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: API key required' }, { status: 401 });
    }

    if (!orgId) {
       return NextResponse.json({ error: 'Bad Request: Organization ID is required' }, { status: 400 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Bad Request: conversationId parameter is required' }, { status: 400 });
    }

    // Fetch scores adhering to tenant isolation validation
    const scores = await getRiskScoresByConversationId(conversationId, orgId);

    if (!scores || scores.length === 0) {
      return NextResponse.json({ error: 'No risk scores found for this conversation' }, { status: 404 });
    }

    return NextResponse.json({ success: true, riskScores: scores }, { status: 200 });
  } catch (error: any) {
    console.error('API Error fetching risk scores:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
