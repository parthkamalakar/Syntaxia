# Syntaxia Revamp — Design Spec

**Date:** 2026-07-22
**Status:** Approved (pending user spec review)
**Stack decision:** Vite + modular vanilla JS (no framework rewrite)
**Repo:** `github.com/parthkamalakar/Syntaxia`, branch `main`

## 1. Goals

Address seven requested workstreams:

1. **Streak bug** — currently hardcoded to day 3; new users should start at 0/day 1 and track real daily activity.
2. **Real compiler** — `runCode()` is a stub; the Courses editor must execute code and show real stdout/stderr/syntax errors.
3. **Hide OS cursor** — both the native cursor and the custom cursor currently show; only the app cursor should be visible.
4. **Avatar customization** — Duolingo-style avatar builder (currently a single fixed DiceBear seed).
5. **More course content** — comprehensive coverage "to the full end" of each programming language.
6. **XP / more animations** — XP-gain animations and richer motion.
7. **Stack upgrade + ship** — improve the project structure and push to GitHub + Vercel.

## 2. Non-goals

- No React/Next.js rewrite (deliberately — vanilla JS kept).
- No backend database (progress stays in `localStorage`; AI/run calls stay serverless-proxy).
- No hardening of the in-browser JS sandbox as a security boundary (see §7).
- No Piston self-hosting in this phase (public endpoint now, self-host later via config swap).
- No automated test suite introduced (project has none; verification is manual per phase).

## 3. Architecture — stack migration

Decompose the single `syntaxia.html` (~1600 lines, one inline `<script>`) into ES modules under Vite.

### 3.1 Target file tree

```
package.json
vite.config.js
index.html              Vite entry (replaces syntaxia.html as the served page)
vercel.json             framework: vite; build: npm run build; output: dist
.gitignore              node_modules, dist, .env*, .vercel
src/
  main.js               bootstrap: hydrate state, init cursor, mount router
  state.js              P, saveP(), hydration, streak logic, avatar persistence
  data/
    languages.js        LANGS (19 languages)
    courses.js          LESSONS — deep authored + structured generator (topicGraph + syntaxMap)
    gamification.js     LEAGUES, POWERUPS, BADGES
    kb.js               offline AI knowledge base (KB)
  ui/
    router.js           nav(), setAILessonCtx(), view dispatch
    views.js            renderHome/Courses/Mission/LB/Profile/Lesson
    components.js       cards, modal, toast, XP float, confetti, level-up flash
  features/
    cursor.js           custom cursor + OS-hide + reduced-motion + toggle
    avatar.js           DiceBear builder + avatar URL builder
    compiler.js         in-browser runner (JS/HTML/CSS) + Piston dispatch
    ai.js               aiSend(), offlineAI(), SYS_GEN/SYS_LES prompts
  styles/
    main.css            all styles (extracted from <style> in syntaxia.html)
api/
  chat.js               existing Groq proxy (kept as-is)
  run.js                NEW — Piston proxy (server-side, swappable endpoint)
```

### 3.2 Module responsibilities

- **state.js** owns the single persisted object `P` and is the only module that touches `localStorage['syn_prog']`. Exposes `saveP()`, `hydrate()`, and streak mutators.
- **data/** modules are pure data (constants + generators). No DOM access.
- **ui/** owns all DOM rendering. `router.js` is the single entry for view swaps; `views.js` builds views; `components.js` holds reusable DOM + animation helpers.
- **features/** are self-contained capabilities imported by `ui/` and `main.js`.
- **api/** are Vercel serverless functions (Node). `chat.js` unchanged; `run.js` new.

### 3.3 Build & deploy config

- `package.json`: `dev` → `vite`, `build` → `vite build`, `preview` → `vite preview`. Dev dependency `vite` only.
- `vercel.json`:
  ```json
  { "framework": "vite",
    "buildCommand": "npm run build",
    "outputDirectory": "dist" }
  ```
  `/api/*` auto-detected as serverless. The existing `/` → `/syntaxia.html` rewrite is removed (Vite's built `index.html` serves `/`).
- The old `syntaxia.html` is deleted once `index.html` (Vite entry) replicates its markup and imports `src/main.js`.

## 4. State model (`state.js`)

Current: `P = { done:{}, xp:0, str:3 }` persisted to `localStorage['syn_prog']`.

New shape (additive; old keys preserved, migrated on hydrate):

```js
P = {
  done: {},                 // lessonId -> true
  xp: 0,                    // total XP
  str: 0,                   // current day streak (was hardcoded 3)
  lastActive: null,         // ISO date 'YYYY-MM-DD' of last lesson completion
  avatar: {                 // chosen avatar config (Phase 3); default applied on hydrate
    style: 'avataaars',
    seed: 'user',
    bg: '0b0c10',
    options: {}             // DiceBear part overrides
  },
  settings: {
    customCursor: true      // Phase 2 toggle (escape hatch)
  }
}
```

Hydration migrates legacy objects (e.g. fills `avatar`, `settings`, `lastActive`) without dropping existing `done`/`xp`.

## 5. Phase specifications

### Phase 0 — Streak fix (small)

- Remove hardcoded `<span id="n-str">3</span>` value; render from `P.str`.
- New `recordActivity()` in `state.js`, called on lesson completion:
  - today === lastActive → streak unchanged.
  - today === lastActive + 1 day → `str += 1`.
  - else (gap or first ever) → `str = 1`.
  - always set `lastActive = today`.
- New users (`lastActive === null`) show `str = 0` until first completion, with a friendly "Start your streak today!" state in the nav.
- Nav re-renders `str` live after each completion.

### Phase 1 — Real compiler (medium-large)

**`features/compiler.js`** — `async runCode(lesson, code) -> { stdout, stderr, exitCode, rendered? }`:

- **JavaScript:** execute in a sandboxed `new Function` with a custom `console` whose `log/error/warn/info` append to an output buffer. `try/catch` captures `SyntaxError`/runtime errors into `stderr`. No access to app globals (pass only `{ console }` as scope).
- **HTML / CSS:** render into an `<iframe srcdoc>` live preview; `rendered` returns the DOM to display. (HTML lessons may pair with the JS runner when `<script>` is present.)
- **All other languages:** POST `{ language, version, files:[{content:code}] }` to `/api/run`; relay returned `run.output`/`stderr`/`exitCode`.

**`runCode()` rewrite** (replaces stub): calls `compiler.runCode`, streams output into the lesson's output panel, then compares to `lesson.out` (expected stdout, normalized). XP is granted only when output matches (or lesson has no `out` and exitCode === 0).

**Lesson schema additions:** each lesson gains `out` (expected stdout) where deterministic; lessons without deterministic output validate on exitCode 0.

**`api/run.js`** — Piston proxy contract:
- POST only; body `{ language, code }`.
- Allowlist of `language → { language, version }` runtime mappings (Python 3.x, Java, Go, Rust, C/C++, C#, Ruby, PHP, Lua, etc.).
- Caps: code ≤ 8000 chars; one file; 6s Piston timeout → 504.
- Calls `PISTON_URL` env (default `https://emkc.org/api/v2/piston/execute`).
- Returns `{ stdout, stderr, exitCode }` or `{ error }`. Never exposes internal errors verbatim.

### Phase 2 — Custom cursor, OS hidden (small, UX caveat)

**`features/cursor.js`** + `styles/main.css`:
- When enabled: apply `* { cursor: none }` to the document; show the trailing dot + a snap-to-pointer ring (ring becomes precise on hover over interactive elements).
- **Guards:** disabled when `matchMedia('(prefers-reduced-motion: reduce)').matches` OR a coarse/touch pointer (`matchMedia('(pointer: coarse)')`); disabled on `<input>`/`<textarea>` focus so the text caret and precise text editing remain usable (native cursor re-shown there).
- **Toggle:** Settings switch "Custom cursor" writes `P.settings.customCursor`; cursor module subscribes and applies/removes `cursor:none`. Default on.
- *Caveat documented:* hiding the native cursor reduces targeting precision for some users; the toggle and input-field exception are the recovery paths.

### Phase 3 — Avatar builder (medium)

**`features/avatar.js`**:
- `avatarURL(config)` builds the DiceBear URL from `style`, `seed`, `bg`, and `options` (skin, hair, eyes, mouth, facialHair, accessoriesProbability, backgroundType, etc.).
- Builder modal (opened from Profile): grouped option sets per part, click-to-apply with instant `<img>` preview, "Randomize" and "Save". Persisted to `P.avatar`.
- Style selector: avataaars, bottts, fun-emoji, thumbs, identicon (DiceBear styles with part support vary; offer those with real part options).
- Nav avatar, Profile avatar, and the user's row in the leaderboard all read from `P.avatar` via `avatarURL()`.

### Phase 4 — Animations (medium)

**`ui/components.js`** additions (all `prefers-reduced-motion` gated):
- **XP float:** `+N` rises and fades from the XP pill on gain.
- **Confetti:** lightweight `<canvas>` burst on lesson complete (no dependency).
- **Streak flame pulse:** nav flame scales/flashes when `str` increments.
- **Level-up flash:** full-screen subtle overlay on `lvl()` increase.
- **Lesson-complete celebration:** combined modal burst.
- A tiny `prefersReducedMotion()` helper short-circuits all of the above to instant state changes.

### Phase 5 — Course content (large, batched)

**`data/courses.js`**:
- **Deep authored curricula** for Python, JavaScript, HTML, CSS, SQL — extended to full topic coverage. Authoring topic spine: variables/types → operators → control flow → functions → collections/data structures → strings → errors/exceptions → OOP → modules/imports → file/async IO → standard library highlights → capstone project. Each lesson: `{ id, t, lv, xp, exp, task, starter, code, out, quiz }`.
- **Structured generator** for the remaining ~13 languages (Java, TypeScript, Go, Rust, C++, C#, Swift, Kotlin, Ruby, PHP, Dart, Lua, R, Phaser): a shared `topicGraph` (same topic spine) + per-language `syntaxMap[id]` (concrete syntax/templates per topic) produces consistent, complete lessons with `starter`/`code`/`out`/`quiz`. Replaces the current single-template generic generator.
- Every generated lesson must include `out` so Phase 1 validation works.
- Shipped in batches across multiple commits (content is the largest authoring effort).

### Phase 6 — Deploy

- Commit per phase to `main`; push `origin main` after Phase 0–2, again after 3–4, content batches, then final.
- Run `vercel --prod` (CLI v56.3.2 present) after the Vite migration to confirm the build; subsequent pushes rely on GitHub→Vercel auto-deploy if the project is linked, else re-run CLI.
- Vercel env: keep `GROQ_API_KEY`; optionally `GROQ_MODEL`. `PISTON_URL` only if/when self-hosted (defaults to public endpoint).
- Update `README.md` for the new `npm install` / `npm run dev` / `npm run build` workflow and the Piston note.

## 6. API contracts

### `/api/chat` (unchanged)
POST → Groq proxy. Kept verbatim from current `api/chat.js`.

### `/api/run` (new)
```
POST /api/run
{ "language": "python", "code": "print('hi')" }
← 200 { "stdout": "hi\n", "stderr": "", "exitCode": 0 }
← 400 { "error": "Unsupported language" }
← 504 { "error": "Execution timed out" }
```

## 7. Risks & mitigations

- **Piston public endpoint rate limits** — `/api/run` centralizes the call so the endpoint is one env swap (`PISTON_URL`) to self-host later. Document in README.
- **In-browser JS sandbox is not a security boundary** — `new Function` runs in page origin. Mitigation: pass only a captured `console`, no app globals; learner code runs the user's own input in their own browser. Acceptable for a learning app; documented as non-goal.
- **Hiding the native cursor hurts usability** — mitigated by reduced-motion + touch guards, the input-field exception, and the Settings toggle.
- **Vite deploy config change** — `/api/*` remains serverless; build verified with `vercel --prod` before relying on auto-deploy.
- **Legacy state migration** — hydrate fills new keys without dropping `done`/`xp`; streak recalculates from `lastActive`.

## 8. Verification

No automated test suite. Each phase verified manually:
- Phase 0: new user shows 0; complete a lesson → 1; reload → still 1; skip a day → resets.
- Phase 1: JS lesson shows output + syntax error on bad code; HTML renders in iframe; Python returns real stdout via `/api/run`; XP only on match.
- Phase 2: native cursor hidden on desktop, custom cursor shows; reappears in inputs; disabled under reduced-motion/touch; toggle works.
- Phase 3: avatar changes persist across reload and appear in nav/profile/leaderboard.
- Phase 4: animations fire on completion; absent under reduced-motion.
- Phase 5: each authored/generated language has a complete path; sample lessons produce expected `out`.
- Phase 6: `npm run build` succeeds; deployed app loads; AI tutor + compiler work over HTTPS.

## 9. Future / out of scope

- Self-hosted Piston or managed execution sandbox.
- Account sync / cloud progress (currently localStorage only).
- Hardened sandbox (Web Worker + CSP) for untrusted code at scale.
- Per-language proficiency tracking beyond XP/league.
