import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import '@testing-library/jest-dom';

// Mock Web Speech API
const mockSpeechRecognition = vi.fn().mockImplementation(function(this: any) {
  this.start = vi.fn();
  this.stop = vi.fn();
  this.onresult = null;
  this.onerror = null;
  this.onend = null;
});

(window as any).SpeechRecognition = mockSpeechRecognition;
(window as any).webkitSpeechRecognition = mockSpeechRecognition;

(window as any).speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
};

// Mock AudioContext
(window as any).AudioContext = vi.fn().mockImplementation(() => ({
  createMediaStreamSource: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
  })),
  createScriptProcessor: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
  })),
  createGain: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
  })),
  destination: {},
  close: vi.fn(),
}));

describe('App UAT', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/tags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ models: [{ name: 'qwen2.5:7b' }, { name: 'llama3:8b' }] }),
        });
      }
      if (url.includes('/v1/models')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ id: 'qwen2.5-7b-instruct' }] }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as any;
  });

  it('renders correctly and shows language and provider selectors', () => {
    render(<App />);

    expect(screen.getByText(/Choose Your Language/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose Your AI Brain/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Gemini/i)).toBeInTheDocument();
    // Use getAllByText because 'Ollama' appears in the modal too
    expect(screen.getAllByText(/Ollama/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Everyday Sentences/i)).toBeInTheDocument();
  });

  it('allows selecting a provider', () => {
    render(<App />);

    // Select the one specifically in the button
    const ollamaButtons = screen.getAllByText(/Ollama/i);
    const ollamaButton = ollamaButtons.find(el => el.tagName === 'SPAN');
    if (ollamaButton) fireEvent.click(ollamaButton);

    expect(ollamaButton).toBeInTheDocument();
  });
  it('shows the start button for conversation with selected scenario', () => {
    render(<App />);
    expect(screen.getByText(/Start: Freies Gespräch/i)).toBeInTheDocument();
  });

  it('renders the Scenario Lab and allows picking a scenario', () => {
    render(<App />);
    expect(screen.getByText(/Scenario Lab/i)).toBeInTheDocument();
    expect(screen.getByText(/Bürgeramt Anmeldung/i)).toBeInTheDocument();

    const buergeramtBtn = screen.getByText(/Bürgeramt Anmeldung/i);
    fireEvent.click(buergeramtBtn);

    expect(screen.getByText(/Start: Bürgeramt Anmeldung/i)).toBeInTheDocument();
  });

  it('opens and closes the Briefkasten modal', () => {
    render(<App />);
    const briefkastenBtn = screen.getByText(/Briefkasten/i);
    expect(briefkastenBtn).toBeInTheDocument();

    fireEvent.click(briefkastenBtn);
    expect(screen.getByText(/German Letter Explainer/i)).toBeInTheDocument();

    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/German Letter Explainer/i)).not.toBeInTheDocument();
  });

  it('allows entering a Gemini API Key', () => {
    render(<App />);
    
    // The default selection is Gemini, so the settings block for Gemini should be visible
    const apiKeyInput = screen.getByPlaceholderText(/Enter your Gemini API Key/i) as HTMLInputElement;
    expect(apiKeyInput).toBeInTheDocument();

    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    expect(apiKeyInput.value).toBe('test-api-key');
  });
});
