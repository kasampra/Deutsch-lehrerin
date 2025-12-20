# Deutsch Daily - AI German Tutor 🇩🇪

**Deutsch Daily** is a compassionate, AI-powered German teacher designed to help you practice speaking German for 15 minutes every day. Built with React and the Google Gemini Live API, it provides a real-time, low-latency voice conversation experience with an empathetic persona named "Frau Müller".

![Deutsch Daily Banner](https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80)

## 🌟 Features

*   **Real-time Voice Conversation**: Talk naturally with Gemini (using the specialized `gemini-2.5-flash-native-audio` model) with ultra-low latency.
*   **Empathetic Persona ("Frau Müller")**: The AI is instructed to be patient, encouraging, and pedagogically sound, focusing on conversation flow rather than strict grammar drills.
*   **Live Visualizer**: Real-time audio visualization for both the user (Red) and the AI (Gold) to indicate listening and speaking states.
*   **Live Transcript**: Follow the conversation with a scrolling text transcript that differentiates between user and AI.
*   **15-Minute Timer**: A built-in session timer helps you stick to a daily micro-learning habit.
*   **Feedback Mode**: At the end of the session, the AI provides constructive feedback on vocabulary, grammar, and pronunciation.

## 🛠 Tech Stack

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **AI**: Google Gemini Multimodal Live API (`@google/genai`)
*   **Audio**: Web Audio API (Raw PCM processing, AudioWorklets/ScriptProcessor)
*   **Tooling**: Vite

## 🚀 Setup Guide

### Prerequisites

1.  **Node.js**: Ensure you have Node.js (v18+) installed.
2.  **Google Cloud Project**: You need a Google Cloud project with the **Gemini API** enabled.
3.  **API Key**: Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/kasampra/deutsch-daily.git
    cd deutsch-daily
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure your API Key:
    *   Create a file named `.env` in the root directory.
    *   Add your API key:
        ```env
        API_KEY=your_actual_api_key_here
        ```

### Running the App

Start the development server:

```bash
npm run dev
```

Open your browser to `http://localhost:5173`.

## 📖 Usage

1.  **Start**: Click "Start Conversation". You may need to grant microphone permissions.
2.  **Speak**: Talk naturally. Frau Müller will introduce herself.
3.  **Visuals**: Watch the visualizers to see when the AI is listening versus thinking/speaking.
4.  **Finish**: When the timer runs out, or when you are ready, say "I am done" or "Stop" to receive your personalized feedback.

## 📄 License

MIT
