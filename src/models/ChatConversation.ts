import { z } from 'zod';

export const ChatParticipantSchema = z.object({
  id: z.string(),
  role: z.string(),
  name: z.string().optional(),
});

export const ChatConversationDataSchema = z.object({
  id: z.string().uuid().optional(),
  orgId: z.string().uuid(),
  provider: z.string(),
  externalId: z.string(),
  startTime: z.instanceof(Date),
  endTime: z.instanceof(Date).optional(),
  transcript: z.string().optional(),
  participants: z.array(ChatParticipantSchema).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  encryptedData: z.string().optional(),
});

export type ChatConversationInput = z.infer<typeof ChatConversationDataSchema>;

/**
 * Normalizes Chat Data (from OpenAI, Anthropic, etc) securely before persisting it.
 * This object can hold raw transcript data, which should be passed to encryption layers 
 * prior to hitting the database.
 */
export class ChatConversation {
  id: string;
  orgId: string;
  provider: string;
  externalId: string;
  startTime: Date;
  endTime?: Date | undefined;
  transcript?: string | undefined;
  participants?: Array<{ id: string; role: string; name?: string | undefined }> | undefined;
  metadata?: Record<string, any> | undefined;
  encryptedData?: string | undefined;

  constructor(data: ChatConversationInput) {
    const validated = ChatConversationDataSchema.parse(data);

    this.id = validated.id || crypto.randomUUID();
    this.orgId = validated.orgId;
    this.provider = validated.provider;
    this.externalId = validated.externalId;
    this.startTime = validated.startTime;
    this.endTime = validated.endTime;
    this.transcript = validated.transcript;
    this.participants = validated.participants;
    this.metadata = validated.metadata;
    this.encryptedData = validated.encryptedData;
  }
}
