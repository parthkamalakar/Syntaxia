# Syntaxia ⚡ — Learn to Code with AI

<div align="center">

![Syntaxia Banner](https://img.shields.io/badge/Syntaxia-Learn%20to%20Code-5B6BF8?style=for-the-badge&logo=lightning&logoColor=white)
![Languages](https://img.shields.io/badge/Languages-20%2B-10B981?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI%20Powered-Groq%20API-A855F7?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)

**An interactive, gamified coding learning platform powered by Groq AI.**  
Learn Python, JavaScript, Java, SQL, and 20+ more languages — with a live AI tutor, leagues, friends, and XP rewards.

[🚀 Live Demo](#) · [📖 How to Use](#how-to-use) · [🔑 API Setup](#api-key-setup) · [🚢 Deploy](#deploy-to-vercel)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Tutor** | Powered by Groq — gives hints, explains concepts, reviews code |
| 📚 **20+ Languages** | Python, JavaScript, Java, SQL, C++, Rust, Go, Swift, and more |
| 🏆 **5 Leagues** | Rookie → Emerald → Diamond → Amethyst → Gold |
| 👥 **Friends** | Add friends, see their XP, compete on the leaderboard |
| ⚡ **XP & Levels** | Earn XP for every lesson, level up, climb the ranks |
| 🪙 **Token Shop** | Buy power-ups like 2× XP Boost, Streak Shield, Hint Packs |
| 🔥 **Streaks** | Daily streak tracking to keep you motivated |
| 🌑 **Moonshot UI** | Cursor-tracking orb, animated landing page, pure black theme |
| 📱 **Responsive** | Works on desktop and mobile |
| 💾 **No Backend** | All progress saved in `localStorage` — no account needed |

---

## 🖥️ Preview

```
Landing Page → Moonshot-style black orb, animated scrolling text, cursor dot
App → Home, Courses, Leagues, Friends, Profile, AI Tutor panel
Lesson Flow → Learn → Code → Quiz → Earn XP
```

---

## 🚀 Quick Start

### Option 1 — Local with AI Tutor
```bash
# Download or clone the repo
git clone https://github.com/YOUR_USERNAME/Syntaxia.git
cd Syntaxia

# Add GROQ_API_KEY to .env.local first, then run:
vercel dev
# Then open the local Vercel URL
```

### Option 2 — Static preview only
1. Open `syntaxia.html` in VS Code
2. Click **"Go Live"** in the bottom right corner
3. Opens at `http://127.0.0.1:5500`
4. The AI Tutor will not work in this mode because `/api/chat` is a Vercel serverless function.

> ⚠️ **Do not open `syntaxia.html` by double-clicking it.** The AI Tutor uses the `/api/chat` serverless endpoint, so run it with Vercel locally or deploy it to Vercel.

---

## 🔑 Groq Setup

Syntaxia uses the **Groq API** for the AI Tutor through a Vercel serverless function. The API key must be stored on the server, never in `syntaxia.html` or browser `localStorage`.

**Step 1** — Create a Groq key at [console.groq.com/keys](https://console.groq.com/keys)

**Step 2** — Add the key to Vercel:

```bash
GROQ_API_KEY=gsk_...
```

In Vercel Dashboard → Project Settings → Environment Variables.

Optional: set `GROQ_MODEL` to override the default `llama-3.1-8b-instant` model.

**Local testing** — create `.env.local`:

```bash
GROQ_API_KEY=gsk_...
```

Then run:

```bash
vercel dev
```

---

## 📁 Project Structure

```
Syntaxia/
├── syntaxia.html       # The entire app — single file, no dependencies
├── api/
│   └── chat.js         # Vercel serverless Groq proxy
├── vercel.json         # Vercel config
└── README.md
```

Everything in the app UI lives in one `syntaxia.html` file. The only backend code is `api/chat.js`, which keeps the Groq key private on Vercel.

---

## 🚢 Deploy to Vercel

### With Vercel CLI
```bash
npm install -g vercel
vercel
```

### With GitHub (recommended)
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Click **Deploy**

Your app will be live at `https://your-app.vercel.app` in ~30 seconds.

> **Note:** The AI Tutor uses the `/api/chat` serverless proxy instead of calling Groq directly from the browser. Add your API key as an environment variable:
> ```
> GROQ_API_KEY=gsk_...
> ```
> In Vercel Dashboard → Project Settings → Environment Variables

---

## 📚 Courses Available

| Language | Lessons | Level |
|---|---|---|
| 🐍 Python | 6 | Beginner → Advanced |
| 🟨 JavaScript | 6 | Beginner → Advanced |
| 🌐 HTML | 6 | Beginner → Advanced |
| ☕ Java | 6 | Beginner → Advanced |
| 🎨 CSS | 6 | Beginner → Advanced |
| 🗄️ SQL | 6 | Beginner → Advanced |
| 💙 C++ | 3 | Beginner → Advanced |
| 🔷 TypeScript | 3 | Beginner → Advanced |
| 🐹 Go | 3 | Beginner → Advanced |
| 🦀 Rust | 3 | Beginner → Advanced |
| 🦅 Swift | 3 | Beginner → Advanced |
| 🎯 Kotlin | 3 | Beginner → Advanced |
| 💎 Ruby | 3 | Beginner → Advanced |
| 🐘 PHP | 3 | Beginner → Advanced |
| 💚 C# | 3 | Beginner → Advanced |
| ⚡ Phaser | 3 | Beginner → Advanced |
| + 4 more | ... | ... |

---

## 🏆 League System

| League | XP Required | Badge |
|---|---|---|
| Rookie | 0 XP | 🥉 |
| Emerald | 1,000 XP | 💚 |
| Diamond | 3,000 XP | 💎 |
| Amethyst | 6,000 XP | 💜 |
| Gold | 10,000 XP | 🥇 |

---

## 🪙 Token Shop

Earn **10 tokens** per lesson completed. Spend them on:

| Power-Up | Cost | Effect |
|---|---|---|
| ⚡ 2× XP Boost | 100 🪙 | Double XP for next 5 lessons |
| 🛡️ Streak Shield | 150 🪙 | Protect streak for 1 day |
| 💡 Hint Pack | 75 🪙 | 10 AI hints |
| ⏭️ Lesson Skip | 200 🪙 | Skip 1 lesson and still earn XP |

---

## 🛠️ Tech Stack

- **Frontend** — Vanilla HTML, CSS, JavaScript (no framework)
- **AI** — Groq Chat Completions API (`llama-3.1-8b-instant` by default)
- **Storage** — Browser `localStorage` (no database)
- **Avatars** — DiceBear API
- **Deployment** — Vercel (static + serverless)
- **Fonts** — Inter, JetBrains Mono (Google Fonts)

---

## 🤝 Contributing

Pull requests are welcome! Some ideas:

- [ ] Add more languages (Scala, Haskell, Elixir...)
- [ ] Add more lessons per language
- [ ] Real-time code execution (Piston API)
- [ ] Multiplayer challenges
- [ ] Dark/light theme toggle
- [ ] Mobile app (PWA)

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ and ⚡ by **Syntaxia**  
Powered by [Groq](https://groq.com)

</div>
[README.md](https://github.com/user-attachments/files/29403527/README.md)
