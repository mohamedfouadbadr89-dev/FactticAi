import { CONTROL_REGISTRY } from './controlRegistry';
import { TRACEABILITY_MAP } from './traceabilityMap';
import { logger } from '@/lib/logger';

/**
 * Institutional RFP Response Engine (v5.4)
 * 
 * CORE PRINCIPLE: Automated Truth.
 * Maps standard security questions to verifiable controls and evidence.
 */
export class RFPResponseEngine {
  private static readonly QUESTION_BANK = [
    { 
      pattern: /access control|least privilege|RBAC/i, 
      controlId: 'AC-01',
      standardAnswer: 'Facttic enforces deterministic Role-Based Access Control (RBAC) at the middleware level.'
    },
    { 
      pattern: /disaster recovery|failover|backup/i, 
      controlId: 'DR-01',
      standardAnswer: 'Facttic implements sovereign failover with automated cross-region replication.'
    },
    { 
      pattern: /code review|SDLC|security training/i, 
      controlId: 'CM-01',
      standardAnswer: 'Facttic enforces mandatory cryptographic sign-off and peer review for all production code.'
    },
    {
      pattern: /incident response|alerting|monitoring/i,
      controlId: 'IR-01',
      standardAnswer: 'Facttic operates a 24/7 automated incident detection system with region-sovereign alerting.'
    }
  ];

  /**
   * Automates response to a security question.
   */
  static answerQuestion(question: string) {
    const matched = this.QUESTION_BANK.find(q => q.pattern.test(question));
    
    if (!matched) {
      return {
        answered: false,
        response: 'Facttic maintains comprehensive security controls. Please contact our CISO for a deep dive on this specific domain.'
      };
    }

    const traceability = TRACEABILITY_MAP.find(t => t.controlId === matched.controlId);
    const control = CONTROL_REGISTRY.find(c => c.id === matched.controlId);

    logger.info('RFP_ENGINE: Question answered', { controlId: matched.controlId });

    return {
      answered: true,
      controlId: matched.controlId,
      controlTitle: control?.title,
      response: matched.standardAnswer,
      evidenceReference: traceability?.logidentifier || 'CONTINUOUS_VERIFICATION'
    };
  }
}
