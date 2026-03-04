import { VoiceConversation } from '../models/VoiceConversation';
import { normalizeConversationData } from './conversationUtils';

describe('Voice Conversation Utilities', () => {
  describe('normalizeConversationData', () => {
    const orgId = 'test-org-123';

    it('should throw an error if the payload is completely undefined or invalid', () => {
      expect(() => normalizeConversationData(undefined, orgId)).toThrow('Invalid payload: expected an object');
      expect(() => normalizeConversationData(null, orgId)).toThrow('Invalid payload: expected an object');
      expect(() => normalizeConversationData('string-payload', orgId)).toThrow('Invalid payload: expected an object');
    });

    it('should extract correct attributes from a Retell structured event payload', () => {
      const payload = {
        event: 'call_ended',
        call: {
          call_id: 'retell-1234',
          start_timestamp: 1710000000000,
          end_timestamp: 1710000100000,
          transcript: 'Hello retell test',
          recording_url: 'https://retell-test.com/audio.wav'
        }
      };

      const result = normalizeConversationData(payload, orgId);
      
      expect(result).toBeInstanceOf(VoiceConversation);
      expect(result.provider).toBe('retell');
      expect(result.externalId).toBe('retell-1234');
      expect(result.transcript).toBe('Hello retell test');
      expect(result.audio).toBe('https://retell-test.com/audio.wav');
      expect(result.startTime.getTime()).toBe(1710000000000);
      expect(result.endTime?.getTime()).toBe(1710000100000);
    });

    it('should assign a current Date if start_timestamp is missing in Retell', () => {
      const payload = {
        event: 'call_ended',
        call: {
          call_id: 'retell-missing-date',
        }
      };

      const result = normalizeConversationData(payload, orgId);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeUndefined();
    });

    it('should extract correct attributes from a Vapi structured message payload', () => {
      const payload = {
        message: {
          call: {
            id: 'vapi-5678',
            startedAt: '2026-03-04T00:00:00.000Z',
            endedAt: '2026-03-04T00:05:00.000Z',
          },
          transcript: 'Hello vapi test',
          recordingUrl: 'https://vapi-test.com/audio.wav'
        }
      };

      const result = normalizeConversationData(payload, orgId);

      expect(result).toBeInstanceOf(VoiceConversation);
      expect(result.provider).toBe('vapi');
      expect(result.externalId).toBe('vapi-5678');
      expect(result.transcript).toBe('Hello vapi test');
      expect(result.audio).toBe('https://vapi-test.com/audio.wav');
      expect(result.startTime.getTime()).toBe(new Date('2026-03-04T00:00:00.000Z').getTime());
      expect(result.endTime?.getTime()).toBe(new Date('2026-03-04T00:05:00.000Z').getTime());
    });

    it('should fallback to inner call properties natively inside Vapi payload mappings', () => {
      const payload = {
        message: {
          call: {
            id: 'vapi-fallback-test',
            transcript: 'Inner transcript',
            recordingUrl: 'https://vapi-inner.com/test.wav'
          },
        }
      };

      const result = normalizeConversationData(payload, orgId);
      expect(result.transcript).toBe('Inner transcript');
      expect(result.audio).toBe('https://vapi-inner.com/test.wav');
    });

    it('should properly capture ElevenLabs dynamic payload structures', () => {
      const payload = {
        agent_id: 'agent_xy123',
        call_id: 'eleven_9876',
        transcript: 'Hello 11',
        recording_url: 'https://11labs.test/out.wav'
      };

      const result = normalizeConversationData(payload, orgId);
      expect(result.provider).toBe('elevenlabs');
      expect(result.externalId).toBe('eleven_9876');
      expect(result.transcript).toBe('Hello 11');
      expect(result.audio).toBe('https://11labs.test/out.wav');
    });

    it('should process Pipecat structured session closures securely', () => {
      const payload = {
        bot_id: 'bot_pipe_99',
        session_id: 'sess_pipecat_001',
        timestamp: '2026-03-04T01:00:00.000Z',
      };

      const result = normalizeConversationData(payload, orgId);
      expect(result.provider).toBe('pipecat');
      expect(result.externalId).toBe('sess_pipecat_001');
      expect(result.startTime.getTime()).toBe(new Date('2026-03-04T01:00:00.000Z').getTime());
    });

    it('should normalize Twilio root-level hooks natively', () => {
      const payload = {
        CallSid: 'CA1234567890abcdef',
        start_time: '2026-03-04T02:00:00.000Z',
        RecordingUrl: 'https://api.twilio.com/recordings/RE123'
      };

      const result = normalizeConversationData(payload, orgId);
      expect(result.provider).toBe('twilio');
      expect(result.externalId).toBe('CA1234567890abcdef');
    });

    it('should fallback to unknown provider if structure is ambiguous but has id', () => {
        const payload = {
          id: 'random-unknown-id-123',
          transcript: 'Unknown structural hook'
        };
  
        const result = normalizeConversationData(payload, orgId);
        expect(result.provider).toBe('unknown');
        expect(result.externalId).toBe('random-unknown-id-123');
        expect(result.transcript).toBe('Unknown structural hook');
    });

    it('should throw an error if no valid identifier exists on the generic catch-all', () => {
        const payload = {
          unsupported_field: 'nothing'
        };
  
        expect(() => normalizeConversationData(payload, orgId)).toThrow('Unsupported payload format: missing call identifier');
    });
  });
});
