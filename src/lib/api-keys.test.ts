import { describe, expect, it } from 'vitest';
import { createApiKey, hashApiKey } from './api-keys';

describe('API key management', () => {
  it('creates a prefixed plaintext key and matching hash', () => {
    const result = createApiKey();
    expect(result.plaintext.startsWith('pk_live_')).toBe(true);
    expect(result.prefix).toBe(result.plaintext.slice(0, 16));
    expect(result.hash).toBe(hashApiKey(result.plaintext));
  });

  it('does not produce the same key twice', () => {
    expect(createApiKey().plaintext).not.toBe(createApiKey().plaintext);
  });

  it('hashes the same input deterministically', () => {
    expect(hashApiKey('test-key')).toBe(hashApiKey('test-key'));
    expect(hashApiKey('test-key')).not.toBe(hashApiKey('other-key'));
  });
});
