import { redactPII } from '../redactor'
import { PolicyEngine, PolicyEvaluationSignal } from '../governance/policyEngine'
import { DataProtection } from '../security/dataProtection'
import { supabaseServer } from '../supabaseServer'
import { logger } from '../logger'

export interface InterceptionResult {
  action: 'proceed' | 'blocked' | 'sanitized'
  content?: any
  reason?: string
}

export class AiInterceptorKernel {

  static async interceptPrompt(orgId: string, prompt: string): Promise<InterceptionResult> {

    try {

      const sanitized = DataProtection.maskPII(prompt)

      const policies = await PolicyEngine.loadOrganizationPolicies(orgId)

      const signals: PolicyEvaluationSignal[] = [
        { rule_type: 'pii_exposure', score: sanitized !== prompt ? 100 : 0 }
      ]

      const evaluation = PolicyEngine.evaluateSignals(policies, signals)

      if (evaluation.highest_action === 'block') {

        await this.emitEvent(orgId,'prompt_blocked')

        return {
          action: 'blocked',
          reason: 'policy_violation'
        }
      }

      return {
        action: sanitized !== prompt ? 'sanitized' : 'proceed',
        content: sanitized
      }

    } catch (e:any) {

      logger.error('PROMPT_KERNEL_FAILURE', {error:e.message})

      return {
        action:'proceed',
        content:prompt
      }
    }
  }

  static async interceptResponse(orgId:string,response:string):Promise<InterceptionResult>{

    try{

      const sanitized = DataProtection.maskPII(response)

      return{
        action:sanitized!==response?'sanitized':'proceed',
        content:sanitized
      }

    }catch{

      return{
        action:'proceed',
        content:response
      }
    }
  }

  static async interceptAction(orgId:string,action:any):Promise<InterceptionResult>{

    const actionStr = typeof action==='string'?action:JSON.stringify(action)

    if(
      actionStr.includes('delete_database') ||
      actionStr.includes('exfiltrate_keys')
    ){

      await this.emitEvent(orgId,'agent_action_blocked')

      return{
        action:'blocked',
        reason:'restricted_agent_operation'
      }
    }

    return{action:'proceed'}
  }

  private static async emitEvent(orgId:string,eventType:string){

    try{

      await supabaseServer
        .from('governance_event_ledger')
        .insert({
          org_id:orgId,
          event_type:eventType,
          event_payload:{source:'interceptor_kernel'},
          previous_hash:'placeholder',
          current_hash:`h_${Date.now()}`,
          signature:'kernel'
        })

      logger.info('INTERCEPTION_EVENT',{orgId,eventType})

    }catch(e:any){

      logger.error('KERNEL_EVENT_FAILURE',{error:e.message})
    }
  }
}