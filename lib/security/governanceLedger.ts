import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';
import crypto from 'crypto';

export interface LedgerEvent {
  org_id: string;
  event_type: 'evaluation_created' | 'drift_detected' | 'policy_violation' | 'governance_escalation';
  event_payload: any;
}

export interface LedgerEntry extends LedgerEvent {
  id: string;
  previous_hash: string;
  current_hash: string;
  signature: string;
  created_at: string;
}

export class GovernanceLedger {
  // Utilizing a fallback system secret for HMAC bindings if BYOK keys fail derivation in early staging
  private static getTenantSecret(): string {
    const secret = process.env.FACTTIC_TELEMETRY_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL_SECURITY_FAILURE: FACTTIC_TELEMETRY_SECRET missing in production');
    }
    return secret || 'development_governance_fallback';
  }

  /**
   * Cryptographically constructs & inserts a secure ledger block sequentially. 
   * Formats: current_hash = SHA256(previous_hash + payload + timestamp)
   */
  static async recordEvent(event: LedgerEvent): Promise<LedgerEntry | null> {
    try {
      // 1. Resolve Sequential Link (Get previous hash)
      const { data: lastBlock } = await supabaseServer
        .from('facttic_governance_events')
        .select('event_hash')
        .eq('org_id', event.org_id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
        
      const previousHash = lastBlock?.event_hash || 'GENESIS_BLOCK_0000000000000000000000000000000';
      const timestamp = new Date().toISOString();
      
      // 2. Resolve Payload normalizations
      const payloadString = JSON.stringify(event.event_payload);

      // 3. Compute Structural Integrity Hash (SHA-256)
      // Check for sensitive fields that require encryption
      let finalPayload = event.event_payload;
      if (event.event_payload?.__sensitive) {
        const { EncryptionVault } = await import('./encryptionVault');
        finalPayload = { ...event.event_payload };
        for (const field of event.event_payload.__sensitive) {
           if (finalPayload[field]) {
             finalPayload[field] = await EncryptionVault.encryptField(finalPayload[field], event.org_id);
           }
        }
        delete finalPayload.__sensitive;
      }

      const finalPayloadString = JSON.stringify(finalPayload);
      const hashInput = `${previousHash}:${finalPayloadString}:${timestamp}`;
      const currentHash = crypto.createHash('sha256').update(hashInput).digest('hex');

      // 4. Generate Authenticity Signature (HMAC)
      const secret = this.getTenantSecret();
      const signature = crypto.createHmac('sha256', secret).update(currentHash).digest('base64');

      // 5. Append Block securely utilizing Service-Role bound constraints
      const newBlock = {
        org_id: event.org_id,
        event_type: event.event_type,
        event_payload: finalPayload,
        previous_hash: previousHash,
        current_hash: currentHash,
        signature: signature,
        created_at: timestamp
      };

      const { data: inserted, error } = await supabaseServer
        .from('governance_event_ledger')
        .insert(newBlock)
        .select('*')
        .single();

      if (error) throw error;
      
      logger.info('LEDGER_BLOCK_APPENDED', { orgId: event.org_id, hash: currentHash.substring(0,8) });
      return inserted;

    } catch (e: any) {
      logger.error('LEDGER_APPEND_FAILURE', { error: e.message });
      return null;
    }
  }

  /**
   * Reconstructs the entire chain confirming mathematical integrity sequence bounds
   */
  static async verifyIntegrity(orgId: string): Promise<{ isValid: boolean, totalBlocks: number, failurePoint?: string }> {
    const { data: blocks, error } = await supabaseServer
      .from('facttic_governance_events')
      .select('id, previous_hash, current_hash:event_hash, signature, event_payload:guardrail_signals, created_at:timestamp, org_id, event_type')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: true });

    if (error) {
      logger.error('LEDGER_FETCH_ERROR', { error: error.message });
      throw new Error(`Failed to fetch ledger for integrity verification.`);
    }

    if (!blocks || blocks.length === 0) return { isValid: true, totalBlocks: 0 };

    let expectedPrevious = 'GENESIS_BLOCK_0000000000000000000000000000000';
    const secret = this.getTenantSecret();

    for (const block of blocks) {
      // 1. Verify sequence linkage
      if (block.previous_hash !== expectedPrevious) {
        return { isValid: false, totalBlocks: blocks.length, failurePoint: `Broken chain link at block: ${block.id}` };
      }

      // 2. Verify computational hash
      const payloadString = typeof block.event_payload === 'string' ? block.event_payload : JSON.stringify(block.event_payload);
      const hashInput = `${block.previous_hash}:${payloadString}:${block.created_at}`;
      const recomputedHash = crypto.createHash('sha256').update(hashInput).digest('hex');

      if (recomputedHash !== block.current_hash) {
         return { isValid: false, totalBlocks: blocks.length, failurePoint: `Tampered payload/hash at block: ${block.id}` };
      }

      // 3. Verify Authenticity HMAC
      const expectedSignature = crypto.createHmac('sha256', secret).update(block.current_hash).digest('base64');
      if (expectedSignature !== block.signature) {
         return { isValid: false, totalBlocks: blocks.length, failurePoint: `Forged signature at block: ${block.id}` };
      }

      expectedPrevious = block.current_hash;
    }

    return { isValid: true, totalBlocks: blocks.length };
  }

  static async rebuildChain(orgId: string): Promise<LedgerEntry[]> {
     const { data: blocks } = await supabaseServer
      .from('facttic_governance_events')
      .select('id, previous_hash, current_hash:event_hash, signature, event_payload:guardrail_signals, created_at:timestamp, org_id, event_type')
      .eq('org_id', orgId)
      .order('timestamp', { ascending: true });

    return blocks || [];
  }
}
