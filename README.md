# Syntaxia ⚡ — Learn to Code with AI

<div align="center">

![Syntaxia Banner](https://img.shields.io/badge/Syntaxia-Learn%20to%20Code-5B6BF8?style=for-the-badge&logo=lightning&logoColor=white)
![Languages](https://img.shields.io/badge/Languages-20%2B-10B981?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI%20Powered-Groq%20API-A855F7?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)

**An interactive coding learning platform powered by Groq AI.**
Learn Python, JavaScript, Java, SQL, and 20+ more languages with lessons, a real in-browser/compiler, leagues, XP, and a Mission Lab that turns project ideas into guided build paths.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Tutor** | Powered by Groq — gives hints, explains concepts, reviews code |
| ▶️ **Real Code Execution** | JavaScript/HTML/CSS run in-browser; Python, Java, C++, Go, Rust & more run via a serverless Judge0 proxy — with real output and syntax errors |
| 📚 **20+ Languages** | Python, JavaScript, Java, SQL, C++, Rust, Go, Swift, and more |
| 🧭 **Mission Lab** | Turns an idea into a checkpoint-based mini-project with AI guidance |
| 🏆 **10 Leagues** | Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster → Legend → Mythic → Radiant |
| 🛒 **Shop & Currency** | Earn 🪙 coins & 💎 gems, spend them on themes, cursors, pets, titles & consumables (Streak Freeze/Repair) |
| 🏅 **Badges** | Unlockable achievements (First Code, Python/JS mastery, Collector, Legend Status…) |
| 📋 **Quests** | Daily & weekly quests that reward XP and coins |
| ⚡ **XP & Levels** | Earn XP when your code's output matches the expected result |
| 🔥 **Streaks** | Real daily streak tracking (increment on consecutive days) |
| 🎨 **Avatar Builder** | Duolingo-style avatar builder (DiceBear) |
| ✨ **Animations** | Confetti, streak-flame pulse, level-up flash |
| 🖱️ **Custom Cursor** | OS cursor hidden behind a custom cursor (toggleable, motion-friendly) |
| 📱 **Responsive** | Works on desktop and mobile |

---

## 🚀 Quick Start

```bash
git clone https://github.com/parthkamalakar/Syntaxia.git
cd Syntaxia
npm install
```

**Frontend only** (fast HMR; AI & server-run languages fall back gracefully):
```bash
npm run dev
```

**Full stack** (AI Tutor + Judge0 execution, via Vercel's serverless functions):
```bash
# add GROQ_API_KEY=gsk_... to .env.local first
vercel dev
```

**Build & test:**
```bash
npm run build   # outputs to dist/
npm test        # Vitest — pure-logic unit tests
```

---

## 🔑 Environment Variables

Set these in `.env.local` (local) and Vercel Project Settings → Environment Variables (production).

| Variable | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | Yes | Groq key for the AI Tutor (`/api/chat`). Never exposed to the client. |
| `GROQ_MODEL` | No | Override the default `llama-3.1-8b-instant`. |
| `EXEC_URL` | No | Override the code-execution endpoint (defaults to the public Judge0 CE instance). Set this to a self-hosted Judge0/Piston for higher limits. |

Get a Groq key at [console.groq.com/keys](https://console.groq.com/keys).

---

## 📁 Project Structure

```
Syntaxia/
├── index.html              Vite entry
├── vite.config.js          Vite + Vitest config
├── vercel.json             framework: vite → dist
├── src/
│   ├── main.js             bootstrap
│   ├── state.js            localStorage state + daily streak logic
│   ├── data/               languages, courses, gamification, kb (pure data)
│   ├── ui/                 router + views + components (app.js)
│   ├── features/
│   │   ├── compiler.js     in-browser JS/HTML/CSS runner + remote dispatch
│   │   ├── cursor.js       custom cursor + OS hide
│   │   └── ai.js           offline AI knowledge base + system prompts
│   └── styles/             main.css, extras.css
├── api/
│   ├── chat.js             Vercel serverless Groq proxy
│   └── run.js              Vercel serverless code-execution proxy (Judge0)
└── tests/                  Vitest unit tests
```

The app is vanilla ES modules bundled by Vite — no framework. Progress is saved in `localStorage`; AI and code-execution calls stay server-side.

---

## ▶️ Code Execution

- **JavaScript** runs in-browser (sandboxed `Function` with a captured `console`).
- **HTML / CSS** render into a live `<iframe>` preview.
- **Python, TypeScript, Java, C++, Go, Rust, Ruby, PHP, Swift, Kotlin, Lua, Dart, R, C#** run through `/api/run` → the public **Judge0 CE** instance (no key needed; rate-limited).
- **SQL / Phaser** show the expected output as a reference (they need a database/runtime not available in-browser).

XP is granted when your code's output matches the lesson's expected output (or the lesson has no expected output and runs successfully).

> The public Piston API became whitelist-only in Feb 2026, so execution uses Judge0. Point `EXEC_URL` at a self-hosted Judge0 or Piston for production scale.

---

## 🚢 Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or import the GitHub repo on [vercel.com](https://vercel.com) → **Add New Project** → Deploy. Set `GROQ_API_KEY` in Project Settings → Environment Variables.

---

## 🏆 League System

Climb through 10 tiers based on total XP. Your leaderboard filters to the competitors in your current tier.

| League | XP Required | Badge |
|---|---|---|
| Bronze | 0 XP | 🥉 |
| Silver | 500 XP | 🥈 |
| Gold | 1,200 XP | 🥇 |
| Platinum | 2,200 XP | 💿 |
| Diamond | 3,500 XP | 💎 |
| Master | 5,000 XP | 🔮 |
| Grandmaster | 7,000 XP | 👑 |
| Legend | 9,500 XP | 🐉 |
| Mythic | 12,500 XP | 🔥 |
| Radiant | 16,000 XP | ⚡ |

---

## 🛠️ Tech Stack

- **Frontend** — Vanilla HTML/CSS/JS ES modules, bundled with **Vite**
- **AI** — Groq Chat Completions API (`llama-3.1-8b-instant` default)
- **Code execution** — in-browser runner + **Judge0 CE** proxy
- **Tests** — Vitest (pure-logic unit tests)
- **Storage** — Browser `localStorage`
- **Avatars** — DiceBear API
- **Deployment** — Vercel (static + serverless)

---

## 🤝 Contributing

Pull requests welcome! Ideas:

- [ ] Deeper authored curricula for more languages (topic graph + syntax map)
- [x] Avatar builder UI (Duolingo-style) — shipped
- [x] XP/confetti animations — shipped
- [x] Shop, badges, quests & currency economy — shipped
- [ ] Self-hosted Judge0 for higher execution limits
- [ ] Server-backed leaderboards & friend leagues (currently seeded locally)

---

## 📄 License

MIT License — free to use, modify, and distribute.
