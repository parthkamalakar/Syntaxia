# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

There is **no build system, package manager, lint, or test suite** — this is a static vanilla-JS app. All four tracked files are hand-authored source.

- **Run locally (with working AI Tutor):** `vercel dev` — requires `.env.local` containing `GROQ_API_KEY=gsk_...`. The AI Tutor calls `/api/chat`, a Vercel serverless function, so it only resolves when served by Vercel.
- **Static preview (AI Tutor offline):** open `syntaxia.html` via VS Code Live Server. The app detects the `file:` protocol and silently falls back to the keyword-matched `offlineAI()` knowledge base instead of calling Groq.
- **Deploy:** `vercel` (CLI) or import the GitHub repo on vercel.com. Set `GROQ_API_KEY` (and optionally `GROQ_MODEL`) under Project Settings → Environment Variables.

Never open `syntaxia.html` by double-clicking — the AI Tutor will be broken (no serverless endpoint, CORS).

## Architecture

### Single-file frontend + one serverless function
The entire UI — markup, `<style>`, and one inline `<script>` (~80KB, all logic) — lives in `syntaxia.html` (~1600 lines). `vercel.json` rewrites `/` → `/syntaxia.html`. The only backend code is `api/chat.js`, a Groq proxy whose sole purpose is keeping `GROQ_API_KEY` off the client. The key must never appear in `syntaxia.html` or `localStorage`.

**Frontend stack:** vanilla HTML/CSS/JS, no framework. External runtime deps are limited to Google Fonts (Inter, JetBrains Mono) and the DiceBear avatar API.

### Client-side state
Global state object `P = {done:{}, xp:0, str:3}` (completed lessons, XP, streak) is persisted to a single `localStorage` key **`syn_prog`** via `saveP()` and rehydrated on load. `LANGS`, `LEAGUES`, `POWERUPS`, and `BADGES` are static JS constants embedded in the script — there is no database. League/tier are derived from `xp` by `league()`/`lvl()`.

### App is a hand-rolled view router
`nav(view)` swaps views; `render*` functions (`renderHome`, `renderCourses`, `renderMission`, `renderLB`, `renderProfile`) build each view into the DOM. Lesson flow is `openCourse` → `openLesson` → `renderLes` with steps (`learn` → `code` → `quiz`) tracked in `lesStep`.

### Lesson "run code" is a stub
`runCode()` does **not** execute code — it only flips `lesRan=true` and re-renders. `showSol()` copies `curLesson.code` into the editor; `subQ()` records a quiz answer. There is no sandbox or runner. Treat any "add real execution" work as net-new (the README lists the Piston API as a future idea).

### AI Tutor flow (`aiSend` → `/api/chat` → `offlineAI`)
`aiSend()` builds an OpenAI-style `messages` array with a system prompt chosen by context: `SYS_GEN` (general tutor) or `SYS_LES` (lesson-scoped, when `aiCtx && curLesson` are set via `setAILessonCtx`). It POSTs to `/api/chat`. On any fetch failure (or `file:`), it falls back to `offlineAI()`, which keyword-matches the embedded `KB` array (bonus-weighted by current lesson language) and returns canned guidance. **Mission Lab** (`startMission`/`startCustomMission`) is not a separate backend — it injects a structured prompt into this same AI flow to produce checkpoint-based guidance.

### Serverless proxy contract (`api/chat.js`)
POST-only; rejects empty/oversized payloads; sanitizes roles to `system|user|assistant`; caps at 12 messages, 4000 chars/message, 16000 chars total; 15s `AbortController` timeout (→ 504); 600 max_tokens, temperature 0.7; default model `llama-3.1-8b-instant` (overridable via `GROQ_MODEL`). Returns `{ reply }` or `{ error }`. Extend AI behavior through this file plus the `SYS_*` prompts and `KB` entries in the HTML.

## Gotchas

- **Grep decoys:** `syntaxia.html` contains embedded lesson code samples that look like real functions — e.g. `function getData()` (fetches `api.example.com/data`), `function getUser()`, and a `nums` array with `.map()/.filter()`. These are learner-facing examples, **not** app code. The real state loader is the inline `try{...JSON.parse(localStorage.getItem('syn_prog'))...}` block; `api.example.com` is a placeholder, not a real dependency.
- The single `<script>` block holds all ~48 functions and all data constants together — edits anywhere in `syntaxia.html` share one scope with no module boundaries.
