import { describe, it, expect } from 'vitest';
import { sanitizeTTS } from '../services/localLiveClient';

describe('sanitizeTTS - Speech Cleaner', () => {
  it('converts bracketed grammar corrections into natural spoken notes', () => {
    const raw = "[Korrektur: 'Ich habe gegangen' -> 'Ich bin gegangen' | Perfekt mit sein bilden] Sehr gut, und wo warst du?";
    const spoken = sanitizeTTS(raw);

    expect(spoken).not.toContain('[');
    expect(spoken).not.toContain(']');
    expect(spoken).not.toContain('->');
    expect(spoken).not.toContain('Korrektur');
    expect(spoken).toContain('Merke: Ich bin gegangen.');
    expect(spoken).toContain('Sehr gut, und wo warst du?');
  });

  it('preserves clean sentences without corrections', () => {
    const raw = 'Guten Tag! Wie kann ich Ihnen heute beim Deutschlernen helfen?';
    const spoken = sanitizeTTS(raw);

    expect(spoken).toBe('Guten Tag! Wie kann ich Ihnen heute beim Deutschlernen helfen?');
  });

  it('strips markdown formatting like bold, headings and backticks', () => {
    const raw = 'Das ist **wichtig**: Bitte achte auf `den Dativ`!';
    const spoken = sanitizeTTS(raw);

    expect(spoken).toBe('Das ist wichtig: Bitte achte auf den Dativ!');
  });
});
