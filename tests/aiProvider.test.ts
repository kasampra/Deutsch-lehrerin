import { describe, it, expect, vi } from 'vitest';
import { OllamaProvider, LMStudioProvider } from '../services/aiProvider';
import { Language } from '../types';

describe('AI Providers', () => {
  it('OllamaProvider should format chat request correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: { content: 'Hallo!' } }),
    });
    global.fetch = mockFetch;

    const provider = new OllamaProvider('llama3', 'http://localhost:11434');
    const response = await provider.chat('Hello', 'You are a tutor', []);

    expect(response).toBe('Hallo!');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"llama3"'),
      })
    );
  });

  it('LMStudioProvider should format chat request correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: 'Moin!' } }] }),
    });
    global.fetch = mockFetch;

    const provider = new LMStudioProvider('model-id', 'http://localhost:1234/v1');
    const response = await provider.chat('Hello', 'You are a tutor', []);

    expect(response).toBe('Moin!');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:1234/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"model-id"'),
      })
    );
  });
});
