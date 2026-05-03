# 👩‍💻 Contributing to Deutsch-lehrerin

Thank you for helping build the future of Sovereign Language Learning!

## 🏗️ Architecture Overview
- **Frontend**: React 19 + TypeScript + Tailwind CSS.
- **Desktop Wrapper**: Tauri (Rust).
- **AI Layer**: `AIProvider` abstraction (Gemini, Ollama, LM Studio).
- **Voice**: `LocalLiveClient` using Web Speech API.

## 🛠️ Development Setup
1.  **Clone & Install**:
    ```bash
    git clone https://github.com/kasampra/Deutsch-lehrerin.git
    cd Deutsch-lehrerin
    npm install
    ```
2.  **Environment**:
    Create a `.env` file if you want to use the Gemini provider:
    ```env
    VITE_GEMINI_API_KEY=your_key_here
    ```
3.  **Run Web**: `npm run dev`
4.  **Run Desktop**: `npm run tauri dev`

## 🧪 Testing
We use **Vitest** for UAT and unit testing.
```bash
npm run test
```
*Note: Please add tests for any new AI providers or core logic.*

## 📜 Coding Standards
- Use **Surgical Edits**: Keep changes focused and idiomatic.
- **Type Safety**: No `any` unless absolutely necessary (e.g., mocking global browser APIs).
- **Styling**: Prefer Vanilla CSS or Tailwind utility classes.
