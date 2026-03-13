import { z } from 'zod';
import { randomUUID } from 'crypto';

export const ParticipantSchema = z.object({
  id: z.string(),
  role: z.string(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const VoiceConversationDataSchema = z.object({
  id: z.string().uuid().optional(),
  orgId: z.string({
    message: "orgId is strictly required for data isolation.",
  }).min(1, "orgId cannot be empty"),
  clientId: z.string().optional(),
  provider: z.string(),
  externalId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  duration: z.number().optional(),
  participants: z.array(ParticipantSchema).default([]),
  transcript: z.string().optional(),
  audio: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
});

export type VoiceConversationInput = z.input<typeof VoiceConversationDataSchema>;

/**
 * VoiceConversation
 * 
 * Represents the standardized voice conversation data within the Facttic system.
 */
export class VoiceConversation {
  public id: string;
  public orgId: string;
  public clientId?: string | undefined;
  public provider: string;
  public externalId: string;
  public startTime: Date;
  public endTime?: Date | undefined;
  public duration?: number | undefined;
  public participants: Participant[];
  public transcript?: string | undefined;
  public audio?: string | undefined;
  public metadata: Record<string, any>;

  /**
   * Instantiates a new VoiceConversation model.
   * Performs strict structure parsing and enforces presence of isolated `orgId`.
   * 
   * @param data Raw input mapping to the conversation
   */
  constructor(data: VoiceConversationInput) {
    const validated = VoiceConversationDataSchema.parse(data);

    this.id = validated.id || randomUUID();
    this.orgId = validated.orgId;
    this.clientId = validated.clientId;
    this.provider = validated.provider;
    this.externalId = validated.externalId;
    this.startTime = validated.startTime;
    this.endTime = validated.endTime;
    this.duration = validated.duration;
    this.participants = validated.participants;
    this.transcript = validated.transcript;
    this.audio = validated.audio;
    this.metadata = validated.metadata;
  }
}
