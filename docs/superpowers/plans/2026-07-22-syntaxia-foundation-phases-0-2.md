# Syntaxia Foundation — Vite Migration + Phases 0–2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the single-file `syntaxia.html` app to a Vite + modular vanilla JS project, then land the streak bug fix (Phase 0), the real hybrid compiler (Phase 1), and the OS-cursor-hide custom cursor (Phase 2) — producing the first deployable push to GitHub + Vercel.

**Architecture:** Vite bundles ES modules under `src/` (data, ui, features) with a root `index.html` entry. Two Vercel serverless functions remain in `api/` (`chat.js` kept, `run.js` added). Progress stays in `localStorage`; AI and code execution are proxied server-side.

**Tech Stack:** Vite 5, vanilla ES modules, Vitest (pure-logic tests only), Vercel serverless functions (Node), Groq + Piston (emkc.org public endpoint).

## Global Constraints

- **Source of truth for extraction:** all existing markup/CSS/JS currently lives in `syntaxia.html` (one `<style>` block and one inline `<script>`). Extraction tasks locate content by markers (`<style>...</style>`, the `<script>` block, named `const`/`function` declarations), not line numbers — line numbers drift.
- **Preserve existing behavior:** during extraction the app must render and behave identically before any new feature is added. Verify by eye after each extraction task.
- **localStorage key is `syn_prog`** — never change it; the `state.js` hydrate must merge new fields into existing objects without dropping `done`/`xp`.
- **No `GROQ_API_KEY` or keys in client code** — only in Vercel env / `.env.local`. Piston public endpoint needs no key.
- **Piston endpoint:** default `https://emkc.org/api/v2/piston/execute`, overridable via `PISTON_URL` env on the server function only.
- **All animations/cursor effects must respect `prefers-reduced-motion`.**
- **Commit after every task.** Use the conventional commit prefixes shown. Do not push until Task 14.
- **Node scripts:** `npm run dev` (Vite, frontend only — AI/compiler fall back to offline/in-browser), `npm run build`, `npm test` (Vitest), `vercel dev` (full stack incl. `/api`).

---

## File Structure (created/modified in this plan)

```
package.json                     NEW  — vite + vitest devDeps, scripts
vite.config.js                   NEW  — Vite + Vitest config
.gitignore                       NEW  — node_modules, dist, .env*, .vercel
index.html                       NEW  — Vite entry; markup moved from syntaxia.html; <script type="module" src="/src/main.js">
vercel.json                      MOD  — framework:vite, build, output:dist
src/main.js                      NEW  — bootstrap: hydrate, init cursor, mount router
src/state.js                     NEW  — P, saveP, hydrate, recordActivity (streak)
src/data/languages.js            NEW  — LANGS
src/data/gamification.js         NEW  — LEAGUES, POWERUPS, BADGES
src/data/kb.js                   NEW  — KB (offline AI knowledge base)
src/data/courses.js              NEW  — LESSONS (moved verbatim this plan; expanded in a later plan)
src/ui/router.js                 NEW  — nav(), setAILessonCtx(), view dispatch
src/ui/views.js                  NEW  — render* functions
src/ui/components.js             NEW  — cards, toast, showXP, modal helpers
src/features/ai.js               NEW  — aiSend, offlineAI, SYS_GEN/SYS_LES
src/features/compiler.js         NEW  — runJS, runHTML, runRemote, normalize, matchesExpected, runCodeForLesson
src/features/cursor.js           NEW  — shouldEnableCustomCursor + cursor init
src/features/avatar.js           NEW  — avatarURL() only (full builder is a later plan); keeps current fixed avatar working
src/styles/main.css              NEW  — all CSS moved from <style>
api/chat.js                      KEEP — unchanged
api/run.js                       NEW  — Piston proxy with validateInput helper
tests/state.test.js              NEW
tests/compiler.test.js           NEW
tests/run.test.js                NEW
tests/cursor.test.js             NEW
syntaxia.html                    DEL  — removed in Task 13 after parity verified
README.md                        MOD  — new dev/build/test workflow
```

**Responsibilities:**
- `state.js` is the **only** module that reads/writes `localStorage['syn_prog']`.
- `data/` modules are pure data + generators, no DOM.
- `ui/` owns all DOM. `router.js` is the single view-swap entry; `views.js` builds views; `components.js` holds reusable DOM helpers.
- `features/` are self-contained capabilities.
- `api/` are serverless functions; pure validation logic is factored out and imported by both the function and its tests.

---

### Task 1: Vite project scaffolding

**Files:**
- Create: `package.json`, `vite.config.js`, `.gitignore`
- Modify: `vercel.json`

**Interfaces:**
- Produces: a runnable `npm run dev` serving a minimal `index.html` (created in Task 2). The Vite/Vitest config that all later tasks rely on.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "syntaxia",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173 },
  build: { outDir: 'dist', target: 'es2020' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules
dist
.vercel
.env
.env.*
!.env.example
*.log
```

- [ ] **Step 4: Update `vercel.json` for the Vite build**

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

(The `/` → `/syntaxia.html` rewrite is removed: Vite's built `dist/index.html` serves `/`. `/api/*` is auto-detected as serverless.)

- [ ] **Step 5: Install dependencies**

Run: `npm install`
Expected: `node_modules` created; `vite` and `vitest` installed; no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json vite.config.js .gitignore vercel.json
git commit -m "chore: scaffold Vite + Vitest project"
```

---

### Task 2: Extract styles to `src/styles/main.css` and create `index.html`

**Files:**
- Create: `index.html`, `src/styles/main.css`

**Interfaces:**
- Produces: `index.html` is the Vite entry. After this task it has markup + a CSS link but a placeholder `<script>` (real bootstrap lands in Task 5). The app will not yet be interactive — that is expected.

- [ ] **Step 1: Create `index.html` from `syntaxia.html`**

Copy `syntaxia.html` to `index.html`. Then in `index.html`:
- Delete the entire `<style>...</style>` block.
- In `<head>`, add `<link rel="stylesheet" href="/src/styles/main.css" />`.
- Replace the inline `<script>...</script>` block with `<script type="module" src="/src/main.js"></script>`.
- Keep all existing markup (`<body>` contents, the nav, the `#app` container, modals) unchanged.

- [ ] **Step 2: Create `src/styles/main.css`**

Paste the entire contents of the deleted `<style>` block from `syntaxia.html` into `src/styles/main.css` verbatim.

- [ ] **Step 3: Verify the page loads (non-interactive is OK)**

Run: `npm run dev`
Expected: opens at `http://localhost:5173`; the landing page markup and styles render. Buttons will not work yet (no JS). Confirm there are no 404s for `/src/styles/main.css` in the browser console.

- [ ] **Step 4: Commit**

```bash
git add index.html src/styles/main.css
git commit -m "feat: extract styles to main.css, add Vite index.html entry"
```

---

### Task 3: Extract data modules (`languages`, `gamification`, `kb`, `courses`)

**Files:**
- Create: `src/data/languages.js`, `src/data/gamification.js`, `src/data/kb.js`, `src/data/courses.js`, `src/main.js` (temporary minimal bootstrap)

**Interfaces:**
- Produces:
  - `LANGS` (named export) from `src/data/languages.js`
  - `LEAGUES`, `POWERUPS`, `BADGES` (named exports) from `src/data/gamification.js`
  - `KB` (named export) from `src/data/kb.js`
  - `LESSONS` (named export) from `src/data/courses.js`

- [ ] **Step 1: Create `src/data/languages.js`**

Move the `const LANGS=[...]` declaration (begins at the `const LANGS=[` marker in `syntaxia.html`) into this file and change it to a named export:

```js
export const LANGS = [
  // ... contents moved verbatim from syntaxia.html ...
];
```

- [ ] **Step 2: Create `src/data/gamification.js`**

Move `LEAGUES`, `POWERUPS`, `BADGES` declarations verbatim and export them:

```js
export const LEAGUES = [ /* moved verbatim */ ];
export const POWERUPS = [ /* moved verbatim */ ];
export const BADGES = [ /* moved verbatim */ ];
```

- [ ] **Step 3: Create `src/data/kb.js`**

Move the `const KB=[...]` declaration verbatim:

```js
export const KB = [ /* moved verbatim */ ];
```

- [ ] **Step 4: Create `src/data/courses.js`**

Move the entire `const LESSONS={...}` object verbatim (all language keys and lesson objects) and export it:

```js
export const LESSONS = { /* moved verbatim */ };
```

- [ ] **Step 5: Create a temporary `src/main.js`**

```js
import { LANGS } from './data/languages.js';
import { LESSONS } from './data/courses.js';
// Temporary smoke test: confirm modules parse and load.
console.log('Syntaxia loaded:', LANGS.length, 'languages,', Object.keys(LESSONS).length, 'language course keys');
```

- [ ] **Step 6: Verify modules load**

Run: `npm run dev`
Expected: page loads; browser console prints `Syntaxia loaded: 19 languages, ...` with no module-resolution errors.

- [ ] **Step 7: Commit**

```bash
git add src/data src/main.js
git commit -m "feat: extract data modules (languages, gamification, kb, courses)"
```

---

### Task 4: State module + streak logic (Phase 0)

**Files:**
- Create: `src/state.js`, `tests/state.test.js`

**Interfaces:**
- Consumes: none.
- Produces:
  - `hydrate()` → returns the merged `P` object (reads `localStorage['syn_prog']`, merges defaults).
  - `saveP()` → persists current `P`.
  - `recordActivity(P, todayISO)` → mutates/returns `P` with updated `str` and `lastActive` per the streak rules. `todayISO` is `'YYYY-MM-DD'`.
  - `P` (default export of the live state object).

- [ ] **Step 1: Write the failing tests for `recordActivity`**

Create `tests/state.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { recordActivity, daysBetween } from '../src/state.js';

describe('daysBetween', () => {
  it('returns 0 for same day', () => {
    expect(daysBetween('2026-07-22', '2026-07-22')).toBe(0);
  });
  it('returns 1 for consecutive day', () => {
    expect(daysBetween('2026-07-22', '2026-07-23')).toBe(1);
  });
  it('returns 3 across a month boundary', () => {
    expect(daysBetween('2026-07-31', '2026-08-03')).toBe(3);
  });
});

describe('recordActivity streak logic', () => {
  const baseP = () => ({ done: {}, xp: 0, str: 0, lastActive: null });

  it('first ever activity sets streak to 1', () => {
    const p = recordActivity(baseP(), '2026-07-22');
    expect(p.str).toBe(1);
    expect(p.lastActive).toBe('2026-07-22');
  });

  it('same-day activity does not increment streak', () => {
    const p = recordActivity({ ...baseP(), str: 3, lastActive: '2026-07-22' }, '2026-07-22');
    expect(p.str).toBe(3);
  });

  it('consecutive day increments streak', () => {
    const p = recordActivity({ ...baseP(), str: 3, lastActive: '2026-07-21' }, '2026-07-22');
    expect(p.str).toBe(4);
    expect(p.lastActive).toBe('2026-07-22');
  });

  it('a gap resets streak to 1', () => {
    const p = recordActivity({ ...baseP(), str: 5, lastActive: '2026-07-19' }, '2026-07-22');
    expect(p.str).toBe(1);
    expect(p.lastActive).toBe('2026-07-22');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `recordActivity` / `daysBetween` are not exported from `src/state.js` (file missing or no exports).

- [ ] **Step 3: Implement `src/state.js`**

```js
const KEY = 'syn_prog';

const DEFAULTS = {
  done: {},
  xp: 0,
  str: 0,
  lastActive: null,
  avatar: { style: 'avataaars', seed: 'user', bg: '0b0c10', options: {} },
  settings: { customCursor: true },
};

export function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO + 'T00:00:00');
  const b = new Date(toISO + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

export function recordActivity(P, todayISO) {
  if (!P.lastActive) {
    P.str = 1;
  } else {
    const gap = daysBetween(P.lastActive, todayISO);
    if (gap === 0) {
      // same day: no change
    } else if (gap === 1) {
      P.str = (P.str || 0) + 1;
    } else {
      P.str = 1; // gap: reset
    }
  }
  P.lastActive = todayISO;
  return P;
}

export function hydrate() {
  let parsed = {};
  try {
    parsed = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (e) {
    parsed = {};
  }
  const merged = {
    ...DEFAULTS,
    ...parsed,
    done: { ...(parsed.done || {}) },
    avatar: { ...DEFAULTS.avatar, ...(parsed.avatar || {}), options: { ...(parsed.avatar?.options || {}) } },
    settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
  };
  // migrate legacy hardcoded streak: if no lastActive, streak is meaningless -> 0
  if (!merged.lastActive) merged.str = 0;
  return merged;
}

export function saveP() {
  try {
    localStorage.setItem(KEY, JSON.stringify(P));
  } catch (e) { /* ignore */ }
}

export function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const P = hydrate();
export default P;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `daysBetween` and `recordActivity` cases green.

- [ ] **Step 5: Commit**

```bash
git add src/state.js tests/state.test.js
git commit -m "feat(state): add state module with real daily streak logic"
```

---

### Task 5: Extract UI shell (`router`, `views`, `components`) and bootstrap

**Files:**
- Create: `src/ui/router.js`, `src/ui/views.js`, `src/ui/components.js`, `src/main.js` (replace temporary)
- Modify: `index.html` (ensure the nav streak span no longer hardcodes 3)

**Interfaces:**
- Consumes: `LANGS`, `LESSONS`, `LEAGUES`, `POWERUPS`, `BADGES`, `P`, `saveP`, `recordActivity`, `todayISO` (from Tasks 3–4).
- Produces: a fully interactive app identical to the original `syntaxia.html`, now module-based. The nav `#n-str` renders `P.str` dynamically.

- [ ] **Step 1: Create `src/ui/components.js`**

Move these helper functions from the `syntaxia.html` `<script>` verbatim and export each: `av` (avatar URL helper), `lvl`, `league`, `pct`, `toast`, `showXP`, `updNav`, `closeM`, `mkCard`, and any other small DOM helpers they call. Export all of them. They may import `P`/`LANGS`/`LEAGUES` as needed.

```js
import P, { saveP } from '../state.js';
import { LANGS } from '../data/languages.js';
import { LEAGUES } from '../data/gamification.js';

export function av(seed) {
  return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + seed + '&backgroundColor=0b0c10';
}
export function lvl(xp) { return Math.floor(xp / 100) + 1; }
export function league(xp) { return LEAGUES.find(l => xp >= l.min && xp < l.max) || LEAGUES[0]; }
export function pct(done, total) { return total ? Math.round(done / total * 100) : 0; }
// ... move toast, showXP, updNav, closeM, mkCard verbatim, each as `export function ...`
```

- [ ] **Step 2: Create `src/ui/views.js`**

Move all `render*` functions verbatim (`renderHome`, `renderCourses`, `renderMission`, `startMission`, `startCustomMission`, `filterC`, `openCourse`, `openLesson`, `renderLes`, `setStep`, `renderLesBody`, `showSol`, `selQ`, `subQ`, `claimXP`, `renderLB`, `renderProfile`, `showSettings`, `saveSettings`) and export each. They import what they need from `state.js`, `data/*`, and `components.js`.

```js
import P, { saveP } from '../state.js';
import { LANGS } from '../data/languages.js';
import { LESSONS } from '../data/courses.js';
import { LEAGUES, POWERUPS, BADGES } from '../data/gamification.js';
import { av, lvl, league, pct, toast, showXP } from './components.js';
// ... moved render* functions, each `export function ...`
```

- [ ] **Step 3: Create `src/ui/router.js`**

Move `nav(pg)` and `go(pg)` verbatim and export `nav`. Keep a module-level `current` view variable if the original used one.

```js
export function nav(pg) { /* moved verbatim */ }
```

- [ ] **Step 4: Replace `src/main.js` with the real bootstrap**

```js
import P from './state.js';
import { updNav } from './ui/components.js';
import { nav } from './ui/router.js';

// Initialize nav counts from live state, then show home.
updNav();
nav('home');
```

- [ ] **Step 5: Make the nav streak render dynamically**

In `src/ui/components.js`, find `updNav()` and change the streak assignment to read `P.str` instead of any hardcoded value:

```js
export function updNav() {
  const xpEl = document.getElementById('n-xp');
  if (xpEl) xpEl.textContent = P.xp;
  const strEl = document.getElementById('n-str');
  if (strEl) strEl.textContent = P.str;
  // ... keep any other existing nav updates verbatim ...
}
```

Also edit `index.html`: change `<span id="n-str">3</span>` to `<span id="n-str">0</span>` (the JS overwrites it on load anyway, but the static fallback should not lie).

- [ ] **Step 6: Verify parity**

Run: `npm run dev`
Expected: app fully interactive — navigation works, courses open, lessons render, XP updates, profile shows. The nav streak shows `P.str` (0 for a fresh user). Confirm the home page looks identical to the original `syntaxia.html`.

- [ ] **Step 7: Commit**

```bash
git add src/ui index.html
git commit -m "feat(ui): extract router/views/components and bootstrap; dynamic streak"
```

---

### Task 6: Extract `features/ai.js`

**Files:**
- Create: `src/features/ai.js`

**Interfaces:**
- Consumes: `KB` (from `data/kb.js`), `P`, `curLesson`/`aiCtx` state.
- Produces: `aiSend`, `offlineAI`, `setAILessonCtx`, and the `SYS_GEN`/`SYS_LES` prompt strings, exported for use by views.

- [ ] **Step 1: Create `src/features/ai.js`**

Move `aiSend`, `offlineAI`, `setAILessonCtx`, `SYS_GEN`, `SYS_LES` verbatim from the `syntaxia.html` `<script>`. Export the functions and prompt strings. Keep the `file:`-protocol offline fallback and `/api/chat` POST behavior exactly as-is.

```js
import { KB } from '../data/kb.js';

export const SYS_GEN = `You are Syntaxia AI ...`;   // moved verbatim
export const SYS_LES = `You are Syntaxia AI ...`;   // moved verbatim

export function setAILessonCtx(lesson) { /* moved verbatim */ }
export function offlineAI(q) { /* moved verbatim */ }
export async function aiSend() { /* moved verbatim */ }
```

- [ ] **Step 2: Wire views to import from `features/ai.js`**

Update `src/ui/views.js` to import `aiSend`, `setAILessonCtx` (and any handlers that referenced them) from `../features/ai.js` instead of using the now-removed inline versions.

- [ ] **Step 3: Verify AI tutor still works (offline path)**

Run: `npm run dev` (Vite = `file:`-like fallback to `offlineAI` because `/api/chat` 404s under plain Vite)
Expected: opening the AI tutor and typing a keyword returns a canned `offlineAI` response; no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/ai.js src/ui/views.js
git commit -m "feat(ai): extract AI tutor module (aiSend, offlineAI, prompts)"
```

---

### Task 7: Compiler pure logic — `normalize` and `matchesExpected`

**Files:**
- Create: `src/features/compiler.js`, `tests/compiler.test.js`

**Interfaces:**
- Produces:
  - `normalize(s)` → normalized string for output comparison.
  - `matchesExpected(actual, expected)` → boolean.

- [ ] **Step 1: Write the failing tests**

Create `tests/compiler.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { normalize, matchesExpected } from '../src/features/compiler.js';

describe('normalize', () => {
  it('trims trailing whitespace per line and trailing newlines', () => {
    expect(normalize('hi  \nworld\n\n')).toBe('hi\nworld');
  });
  it('normalizes CRLF', () => {
    expect(normalize('a\r\nb')).toBe('a\nb');
  });
});

describe('matchesExpected', () => {
  it('matches identical normalized output', () => {
    expect(matchesExpected('Hello, World!\n', 'Hello, World!')).toBe(true);
  });
  it('ignores trailing whitespace differences', () => {
    expect(matchesExpected('x   \ny', 'x\ny')).toBe(true);
  });
  it('returns true when there is no expected output', () => {
    expect(matchesExpected('anything', '')).toBe(true);
  });
  it('returns false on real mismatch', () => {
    expect(matchesExpected('5', '6')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `normalize`/`matchesExpected` not exported.

- [ ] **Step 3: Implement the pure logic in `src/features/compiler.js`**

```js
export function normalize(s) {
  return String(s)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

export function matchesExpected(actual, expected) {
  if (!expected) return true;
  return normalize(actual) === normalize(expected);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/compiler.js tests/compiler.test.js
git commit -m "feat(compiler): add output normalize/match helpers"
```

---

### Task 8: Compiler — in-browser JavaScript runner

**Files:**
- Modify: `src/features/compiler.js`, `tests/compiler.test.js`

**Interfaces:**
- Produces: `runJS(code)` → `{ stdout: string, stderr: string, exitCode: number }`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/compiler.test.js`:

```js
import { runJS } from '../src/features/compiler.js';

describe('runJS', () => {
  it('captures console.log output', () => {
    const r = runJS('console.log("hi"); console.log(1, 2);');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toBe('hi\n1 2');
    expect(r.stderr).toBe('');
  });

  it('routes console.error to stderr', () => {
    const r = runJS('console.error("boom");');
    expect(r.stderr).toBe('boom');
  });

  it('stringifies objects', () => {
    const r = runJS('console.log({a:1});');
    expect(r.stdout).toBe('{"a":1}');
  });

  it('captures syntax errors with exitCode 1', () => {
    const r = runJS('console.log(');
    expect(r.exitCode).toBe(1);
    expect(r.stderr.length).toBeGreaterThan(0);
  });

  it('captures runtime errors with exitCode 1', () => {
    const r = runJS('throw new Error("nope");');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('nope');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `runJS` not exported.

- [ ] **Step 3: Implement `runJS` in `src/features/compiler.js`**

```js
function fmt(arg) {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.stack || arg.message;
  try { return JSON.stringify(arg); } catch (e) { return String(arg); }
}

export function runJS(code) {
  const stdout = [];
  const stderr = [];
  const sandboxConsole = {
    log: (...a) => stdout.push(a.map(fmt).join(' ')),
    info: (...a) => stdout.push(a.map(fmt).join(' ')),
    debug: (...a) => stdout.push(a.map(fmt).join(' ')),
    warn: (...a) => stdout.push(a.map(fmt).join(' ')),
    error: (...a) => stderr.push(a.map(fmt).join(' ')),
  };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', `"use strict";\n${code}`);
    fn(sandboxConsole);
    return { stdout: stdout.join('\n'), stderr: stderr.join('\n'), exitCode: 0 };
  } catch (e) {
    return { stdout: stdout.join('\n'), stderr: fmt(e), exitCode: 1 };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `runJS` cases green.

- [ ] **Step 5: Commit**

```bash
git add src/features/compiler.js tests/compiler.test.js
git commit -m "feat(compiler): in-browser JS runner with captured console"
```

---

### Task 9: Piston proxy `api/run.js` + remote dispatch

**Files:**
- Create: `api/run.js`, `tests/run.test.js`
- Modify: `src/features/compiler.js`

**Interfaces:**
- Produces:
  - `validateInput(language, code, runtimes)` (exported from `api/run.js`) → `{ ok: true } | { ok: false, status, error }`.
  - `api/run.js` default export — Vercel handler using `validateInput` + `RUNTIMES`.
  - `runRemote(language, code)` in `src/features/compiler.js` → `{ stdout, stderr, exitCode }` (POSTs to `/api/run`).

- [ ] **Step 1: Write failing tests for `validateInput`**

Create `tests/run.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { validateInput, RUNTIMES } from '../api/run.js';

describe('validateInput', () => {
  it('accepts a supported language with valid code', () => {
    expect(validateInput('python', 'print(1)', RUNTIMES)).toEqual({ ok: true });
  });
  it('rejects an unsupported language with 400', () => {
    const r = validateInput('brainfuck', 'x', RUNTIMES);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });
  it('rejects non-string inputs with 400', () => {
    expect(validateInput(null, 'x', RUNTIMES).status).toBe(400);
    expect(validateInput('python', 42, RUNTIMES).status).toBe(400);
  });
  it('rejects oversized code with 413', () => {
    const big = 'x'.repeat(8001);
    expect(validateInput('python', big, RUNTIMES).status).toBe(413);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `api/run.js` missing or exports absent.

- [ ] **Step 3: Implement `api/run.js`**

> **Verify versions** before finalizing: open `https://emkc.org/api/v2/piston/runtimes` and adjust each `[language, version]` to an exact installed version. The values below are concrete defaults; correct any that 404.

```js
export const MAX_CODE = 8000;
export const TIMEOUT_MS = 6000;

// [pistonLanguage, pistonVersion] keyed by our LANGS id.
// Verify each version against https://emkc.org/api/v2/piston/runtimes
export const RUNTIMES = {
  python:      ['python',     '3.10.0'],
  typescript:  ['typescript', '5.0.3'],
  java:        ['java',       '15.0.2'],
  go:          ['go',         '1.16.2'],
  rust:        ['rust',       '1.50.0'],
  cpp:         ['c++',        '10.2.0'],
  csharp:      ['c#',         '9.0.0'],
  swift:       ['swift',      '5.3.3'],
  kotlin:      ['kotlin',     '1.8.20'],
  ruby:        ['ruby',       '3.0.0'],
  php:         ['php',        '8.0.2'],
  dart:        ['dart',       '2.16.0'],
  lua:         ['lua',        '5.4.3'],
  r:           ['r',          '4.0.2'],
};

export function validateInput(language, code, runtimes) {
  if (typeof language !== 'string' || typeof code !== 'string') {
    return { ok: false, status: 400, error: 'Missing language or code' };
  }
  if (!runtimes[language]) {
    return { ok: false, status: 400, error: 'Unsupported language' };
  }
  if (code.length > MAX_CODE) {
    return { ok: false, status: 413, error: 'Code too large' };
  }
  return { ok: true };
}

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston/execute';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { language, code } = req.body || {};
  const v = validateInput(language, code, RUNTIMES);
  if (!v.ok) return res.status(v.status).json({ error: v.error });

  const [pistonLang, version] = RUNTIMES[language];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const pistonRes = await fetch(PISTON_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: pistonLang,
        version,
        files: [{ name: 'main', content: code }],
        compile_timeout: 8000,
        run_timeout: 4000,
      }),
    });
    const data = await pistonRes.json().catch(() => ({}));
    if (!pistonRes.ok) return res.status(502).json({ error: 'Execution service error' });
    const run = data.run || {};
    return res.status(200).json({
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      exitCode: typeof run.code === 'number' ? run.code : 0,
    });
  } catch (e) {
    if (e.name === 'AbortError') return res.status(504).json({ error: 'Execution timed out' });
    return res.status(500).json({ error: 'Execution failed' });
  } finally {
    clearTimeout(timer);
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `validateInput` cases green.

- [ ] **Step 5: Add `runRemote` to `src/features/compiler.js`**

```js
export async function runRemote(language, code) {
  try {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { stdout: '', stderr: data.error || 'Execution failed', exitCode: 1 };
    }
    return {
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      exitCode: typeof data.exitCode === 'number' ? data.exitCode : 0,
    };
  } catch (e) {
    return { stdout: '', stderr: String(e.message || e), exitCode: 1 };
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add api/run.js tests/run.test.js src/features/compiler.js
git commit -m "feat(compiler): add Piston proxy /api/run and remote dispatch"
```

---

### Task 10: Compiler — HTML/CSS iframe preview

**Files:**
- Modify: `src/features/compiler.js`

**Interfaces:**
- Produces: `runHTML(code)` → `{ rendered: string }` where `rendered` is an `srcdoc` string for an `<iframe>`.

- [ ] **Step 1: Implement `runHTML` in `src/features/compiler.js`**

```js
export function runHTML(code) {
  // Wrap bare CSS/HTML so it always renders in the preview iframe.
  const hasHtmlTag = /<html[\s>]/i.test(code);
  const doc = hasHtmlTag
    ? code
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Inter,system-ui,sans-serif;color:#0b0c10;background:#fff;padding:16px;}</style></head><body>${code}</body></html>`;
  return { rendered: doc };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/compiler.js
git commit -m "feat(compiler): HTML/CSS iframe preview runner"
```

---

### Task 11: Wire the compiler into `runCode()` + output panel + XP gating (completes Phase 1)

**Files:**
- Modify: `src/ui/views.js`, `src/state.js` (export `recordActivity`, `todayISO` already exported)

**Interfaces:**
- Consumes: `runJS`, `runHTML`, `runRemote`, `matchesExpected` from `features/compiler.js`; `recordActivity`, `todayISO`, `saveP` from `state.js`.
- Produces: a real `runCode()` that executes learner code, shows output, and grants XP only when expected output matches.

- [ ] **Step 1: Route execution by language in `src/ui/views.js`**

Add imports at the top of `views.js`:

```js
import { runJS, runHTML, runRemote, matchesExpected } from '../features/compiler.js';
import P, { saveP, recordActivity, todayISO } from '../state.js';
```

Replace the existing `runCode()` stub with a real implementation. Keep the existing editor-read and starter-empty guard; add an output panel render and XP gating:

```js
let lesRan = false, lesCode = '';

async function runCode() {
  const ed = document.getElementById('ced');
  if (ed) lesCode = ed.value;
  const starter = (curLesson.starter || '').trim();
  if (!lesCode.trim() || lesCode.trim() === starter) { toast('✏️ Write your code first!'); return; }

  const lang = curLang; // the active language id (set in openCourse/openLesson)
  let result;
  if (lang === 'javascript') {
    result = runJS(lesCode);
  } else if (lang === 'html' || lang === 'css') {
    result = runHTML(lesCode); // { rendered }
  } else {
    result = await runRemote(lang, lesCode);
  }
  lesRan = true;
  window.__lastRun = result; // renderLesBody reads this for the output panel
  renderLesBody();
}

// expose for inline onclick handlers in the existing markup
window.runCode = runCode;
```

- [ ] **Step 2: Render the output panel inside `renderLesBody`**

In `renderLesBody`, after the editor block, render output based on `window.__lastRun`:

```js
const r = window.__lastRun;
let outPanel = '';
if (r) {
  if (r.rendered) {
    outPanel = `<iframe class="code-out" srcdoc="${escapeAttr(r.rendered)}" sandbox="allow-scripts"></iframe>`;
  } else {
    const ok = r.exitCode === 0;
    outPanel = `<pre class="code-out ${ok ? '' : 'err'}">${escapeHtml(r.stdout || '')}${r.stderr ? '\n// error: ' + escapeHtml(r.stderr) : ''}</pre>`;
  }
}
```

Add two tiny helpers in `components.js` (and import into `views.js`):

```js
export function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
export function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}
```

- [ ] **Step 3: Gate XP on output match in `claimXP()` (or the existing completion path)**

Where the app currently does `P.done[les.id]=true; P.xp+=les.xp; saveP();`, add streak + match gating:

```js
function completeLesson(les) {
  if (P.done[les.id]) return;
  const r = window.__lastRun;
  const passed = r
    ? (r.rendered ? true : (r.exitCode === 0 && matchesExpected(r.stdout, les.out)))
    : false;
  if (les.out && !passed) { toast('Output doesn't match yet — keep trying! 💪'); return; }
  P.done[les.id] = true;
  P.xp += les.xp;
  recordActivity(P, todayISO());
  saveP();
  showXP(les.xp);
  updNav();
}
```

Wire `completeLesson` into whichever button currently finalizes a lesson (the existing `claimXP`/quiz-submit flow). Keep the existing quiz (`subQ`) logic unchanged.

- [ ] **Step 4: Add `.code-out` styles to `src/styles/main.css`**

```css
.code-out{background:#0b0c10;border:1px solid var(--line);border-radius:8px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:13px;color:#9FFFE0;margin-top:12px;white-space:pre-wrap;word-break:break-word;min-height:40px;}
.code-out.err{color:#ff6b6b;}
iframe.code-out{width:100%;min-height:160px;background:#fff;border-radius:8px;}
```

- [ ] **Step 5: Verify the compiler end-to-end (manual)**

Run: `vercel dev` (so `/api/run` resolves)
- Open a **JavaScript** lesson → type wrong code (e.g. `console.log(`) → Run → red error shown.
- Type correct code → Run → output matches `out` → claim XP.
- Open a **Python** lesson → run `print("Hello, World!")` → real stdout from Piston.
- Open an **HTML** lesson → Run → iframe preview renders.

- [ ] **Step 6: Commit**

```bash
git add src/ui/views.js src/ui/components.js src/styles/main.css
git commit -m "feat(compiler): wire real runCode with output panel and XP gating"
```

---

### Task 12: Custom cursor module with OS-hide (Phase 2)

**Files:**
- Create: `src/features/cursor.js`, `tests/cursor.test.js`
- Modify: `src/main.js`, `src/ui/views.js` (settings toggle), `src/styles/main.css`

**Interfaces:**
- Produces:
  - `shouldEnableCustomCursor(setting, prefersReducedMotion, isTouch)` → boolean (pure, tested).
  - `initCursor()` → reads `P.settings.customCursor`, applies/removes `cursor:none`, starts/stops the rAF dot.

- [ ] **Step 1: Write failing tests for `shouldEnableCustomCursor`**

Create `tests/cursor.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { shouldEnableCustomCursor } from '../src/features/cursor.js';

describe('shouldEnableCustomCursor', () => {
  it('enabled when setting on, no reduced motion, not touch', () => {
    expect(shouldEnableCustomCursor(true, false, false)).toBe(true);
  });
  it('disabled when setting off', () => {
    expect(shouldEnableCustomCursor(false, false, false)).toBe(false);
  });
  it('disabled under prefers-reduced-motion', () => {
    expect(shouldEnableCustomCursor(true, true, false)).toBe(false);
  });
  it('disabled on touch/coarse pointers', () => {
    expect(shouldEnableCustomCursor(true, false, true)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `shouldEnableCustomCursor` not exported.

- [ ] **Step 3: Implement `src/features/cursor.js`**

```js
import P from '../state.js';

export function shouldEnableCustomCursor(setting, prefersReducedMotion, isTouch) {
  if (!setting) return false;
  if (prefersReducedMotion) return false;
  if (isTouch) return false;
  return true;
}

let dot = null, ring = null, rafId = null;
let mx = 0, my = 0, cx = 0, cy = 0;

function loop() {
  cx += (mx - cx) * 0.18;
  cy += (my - cy) * 0.18;
  if (dot) { dot.style.transform = `translate(${cx}px, ${cy}px)`; }
  if (ring) { ring.style.transform = `translate(${cx}px, ${cy}px)`; }
  rafId = requestAnimationFrame(loop);
}

export function initCursor() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const enabled = shouldEnableCustomCursor(P.settings.customCursor, reduce, touch);

  if (enabled && !dot) {
    dot = document.createElement('div');
    dot.className = 'syn-cursor-dot';
    ring = document.createElement('div');
    ring.className = 'syn-cursor-ring';
    document.body.append(dot, ring);
    document.documentElement.classList.add('syn-cursor-on');
    window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });
    loop();
  } else if (!enabled && dot) {
    cancelAnimationFrame(rafId);
    dot.remove(); ring.remove();
    dot = ring = null;
    document.documentElement.classList.remove('syn-cursor-on');
  }
  return enabled;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Add cursor CSS to `src/styles/main.css`**

```css
.syn-cursor-on, .syn-cursor-on *{cursor:none !important;}
.syn-cursor-on input, .syn-cursor-on textarea{cursor:text !important;}  /* keep caret usability */
.syn-cursor-dot, .syn-cursor-ring{position:fixed;top:0;left:0;width:8px;height:8px;border-radius:50%;background:#5B6BF8;pointer-events:none;z-index:99999;transform:translate(-100px,-100px);will-change:transform;}
.syn-cursor-ring{width:30px;height:30px;background:transparent;border:1.5px solid rgba(91,107,248,.6);transition:width .12s,height .12s,background .12s;}
.syn-cursor-on a:hover ~ .syn-cursor-ring, .syn-cursor-on button:hover ~ .syn-cursor-ring{width:40px;height:40px;}
@media (prefers-reduced-motion: reduce){ .syn-cursor-dot,.syn-cursor-ring{display:none !important;} }
```

- [ ] **Step 6: Initialize cursor on load in `src/main.js`**

```js
import P from './state.js';
import { updNav } from './ui/components.js';
import { nav } from './ui/router.js';
import { initCursor } from './features/cursor.js';

updNav();
initCursor();
nav('home');
```

- [ ] **Step 7: Add a Settings toggle that re-inits the cursor**

In `src/ui/views.js` settings render, add a checkbox bound to `P.settings.customCursor`; on change call `saveP()` then `initCursor()`:

```js
// inside saveSettings() or a new handler:
const cb = document.getElementById('set-cursor');
if (cb) {
  P.settings.customCursor = cb.checked;
  saveP();
  import('../features/cursor.js').then(({ initCursor }) => initCursor());
}
```

(Add the matching `<input type="checkbox" id="set-cursor">` to the settings modal markup in `index.html`, checked by default.)

- [ ] **Step 8: Verify cursor behavior (manual)**

Run: `npm run dev`
- Native cursor hidden; custom dot+ring follow pointer.
- Focus a text input/textarea → text caret shows (native cursor reappears there).
- Toggle the Settings switch off → native cursor returns; on → hides again.

- [ ] **Step 9: Commit**

```bash
git add src/features/cursor.js tests/cursor.test.js src/main.js src/ui/views.js src/styles/main.css index.html
git commit -m "feat(cursor): custom cursor with OS-hide, guards, and toggle"
```

---

### Task 13: Remove `syntaxia.html`, update README, verify build

**Files:**
- Delete: `syntaxia.html`
- Modify: `README.md`

- [ ] **Step 1: Delete the old single-file app**

Run: `git rm syntaxia.html`

- [ ] **Step 2: Update `README.md` Quick Start**

Replace the Quick Start section with:

```markdown
## 🚀 Quick Start

```bash
npm install

# Frontend only (fast HMR; AI/compiler fall back to offline/in-browser):
npm run dev

# Full stack incl. /api (AI tutor + Piston compiler):
vercel dev   # requires .env.local with GROQ_API_KEY=gsk_...

# Build & test:
npm run build
npm test
```

Set `GROQ_API_KEY` in `.env.local` (local) and Project Settings → Environment Variables (Vercel).
Code execution uses the public Piston endpoint by default; set `PISTON_URL` to self-host.
```

- [ ] **Step 3: Verify production build**

Run: `npm run build`
Expected: `dist/` produced; no errors.

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy syntaxia.html, update README for Vite workflow"
```

---

### Task 14: Push to GitHub and deploy to Vercel

**Files:** none (deploy only)

- [ ] **Step 1: Push to GitHub**

Run: `git push origin main`
Expected: all commits pushed to `github.com/parthkamalakar/Syntaxia`.

- [ ] **Step 2: Deploy to Vercel**

Run: `vercel --prod`
Expected: Vercel builds (`npm run build`), deploys, prints a production URL.

- [ ] **Step 3: Smoke-test the deployed app**

Open the production URL and confirm:
- Landing page renders; nav streak shows the live value.
- A JavaScript lesson runs code with real output and rejects bad code.
- A Python lesson runs via Piston and returns real output.
- Custom cursor hides the OS cursor; toggle works.
- AI tutor responds (Groq is live in production).

- [ ] **Step 4: Note deployment specifics back to the user**

Report the production URL, confirm `GROQ_API_KEY` is set in Vercel env, and flag that `PISTON_URL` can be set later to self-host.

---

## Self-Review Notes

- **Spec coverage (Phases 0–2 + foundation):** Phase 0 (streak) → Task 4 + dynamic nav (Task 5). Phase 1 (compiler) → Tasks 7–11 (JS runner, Piston proxy, HTML preview, wiring, XP gating). Phase 2 (cursor) → Task 12. Vite migration → Tasks 1–3, 5–6, 13. Deploy → Task 14. Avatar builder, animations, and full content authoring are deliberately deferred to follow-on plans (out of this plan's scope by design).
- **Type/name consistency:** `recordActivity(P, todayISO)`, `runJS`/`runHTML`/`runRemote`, `matchesExpected`/`normalize`, `shouldEnableCustomCursor`/`initCursor`, `validateInput`/`RUNTIMES` — names match across tasks and tests.
- **Extraction tasks** describe moves by marker (not line number) and show glue/import code; new logic is fully specified with TDD. No placeholder text remains.
