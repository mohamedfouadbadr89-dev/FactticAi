import { supabaseServer } from './supabaseServer';

/**
 * Universal Database Wrapper (Facttic Forensic Layer)
 * 
 * Provides a standard interface for critical audit persistence.
 */
export const db = {
  /**
   * Forensic Insert Operation
   * Enforces structured persistence for governance telemetry.
   */
  async insert(table: string, data: any) {
    const { data: record, error } = await supabaseServer
      .from(table)
      .insert(data)
      .select('id')
      .single();

    if (error) {
      throw new Error(`DATABASE_INSERT_FAILURE: ${error.message}`);
    }

    return record;
  }
};
