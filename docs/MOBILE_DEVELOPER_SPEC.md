# 📱 Mobile Developer Specification: Deutsch-lehrerin
**Stack**: Tauri 2.11 · React 19 · TypeScript · Rust (tokio) · iOS (Swift) · Android (Kotlin)  
**Repo root**: `c:\ownyourintelligence-business-OS\projects\deutsch-lehrerin\`

> Read this before touching code: The Rust backend (`src-tauri/src/lib.rs`) is currently a near-empty shell with only `tauri-plugin-log`. The frontend talks to AI via HTTP to `localhost:11434` (Ollama) or Gemini cloud. All app state is in `localStorage`. Your job is to add 5 native mobile capabilities via Tauri's Rust/Swift/Kotlin plugin layer, keeping the React frontend as the UI.

---

## Pre-Flight Checklist (Do First)

Before building any feature, verify your environment:

```bash
# 1. Confirm Tauri mobile toolchain
npm run tauri -- info

# 2. iOS: Xcode 15+, iOS 16+ Simulator, Apple Developer account
npm run tauri ios init
npm run tauri ios dev

# 3. Android: Android Studio, SDK 33+, NDK r26+
npm run tauri android init
npm run tauri android dev
```

Confirm the app renders on both simulators before proceeding.

---

## FEATURE 1: Native SQLite Storage (Prerequisite for All Features)

> **This is not optional. Build this first. Every other feature depends on it.**

### The Problem
All progress data is written to `localStorage` inside the WebView (see `utils/progressUtils.ts`). On mobile, WebView storage is volatile, wiped on low-memory events, and not shareable between the app and native extensions (widgets, share extensions). Replace it with SQLite.

### Exact Steps

**Step 1 — Add the dependency to `src-tauri/Cargo.toml`**
```toml
[dependencies]
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
```

**Step 2 — Register the plugin in `src-tauri/src/lib.rs`**
```rust
.plugin(tauri_plugin_sql::Builder::default().build())
```

**Step 3 — Add the npm package**
```bash
npm install @tauri-apps/plugin-sql
```

**Step 4 — Create `utils/db.ts` (new file)**
```typescript
import Database from '@tauri-apps/plugin-sql';

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;
  _db = await Database.load('sqlite:deutsch_lehrerin.db');
  await _db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      language TEXT NOT NULL,
      duration INTEGER NOT NULL,
      sentence_count INTEGER NOT NULL,
      feedback_json TEXT
    );
    CREATE TABLE IF NOT EXISTS mastered_sentences (
      sentence TEXT PRIMARY KEY
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return _db;
}
```

**Step 5 — Rewrite `utils/progressUtils.ts`**  
Replace all `localStorage.setItem/getItem` calls with `await db.execute()` / `await db.select()` using the `getDb()` helper above.

**Step 6 — Migrate settings from `localStorage` in `App.tsx`**  
Replace all 4 `localStorage.getItem('deutsch_lehrerin_*')` reads with `db.select('SELECT value FROM settings WHERE key = ?', [key])`.

---

## FEATURE 2: Mobile AI Provider — "BYOK Hybrid" (Offline + Cloud Fallback)

### The Problem
`services/aiProvider.ts` — `OllamaProvider` hits `http://localhost:11434`. On a phone, there is no Ollama running. The mobile app needs its own inference strategy.

### Goal
Add a `MobileProvider` class to `aiProvider.ts` that implements the existing `AIProvider` interface and is selected automatically when the app is running on iOS or Android.

### Implementation

**Step 1 — Detect mobile platform in `App.tsx`**
```typescript
import { platform } from '@tauri-apps/plugin-os';

const isMobile = ['ios', 'android'].includes(await platform());
```

**Step 2 — Add `MobileProvider` to `services/aiProvider.ts`**
The `MobileProvider` routes to:
1. **Groq** (free, ultra-fast, requires user API key) — `https://api.groq.com/openai/v1/chat/completions` using `llama-3.1-8b-instant` model.
2. **Gemini** (existing `GeminiProvider`) — fallback if Groq key absent.

---

## FEATURE 3: Camera OCR "Briefkasten" — Scan German Letters

### Goal
User taps a camera button → takes a photo of a German letter or sign → OCR extracts German text → text is sent to the LLM with a fixed "explain and roleplay" prompt → AI responds as Frau Müller.

### Implementation
1. Add `@tauri-apps/plugin-camera` and `tauri-plugin-camera = "2"` to `Cargo.toml`.
2. Implement Apple Vision `VNRecognizeTextRequest` on iOS and Google ML Kit on Android for zero-cloud, 100% offline German text extraction.
3. Expose Tauri command `ocr_image(image_path: String) -> Result<String, String>`.

---

## FEATURE 4: Hands-Free Audio Mode (Screen-Off Voice Sessions)

### Goal
User starts a session, locks their phone, and the voice conversation continues through their headphones with no interruption.

### Key iOS Audio Architecture
1. Initialize `AVAudioSession` with `.playAndRecord` and `.voiceChat` mode (enables full-duplex Acoustic Echo Cancellation for Barge-in).
2. Configure background audio capability in `Info.plist` (`UIBackgroundModes` -> `audio`).
3. Move real-time STT / TTS pipeline to native Swift/Kotlin bridge, emitting domain events to the React UI.

---

## FEATURE 5: Tap-to-Launch Home Screen Widget + Live Activity

> ⚠️ **IMPORTANT SCOPE CONSTRAINT**: iOS WidgetKit cannot access the microphone. The widget is a launcher only (`deutschlehrerin://start-drill`).

1. **Widget**: Displays today's German survival phrase with deep link to start micro-drill.
2. **Live Activity**: Shows active session timer and last spoken transcript on Dynamic Island and Lock Screen.
