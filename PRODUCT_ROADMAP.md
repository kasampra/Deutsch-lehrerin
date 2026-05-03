# 🗺️ Product Roadmap: Deutsch-lehrerin

## Vision
A one-click, sovereign German language tutor that runs entirely on your local machine. No cloud, no subscriptions, no data leaks.

---

## 🚀 Theme 1: The Sovereign Brain (Local Inference)
*Goal: Remove dependency on cloud APIs and enable local LLM execution.*

### User Stories:
- **US.1: Local LLM Integration (Ollama)**
  - *As a user, I want the app to connect to my local Ollama instance so that my conversations remain private and work offline.*
  - **Acceptance Criteria:** 
    - Configuration option to toggle between Cloud (Gemini) and Local (Ollama).
    - Support for `llama3` or `mistral` models for German conversation.
- **US.2: Voice-to-Voice (Local STT/TTS)**
  - *As a user, I want to speak to the app and hear it respond in German without using cloud services.*
  - **Acceptance Criteria:**
    - Integration with local Whisper (STT) and Piper/Kokoro (TTS).
    - Latency under 2 seconds for a natural "conversation" feel.

---

## 🛠️ Theme 2: The Learning Engine (Daily Practice)
*Goal: Provide structured daily improvement tools.*

### User Stories:
- **US.3: Everyday Sentence Mastery**
  - *As a learner, I want a daily list of "Survival German" sentences so that I can handle real-world situations (Amt, Supermarket, Doctor).*
  - **Acceptance Criteria:**
    - Interactive flashcards with audio playback.
    - "Speech Check" that validates my pronunciation against the target sentence.
- **US.4: AI Grammar Tutor**
  - *As a learner, I want the AI to proactively correct my grammar during speaking practice.*
  - **Acceptance Criteria:**
    - Real-time text highlights of mistakes.
    - Simple, German-language explanations of why a specific case (Dativ/Akkusativ) was used.
- **US.5: Progress Tracking & SRS**
  - *As a learner, I want to see my progress over time so that I stay motivated.*
  - **Acceptance Criteria:**
    - Local dashboard showing "Sentences Learned" and "Speaking Minutes."
    - Spaced Repetition System (SRS) to resurface difficult words.

---

## 📦 Theme 3: The "One-Click" Experience (Deployment)
*Goal: Zero-friction installation for non-technical users.*

### User Stories:
- **US.6: Unified Installer**
  - *As a non-tech user, I want a single file to download that installs the UI, the LLM runner, and the Voice models.*
  - **Acceptance Criteria:**
    - Executable for Windows (.exe) and Mac (.dmg).
    - Automated check for hardware (GPU/CPU) to optimize model selection.
- **US.7: Auto-Configuration**
  - *As a user, I want the app to automatically download the necessary German language models on first launch.*
  - **Acceptance Criteria:**
    - Progress bar for model downloads.
    - Sanity check to verify local inference is working.

---

## 📅 Roadmap Schedule

### Phase 1: Local Foundation (Now)
- [ ] Refactor `services/` to support Ollama provider.
- [ ] Implement basic Web Speech API for voice prototyping.
- [ ] Create `constants.ts` for everyday sentence database.

### Phase 2: Interactive Tutor (Next)
- [ ] Integrated Whisper/Piper for full offline voice.
- [ ] Grammar correction logic in LLM prompts.
- [ ] Local SQLite storage for progress tracking.

### Phase 3: The Product (Later)
- [ ] Electron/Tauri wrapper for desktop application.
- [ ] One-click installer build pipeline (Github Actions).
- [ ] Offline documentation and "Sovereign AI" guide.
