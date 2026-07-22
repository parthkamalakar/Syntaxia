# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is a **Vite + vanilla ES-module** app. Node is required.

- **Install:** `npm install`
- **Frontend dev (fast HMR):** `npm run dev` — the AI Tutor and server-run languages fall back gracefully because `/api/*` isn't served by plain Vite.
- **Full-stack dev (AI + execution work):** `vercel dev` — requires `.env.local` with `GROQ_API_KEY=gsk_...` so `/api/chat` and `/api/run` resolve.
- **Build:** `npm run build` → `dist/`. `vercel.json` is `framework: vite`, output `dist`.
- **Test:** `npm test` (Vitest, node env, pure-logic unit tests in `tests/`).
- **Deploy:** `vercel --prod`, or push to GitHub and let Vercel auto-deploy. Set `GROQ_API_KEY` (and optionally `GROQ_MODEL`, `EXEC_URL`) in Project Settings → Environment Variables.

Never open `index.html` by double-clicking — module imports and `/api/*` need a server.

## Architecture

### Modular frontend + two serverless functions
The app was migrated from a single `syntaxia.html` (now deleted) into ES modules under `src/`, bundled by Vite. Entry is `index.html` → `src/main.js`.

- `src/main.js` — bootstrap: imports `ui/app.js`, loads `styles/extras.css`, calls `initCursor()`.
- `src/state.js` — **the only module that touches `localStorage['syn_prog']`**. Exports the live `P` object, `saveP()`, `hydrate()`, `recordActivity(P, todayISO)` (daily streak), `todayISO()`.
- `src/data/` — pure data + generators: `languages.js` (LANGS), `courses.js` (LESSONS + the generic-lesson generator), `gamification.js` (LEAGUES, POWERUPS, LB, BADGES, MISSIONS), `kb.js` (offline KB).
- `src/ui/app.js` — the bulk of the UI: the hand-rolled view router (`nav`, `go`), all `render*` functions, helpers (`av`, `lvl`, `league`, `pct`, `toast`, `showXP`, `updNav`), the lesson flow, and the **impure** AI panel functions (`aiSend`, `renderAI`, `fmtAI`, etc.). Inline `onclick` handlers reference module functions, so app.js attaches them to `window` (and defines a `window.curLang` getter for the mutable one).
- `src/features/ai.js` — **pure**: `offlineAI(question, lessonCtx)` + `SYS_GEN`/`SYS_LES` prompts (imported by app.js).
- `src/features/compiler.js` — execution: `runJS` (in-browser), `runHTML` (iframe srcdoc), `runRemote` (`/api/run`), `normalize`/`matchesExpected`, and the router `runCodeForLesson(langId, code)`.
- `src/features/cursor.js` — custom cursor + OS hide (`shouldEnableCustomCursor`, `initCursor`).
- `api/chat.js`, `api/run.js` — Vercel serverless functions (ESM, `export default`).

**Stack:** vanilla ES modules + Vite. External runtime deps: Google Fonts (Inter, JetBrains Mono), DiceBear avatars.

### Client-side state
`P = { done, xp, str, lastActive, avatar, settings }` persists to `localStorage['syn_prog']`. `hydrate()` merges defaults and migrates the legacy hardcoded streak (`str=3` → `0` when there's no `lastActive`). League/tier derived from `xp` via `league()`/`lvl()`.

### Lesson flow & real execution
`openCourse` → `openLesson` → `renderLes`/`renderLesBody` with steps `learn → code → quiz`. `runCode()` is **real**: it calls `runCodeForLesson(curLang.id, lesCode)` and renders `runPanel()` (stdout/stderr, iframe preview, or reference output). `claimXP()` gates XP on `passedRun()` — matching expected output (or a successful preview-only/HTML run) — and calls `recordActivity()` to update the streak. Lessons without deterministic `out` (e.g. HTML preview) pass on success; SQL/Phaser are preview-only (reference output, no live DB).

### Code execution backend (`api/run.js`)
POST-only; `validateInput(language, code, RUNTIMES)` allowlists languages and caps code at 8000 chars (unit-tested). Proxies to the public **Judge0 CE** instance (`EXEC_URL`, default `https://ce.judge0.com/...`) — the public Piston API is whitelist-only as of Feb 2026. Maps our lang ids to Judge0 `language_id`s (verified live). 9s timeout (→ 504). Returns `{ stdout, stderr, exitCode }` (`exitCode 0` when Judge0 status is Accepted/3).

### AI Tutor flow (`aiSend` → `/api/chat`)
`aiSend()` builds an OpenAI-style `messages` array with `SYS_GEN` or `SYS_LES`, POSTs to `/api/chat`. On fetch failure it shows a contextual error message (not `offlineAI` — that helper is exported but currently unused at runtime). **Mission Lab** (`startMission`/`startCustomMission`) injects a structured prompt into the same flow.

## Gotchas

- **Inline `onclick` globals:** the markup uses `onclick="nav('home')"`, `openLesson(LANGS.find(...), LESSONS[...])`, `openCourse(curLang)`, etc. These resolve against `window`, so app.js must keep every handler (and `LANGS`, `LESSONS`, and a live `curLang` getter) attached to `window`. If you add a new onclick handler, expose it in app.js's `Object.assign(window, …)` block.
- **`curLang` is the LANGS object** (not the id); `curLang.id` is the language id used for execution routing.
- **ESM in `/api`:** the root `package.json` is `"type": "module"`, so `api/*.js` must use `export default` (not `module.exports`) or Vercel/Vitest will fail.
- **Grep decoys:** lesson code samples (e.g. `function getData()`, `function getUser()`, a `nums` array) live in `src/data/courses.js` and `kb.js` — they are learner-facing examples, **not** app code.
- Tests are intentionally scoped to pure logic (state, compiler, validation, cursor-enable). DOM rendering and live API calls are verified manually.
