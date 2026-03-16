import { describe, it, expect } from 'vitest';
import { redactPII } from '../../lib/security/redactPII';

describe('redactPII', () => {
  it('redacts email addresses', () => {
    const input = 'Contact me at john.doe@example.com for info.';
    const output = redactPII({ message: input });
    expect(output.message).toBe('Contact me at [REDACTED_EMAIL] for info.');
  });

  it('redacts phone numbers', () => {
    const input = 'Call 1-800-555-0199 immediately.';
    const output = redactPII(input);
    expect(output).toContain('[REDACTED_PHONE]');
    expect(output).not.toContain('1-800-555-0199');
  });

  it('redacts API keys and secrets', () => {
    const input = 'Authorization: Bearer sk-live-12345AbCdEfg';
    const output = redactPII({ headers: input });
    expect(output.headers).toContain('[REDACTED_KEY]');
    expect(output.headers).not.toContain('sk-live-12345AbCdEfg');
  });

  it('redacts JWT tokens', () => {
    const input = 'Token is eyJhbGciOiJIUzI1NiIsInR5cCI.eyJzdWIi.SflKxwRJSMe';
    const output = redactPII({ token: input });
    // Assuming JWT token masking rules apply to API Key or explicit JWT token rules
    // The key here is checking no leak of the base64 token
    expect(output.token).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI.eyJzdWIi.SflKxwRJSMe');
    expect(output.token).toContain('[REDACTED_KEY]');
  });

  it('deep traverses nested properties protecting numbers/booleans', () => {
    const input = {
      nested: {
        rawInput: 'Support: jane@acme.co',
        metrics: 552
      },
      flag: true
    };
    const output = redactPII(input);
    expect((output as any).nested.rawInput).toContain('[REDACTED_EMAIL]');
    expect((output as any).nested.metrics).toBe(552); // Preserve non-strings
    expect((output as any).flag).toBe(true);
  });
});
