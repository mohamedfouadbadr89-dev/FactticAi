import { supabaseServer } from '../supabaseServer';
import { logger } from '../logger';

export interface RetentionResult {
  table: string;
  deletedCount: number;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}

/**
 * Data Retention Engine
 * 
 * CORE PRINCIPLE: Automatically enforce data expiration policies to minimize liability.
 */
export class DataRetentionEngine {
  private static SCAN_TABLES = [
    { name: 'conversation_timeline', timeColumn: 'timestamp' },
    { name: 'incident_responses', timeColumn: 'created_at' },
    { name: 'model_behavior', timeColumn: 'timestamp' }
  ];

  /**
   * Scans all configured tables for expired data based on active policies.
   */
  static async scanAndClean(orgId?: string): Promise<RetentionResult[]> {
    logger.info('DATA_RETENTION_SCAN_STARTED', { orgId: orgId || 'GLOBAL' });
    
    const results: RetentionResult[] = [];

    try {
      // 1. Fetch active policies
      let query = supabaseServer
        .from('data_retention_policies')
        .select('org_id, table_name, retention_days');
      
      if (orgId) {
        query = query.eq('org_id', orgId);
      }

      const { data: policies, error: policyError } = await query;

      if (policyError) {
        logger.error('RETENTION_POLICY_FETCH_FAILED', { error: policyError.message });
        throw policyError;
      }

      if (!policies || policies.length === 0) {
        logger.info('RETENTION_NO_POLICIES_FOUND');
        return [];
      }

      // 2. Process each policy
      for (const policy of policies) {
        const tableConfig = this.SCAN_TABLES.find(t => t.name === policy.table_name);
        if (!tableConfig) continue;

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - policy.retention_days);
        const isoDate = expirationDate.toISOString();

        const { count, error: deleteError } = await supabaseServer
          .from(policy.table_name)
          .delete()
          .eq('org_id', policy.org_id)
          .lt(tableConfig.timeColumn, isoDate);

        if (deleteError) {
          logger.error('RETENTION_CLEANUP_FAILED', { 
            table: policy.table_name, 
            orgId: policy.org_id, 
            error: deleteError.message 
          });
          results.push({
            table: policy.table_name,
            deletedCount: 0,
            status: 'FAILED',
            error: deleteError.message
          });
        } else {
          logger.info('RETENTION_CLEANUP_SUCCESS', { 
            table: policy.table_name, 
            orgId: policy.org_id, 
            deletedCount: count || 0 
          });
          results.push({
            table: policy.table_name,
            deletedCount: count || 0,
            status: 'SUCCESS'
          });
        }
      }

      return results;

    } catch (err: any) {
      logger.error('DATA_RETENTION_ENGINE_CRITICAL', { error: err.message });
      return results;
    }
  }

  /**
   * Helper to set a default policy for a new organization.
   */
  static async setPolicy(orgId: string, tableName: string, days: number): Promise<boolean> {
    const { error } = await supabaseServer
      .from('data_retention_policies')
      .upsert({
        org_id: orgId,
        table_name: tableName,
        retention_days: days
      }, { onConflict: 'org_id,table_name' });

    if (error) {
      logger.error('RETENTION_POLICY_UPSERT_FAILED', { orgId, tableName, error: error.message });
      return false;
    }

    return true;
  }
}
