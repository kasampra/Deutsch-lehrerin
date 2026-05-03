# 🇩🇪 Deutsch-lehrerin: Sovereign AI German Tutor

A private, sovereign, and judgment-free German language mentor that lives entirely on your local machine.

## 🚀 Vision
Built for the "OwnYourIntelligence" philosophy, this app ensures your language learning data never leaves your hardware. No cloud tracking, no subscriptions, just you and your AI teacher.

## ✨ Key Features
- **Sovereign AI Brain**: Support for local LLMs via **Ollama** or **LM Studio**.
- **Voice-First Interaction**: Talk to your teacher in real-time using local Speech-to-Text and Text-to-Speech.
- **Proactive Grammar Tutoring**: Receive gentle, immediate corrections as you speak.
- **Everyday Sentences**: Practice 100+ high-frequency phrases for daily life in Germany with pronunciation validation.
- **Progress Tracking**: Local dashboard to monitor your sessions, duration, and AI-graded performance.

## 🛠️ One-Click Setup (Local Mode)

### 1. Prerequisite: Install the Brain (Ollama)
- Download and install **Ollama** from [ollama.com](https://ollama.com/).
- Open your terminal and run: `ollama run llama3` (or your preferred model).

### 2. Run the App
- **Development**:
  ```bash
  npm install
  npm run dev
  ```
- **Desktop (Tauri)**:
  ```bash
  npm run tauri dev
  ```

### 3. Configure
- Select **Ollama** in the "Choose Your AI Brain" section.
- Pick your language (German or English).
- Click **Start Conversation** and begin speaking!

## 🗺️ Product Roadmap
Detailed user stories and future phases are available in [PRODUCT_ROADMAP.md](./PRODUCT_ROADMAP.md).

## 🛡️ Privacy
This application is "Sovereign by Design". When using the Ollama or LM Studio providers, **zero data** is sent to the cloud. All transcripts, audio, and progress data are stored locally in your browser/app cache.

---
Created by **Praveen Kasam**, Sovereign AI Architect.
*Part of the OwnYourIntelligence Business OS.*
