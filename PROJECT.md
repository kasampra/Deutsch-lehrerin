# PROJECT: deutsch-lehrerin

## Objective
A private, sovereign, and judgment-free German language mentor that lives entirely on the local machine. Designed to provide voice-first interaction for language mastery without cloud dependency.

## Sovereign Logic
- **Zero-Cloud Dependency**: Uses local LLM runners (Ollama/LM Studio) to ensure conversation data never leaves the hardware.
- **Local Audio Processing**: Speech-to-Text (STT) and Text-to-Speech (TTS) are handled locally to maintain privacy.
- **Privacy by Design**: All transcripts, audio files, and progress metrics are stored in local application caches.

## Technical Stack
- **Framework**: React, TypeScript, Vite.
- **Desktop Wrapper**: Tauri.
- **AI Brain**: Ollama / LM Studio (Local LLMs).
- **Voice Stack**: Whisper (STT), Piper/Kokoro (TTS).
- **Storage**: Local browser/app cache (Phase 2 plans for SQLite).
