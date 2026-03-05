import { NextRequest, NextResponse } from 'next/server';
import { EncryptionVault } from '@/lib/security/encryptionVault';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await req.json();

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    const newKeyRef = await EncryptionVault.rotateKey(orgId);

    return NextResponse.json({ 
      success: true, 
      message: 'Key rotated successfully',
      key_reference: newKeyRef.substring(0, 8) + '...'
    });
  } catch (err: any) {
    logger.error('API_KEY_ROTATE_FAILURE', { error: err.message });
    return NextResponse.json({ error: 'Failed to rotate key' }, { status: 500 });
  }
}
