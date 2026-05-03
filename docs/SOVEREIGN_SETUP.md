# 🛡️ Sovereign AI Setup Guide

This guide will help you set up **Deutsch-lehrerin** to run 100% locally. No data leaves your machine, ensuring total privacy.

## Step 1: Install the Brain (Ollama)
The "Brain" of the application is a Large Language Model. We recommend **Ollama** for its simplicity.

1.  Download Ollama from [ollama.com](https://ollama.com/).
2.  Install and launch it.
3.  Open your terminal and pull the German-optimized model:
    ```bash
    ollama pull llama3
    ```

## Step 2: Configure the App
1.  Launch **Deutsch-lehrerin**.
2.  In the landing screen, locate the **"Choose Your AI Brain"** section.
3.  Select the **Ollama** icon.
4.  Ensure Ollama is running in your system tray.

## Step 3: Local Voice (STT/TTS)
The app uses the **Web Speech API** for Phase 1. 
- **Chrome/Edge**: Provide the best experience for local speech recognition.
- **Privacy Note**: While these APIs run in the browser, some browsers may send voice data to their own servers for processing. For 100% air-gapped privacy, stay tuned for Phase 2 (Whisper.cpp integration).

## Troubleshooting
- **Connection Error**: Ensure Ollama is running and accessible at `http://localhost:11434`.
- **CORS Issues**: If the app cannot talk to Ollama, you may need to set an environment variable:
  - **Windows**: `set OLLAMA_ORIGINS=*`
  - **Mac/Linux**: `OLLAMA_ORIGINS="*" ollama serve`
