import { LANGS } from '../data/languages.js';
import { LESSONS } from '../data/courses.js';
import { LEAGUES, BADGES, LB, MISSIONS, SHOP_ITEMS, QUESTS } from '../data/gamification.js';
import P, { saveP, recordActivity, todayISO } from '../state.js';
import { SYS_GEN, SYS_LES } from '../features/ai.js';
import { runCodeForLesson, matchesExpected } from '../features/compiler.js';
import { avatarURL, AVATAR_STYLES, BG_COLORS, AVATAR_MOUTH, AVATAR_EYES, AVATAR_EYEBROWS, AVATAR_TOP, randomAvatarConfig } from '../features/avatar.js';

// ─── UI STATE ─────────────────────────────────
let curLang = null, curLesson = null, lesStep = 'learn', lesCode = '', lesRan = false;
let qSel = null, qSub = false;
let lbTab = 'bronze';
let lastRun = null;
let activeTabShop = 'themes';

// Gamified & Timed features state
let gameTimer = null;
let gamePoints = 0;
let gameActive = false;
let gameSubtype = ''; // 'debug' | 'puzzle' | 'typing'
let gameData = null;
let bossActive = false;
let bossTimerValue = 0;
let bossStageIndex = 0;
let bossHp = 100;
let bossNode = null;
let projectNode = null;
let examNode = null;
let examAnswers = [];
let examQuestionIndex = 0;

// Monaco Editor Instance
let monacoEditor = null;

// ─── INIT SYSTEM & STYLES ───────────────────────
function initAestheticBg() {
  const containers = [document.getElementById('landing'), document.getElementById('app')];
  containers.forEach(container => {
    if (!container) return;
    let bg = container.querySelector('.particles-bg');
    if (!bg) {
      bg = document.createElement('div');
      bg.className = 'particles-bg';
      container.appendChild(bg);
    }
    bg.innerHTML = '';
    // Spawn 10 floating glassmorphic particles
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = Math.random() * 80 + 30;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = Math.random() * 100 + '%';
      p.style.animationDelay = (Math.random() * 8) + 's';
      p.style.animationDuration = (Math.random() * 12 + 10) + 's';
      bg.appendChild(p);
    }
  });
}

function applyThemeAndCursor() {
  document.body.className = '';
  if (P.equippedTheme) {
    document.body.classList.add('theme-' + P.equippedTheme);
  }
  if (P.equippedCursor) {
    document.body.classList.add('cursor-' + P.equippedCursor);
  }
  // Synchronize Monaco theme if active
  if (window.monaco && monacoEditor) {
    let mTheme = 'vs-dark';
    if (P.equippedTheme === 'cyberpunk') mTheme = 'vs-dark';
    else if (P.equippedTheme === 'matrix') mTheme = 'hc-black';
    else if (P.equippedTheme === 'vaporwave') mTheme = 'vs-dark';
    window.monaco.editor.setTheme(mTheme);
  }
}

// ─── MASCOT SYSTEM ─────────────────────────────
function renderMascotSVG(mood = 'neutral') {
  let eyeColor = 'var(--accent-2, #48d8ff)';
  let mouthPath = 'M 35 60 Q 50 70 65 60'; // smile
  let bodyColor = 'var(--accent, #b7ff5a)';
  let antennaStyle = '';
  if (mood === 'happy') {
    eyeColor = '#22C55E';
    mouthPath = 'M 30 55 Q 50 80 70 55'; // wide open laugh
    antennaStyle = 'transform-origin: 50px 15px; animation: wig 0.4s infinite;';
  } else if (mood === 'sad') {
    eyeColor = '#EF4444';
    mouthPath = 'M 35 65 Q 50 55 65 65'; // frown
  } else if (mood === 'thinking') {
    eyeColor = '#F59E0B';
    mouthPath = 'M 35 60 L 65 60'; // straight line
    antennaStyle = 'transform-origin: 50px 15px; animation: blink 1s infinite;';
  } else if (mood === 'sleeping') {
    eyeColor = '#6B7280';
    mouthPath = 'M 40 60 Q 50 65 60 60';
  }
  return `
    <svg class="mascot-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <style>
        @keyframes wig { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      </style>
      <!-- Antenna -->
      <line x1="50" y1="30" x2="50" y2="15" stroke="${bodyColor}" stroke-width="4" style="${antennaStyle}" />
      <circle cx="50" cy="15" r="6" fill="${eyeColor}" style="${antennaStyle}" />
      <!-- Head -->
      <rect x="20" y="30" width="60" height="50" rx="18" fill="#1b1c26" stroke="${bodyColor}" stroke-width="4.5" />
      <!-- Ears -->
      <rect x="13" y="45" width="7" height="20" rx="3" fill="${bodyColor}" />
      <rect x="80" y="45" width="7" height="20" rx="3" fill="${bodyColor}" />
      <!-- Eyes -->
      <circle cx="38" cy="50" r="7" fill="${eyeColor}" />
      <circle cx="62" cy="50" r="7" fill="${eyeColor}" />
      <circle cx="38" cy="48" r="2.5" fill="#fff" />
      <circle cx="62" cy="48" r="2.5" fill="#fff" />
      <!-- Mouth -->
      <path d="${mouthPath}" stroke="${bodyColor}" stroke-width="3.5" fill="none" stroke-linecap="round" />
      <!-- Cheeks -->
      <circle cx="28" cy="58" r="3" fill="#ff0055" opacity="0.4" />
      <circle cx="72" cy="58" r="3" fill="#ff0055" opacity="0.4" />
    </svg>
  `;
}

// ─── AUTHENTICATION GATEWAY ─────────────────────
function initAuth() {
  if (!P.authenticated) {
    let overlay = document.getElementById('auth-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'auth-overlay';
      overlay.className = 'auth-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="auth-card glass">
        <h2 style="font-size:26px;font-weight:900;margin-bottom:8px;">Welcome to Syntaxia ⚡</h2>
        <p style="font-size:13px;color:var(--muted);margin-bottom:20px;">The AAA gamified coding learning platform.</p>
        <div style="margin-bottom:16px;">
          ${renderMascotSVG('happy')}
        </div>
        <div style="margin-bottom:14px; text-align:left;">
          <label style="font-weight:700;font-size:12px;margin-bottom:6px;display:block;">Select Username</label>
          <input id="auth-username" class="minp" value="You" placeholder="Choose a name..." style="margin:0;"/>
        </div>
        <button class="mprim" onclick="completeAuth('guest')" style="margin-bottom:10px; width:100%;">🎮 Play as Guest (Save Offline)</button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <button class="msec" onclick="completeAuth('google')" style="margin:0;font-size:11px;">Google Login</button>
          <button class="msec" onclick="completeAuth('github')" style="margin:0;font-size:11px;">GitHub Login</button>
        </div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3)">Offline sync keeps progress saved in your browser storage.</div>
      </div>
    `;
    initAestheticBg();
  } else {
    applyThemeAndCursor();
  }
}

function completeAuth(provider) {
  const username = (document.getElementById('auth-username')?.value || '').trim() || 'You';
  P.authenticated = true;
  P.name = username;
  P.title = 'Script Initiate';
  P.coins = P.coins || 200;
  P.gems = P.gems || 10;
  saveP();
  
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.style.display = 'none';
  
  toast(`Logged in via ${provider}! Welcome, ${username}!`);
  applyThemeAndCursor();
  renderHome();
}

// ─── HELPERS ───────────────────────────────────
function av(seed) { return 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + seed + '&backgroundColor=0b0c10'; }
function lvl(xp) { return Math.floor(xp / 100) + 1; }
function league(xp) { return LEAGUES.find(l => xp >= l.min && xp < l.max) || LEAGUES[0]; }
function pct(done, total) { return total ? Math.round(done / total * 100) : 0; }

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2300);
}

function showXP(a) {
  const el = document.getElementById('xpb');
  if (!el) return;
  el.querySelector('div').textContent = '+' + a + ' XP ⚡';
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 1900);
}

function updNav() {
  const x = P.xp, l = lvl(x);
  
  // Update streak and XP
  const strEl = document.getElementById('n-str'); if(strEl) strEl.textContent = P.str;
  const xpEl = document.getElementById('n-xp'); if(xpEl) xpEl.textContent = x;
  
  // Update coins and gems dynamically in right panel
  const aRight = document.querySelector('.a-right');
  if (aRight) {
    let coinEl = document.getElementById('n-coins');
    if (!coinEl) {
      const coinStat = document.createElement('div');
      coinStat.className = 'astat';
      coinStat.innerHTML = `🪙 <span id="n-coins">${P.coins || 0}</span>`;
      aRight.insertBefore(coinStat, aRight.children[0]);
    } else {
      coinEl.textContent = P.coins || 0;
    }
    
    let gemEl = document.getElementById('n-gems');
    if (!gemEl) {
      const gemStat = document.createElement('div');
      gemStat.className = 'astat';
      gemStat.innerHTML = `💎 <span id="n-gems">${P.gems || 0}</span>`;
      aRight.insertBefore(gemStat, aRight.children[1]);
    } else {
      gemEl.textContent = P.gems || 0;
    }
  }

  LB.find(u => u.me).xp = x;
  const navAv = document.getElementById('nav-avatar'); if (navAv) navAv.src = userAvatarURL();
}

// ─── LANDING ───────────────────────────────────
function go(pg) {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').classList.add('on');
  nav(pg);
}

document.getElementById('l-send').onclick = () => {
  const v = document.getElementById('l-inp').value.trim();
  window._lmsg = v;
  go('home');
  if (v) {
    setTimeout(() => {
      setAILessonCtx(null, null);
      setTimeout(() => {
        const inp = document.getElementById('api-inp');
        if (inp) {
          inp.value = v;
          updAIBtn();
          aiSend(v);
          window._lmsg = '';
        }
      }, 300);
    }, 400);
  }
};
document.getElementById('l-inp').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('l-send').click(); } });

// ─── NAV ───────────────────────────────────────
function nav(pg) {
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.alink').forEach(b => b.classList.toggle('on', b.dataset.p === pg));
  const el = document.getElementById('pg-' + pg);
  if (el) el.classList.add('on');
  
  if (pg === 'home') renderHome();
  if (pg === 'courses') renderCourses();
  if (pg === 'mission') renderMission();
  if (pg === 'leaderboard') renderLB();
  if (pg === 'profile') renderProfile();
  if (pg === 'shop') renderShop();
  updNav();
}

// ─── HOME DASHBOARD ─────────────────────────────
function renderHome() {
  updNav();
  initAuth();
  const x = P.xp, lv = lvl(x), lg = league(x);
  
  // Calculate recommended roadmap node
  let continuePathId = 'python';
  let continueNode = LESSONS['python'][1];
  for (let langId in LESSONS) {
    const nodes = LESSONS[langId];
    const completedNode = nodes.find(n => n.type !== 'header' && !P.done[n.id]);
    if (completedNode) {
      continuePathId = langId;
      continueNode = completedNode;
      break;
    }
  }
  const continueLang = LANGS.find(l => l.id === continuePathId) || LANGS[0];

  // Daily goals calculations
  const goalXP = 50;
  const isGoalReached = x >= goalXP;

  document.getElementById('home-pi').innerHTML = `
  <div class="split-workspace" style="margin-bottom:20px;">
    <!-- LEFT PANEL: Dashboard details -->
    <div>
      <div class="card glass" style="display:flex;gap:20px;align-items:center;padding:24px;margin-bottom:14px;position:relative;overflow:hidden;">
        <div style="z-index:2;">
          ${renderMascotSVG('happy')}
        </div>
        <div style="flex:1;z-index:2;">
          <h2 style="font-size:24px;font-weight:900;margin-bottom:4px;">Hey, ${P.name}! 👋</h2>
          <div class="mascot-bubble">"You are doing awesome! Let's conquer a Boss Battle today to boost our XP!" 🐲</div>
        </div>
      </div>
      
      <!-- Recommended Node Node -->
      <div class="card glass" style="padding:16px;margin-bottom:14px;border:1px solid rgba(72,216,255,0.4);background:radial-gradient(circle at top right, rgba(72,216,255,0.06), transparent);">
        <div style="font-size:11px;font-weight:700;color:var(--accent-2);margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Continue Learning</div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:17px;font-weight:900;">${continueNode.t || continueNode.title}</h3>
            <p style="font-size:12px;color:var(--muted);margin-top:2px;">${continueLang.ico} ${continueLang.n} · Chapter 1 Node</p>
          </div>
          <button class="hbtn p" onclick="launchRoadmapNode('${continueLang.id}', '${continueNode.id}')" style="padding:8px 18px;font-size:13px;">Resume 🎮</button>
        </div>
      </div>

      <!-- Quests -->
      <div class="card glass" style="padding:18px;margin-bottom:14px;">
        <h3 style="font-size:15px;font-weight:900;margin-bottom:12px;display:flex;justify-content:space-between;"><span>🧭 Active Quests</span> <span style="font-size:11px;color:var(--accent);">Rewards</span></h3>
        ${QUESTS.daily.map(q => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);">
            <div>
              <div style="font-size:13px;font-weight:700;">${q.title}</div>
              <div style="font-size:11px;color:var(--muted);">${q.desc}</div>
            </div>
            <button class="hbtn s" style="padding:4px 10px;font-size:11px;" onclick="claimQuest('${q.id}', ${q.xp}, ${q.coins})">🎁 Claim</button>
          </div>
        `).join('')}
      </div>

      <!-- Statistics Grid -->
      <div class="srow">
        <div class="sbox"><span class="sico">⚡</span><div><div class="sval">${x} XP</div><div class="slbl">Total XP</div></div></div>
        <div class="sbox"><span class="sico">🔥</span><div><div class="sval">${P.str}</div><div class="slbl">Day Streak</div></div></div>
        <div class="sbox"><span class="sico">🪙</span><div><div class="sval">${P.coins}</div><div class="slbl">Coins</div></div></div>
        <div class="sbox" onclick="nav('leaderboard')"><span class="sico">${lg.ico}</span><div><div class="sval">${lg.n}</div><div class="slbl">League</div></div></div>
      </div>
    </div>

    <!-- RIGHT PANEL: Social updates / Friends Activity -->
    <div>
      <div class="card social-panel glass">
        <h3 style="font-weight:900;font-size:15px;margin-bottom:12px;display:flex;align-items:center;gap:6px;"><span>👥 League Competitors</span> <span style="font-size:10px;background:#EF4444;padding:2px 6px;border-radius:4px;color:#fff;">Live</span></h3>
        <div style="max-height: 280px; overflow-y:auto; padding-right:6px;">
          ${LB.filter((_,i)=>i<6).map(u => `
            <div class="activity-row">
              <img src="${av(u.av)}" />
              <div style="flex:1;">
                <div style="font-weight:700;">${u.n}</div>
                <div style="font-size:10px;color:var(--muted);">Gained ${Math.floor(Math.random()*60)+20} XP in ${continueLang.n}</div>
              </div>
              <div style="font-weight:800;color:var(--accent);">${u.xp} XP</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="card glass" style="margin-top:14px; text-align:center;">
        <h3 style="font-weight:700;font-size:13px;margin-bottom:6px;">Daily Goal Tracker</h3>
        <div style="font-size:28px;font-weight:900;margin-bottom:4px;">${Math.min(x, goalXP)} / ${goalXP} <span style="font-size:14px;color:var(--muted)">XP</span></div>
        <div class="pbar-t" style="height:8px;margin-top:8px;">
          <div class="pfill" style="background:var(--accent);width:${Math.min(100, (x/goalXP)*100)}%;"></div>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px;">${isGoalReached ? '🎉 Daily Goal Complete! +10 Bonus Coins granted.' : 'Earn 50 XP today to complete.'}</div>
      </div>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;"><div class="sec" style="margin:0;">Featured Paths</div><button onclick="nav('courses')" class="text-btn">View all 41 Paths →</button></div>
  <div class="lgrid" id="hl1" style="margin-top:12px;"></div>
  `;
  const main = LANGS.filter((_, i) => i < 8);
  const g = document.getElementById('hl1');
  if (g) {
    main.forEach(l => g.appendChild(mkCard(l)));
  }
}

function mkCard(l) {
  const done = LESSONS[l.id].filter(x => P.done[x.id]).length;
  const total = LESSONS[l.id].filter(x => x.type !== 'header').length, p = pct(done, total);
  const d = document.createElement('div'); d.className = 'lcard';
  d.innerHTML = `<div class="lico" style="background:${l.bg};border:1px solid ${l.c}33;">${l.ico}</div>
  <div class="lname">${l.n}</div><div class="lsub">${l.codrs} Codders</div>
  <div class="pbar-t" style="height:5px;"><div class="pfill" style="background:${l.c};width:${p}%;height:100%;"></div></div>
  <div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:4px;">${done}/${total} nodes</div>
  ${p === 100 ? '<div class="done-ico">✓</div>' : ''}
  <div class="lcard-glow" style="background:${l.c};"></div>`;
  d.onclick = () => openCourse(l);
  return d;
}

function claimQuest(questId, xpReward, coinsReward) {
  if (P.completedQuests && P.completedQuests[questId]) {
    toast('Already claimed today!');
    return;
  }
  P.xp += xpReward;
  P.coins += coinsReward;
  P.completedQuests = P.completedQuests || {};
  P.completedQuests[questId] = true;
  saveP();
  showXP(xpReward);
  updNav();
  toast(`🎁 Quest completed! Gained ${coinsReward} Coins and ${xpReward} XP!`);
  renderHome();
}

// ─── MISSION LAB ───────────────────────────────
function renderMission() {
  const doneCount = Object.keys(P.done).length;
  document.getElementById('mission-pi').innerHTML = `
  <div class="mission-head">
    <div>
      <div class="hero-badge">Custom Coding Sandbox</div>
      <h1>Mission Lab</h1>
      <p>Describe any build project or select a guided mission. The AI Tutor creates custom roadmap routes.</p>
    </div>
    <div class="mission-orb"><span>${doneCount}</span><small>nodes cleared</small></div>
  </div>
  <div class="mission-grid">
    ${MISSIONS.map(m => `
      <article class="mission-card">
        <div class="mission-top"><span>${m.stack}</span><span>${m.time}</span></div>
        <h2>${m.title}</h2>
        <div class="mission-diff">${m.difficulty}</div>
        <ol>${m.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        <button class="hbtn p" onclick="startMission('${m.id}')">Start Mission</button>
      </article>
    `).join('')}
  </div>
  <div class="mission-custom">
    <div>
      <h2>Bring your own idea</h2>
      <p>Describe the app, bug, or concept. The tutor compiles a tailored path.</p>
    </div>
    <textarea id="mission-custom" placeholder="Example: I want to build a budget calculator in JavaScript"></textarea>
    <button class="hbtn s" onclick="startCustomMission()">Generate route</button>
  </div>`;
}

function startMission(id) {
  const m = MISSIONS.find(x => x.id === id); if (!m) return;
  nav('home'); openAI(false);
  const inp = document.getElementById('api-inp');
  const prompt = 'Create a guided Syntaxia Mission Lab route for me: ' + m.prompt + ' Keep it beginner-friendly, split it into checkpoints, and ask me to complete checkpoint 1 first.';
  if (inp) { inp.value = prompt; updAIBtn(); aiSend(prompt); }
}

function startCustomMission() {
  const txt = (document.getElementById('mission-custom')?.value || '').trim();
  if (!txt) { toast('Describe a mission first.'); return; }
  nav('home'); openAI(false);
  const prompt = 'Turn this into a Syntaxia Mission Lab route: ' + txt + '. Give checkpoints, suggested language, and the first tiny task.';
  const inp = document.getElementById('api-inp');
  if (inp) { inp.value = prompt; updAIBtn(); aiSend(prompt); }
}

// ─── COURSES PAGE ──────────────────────────────
function renderCourses() {
  document.getElementById('courses-pi').innerHTML = `
  <h2 style="font-size:24px;font-weight:900;margin-bottom:4px;">Learning Paths Map</h2>
  <p style="color:rgba(255,255,255,.38);font-size:14px;margin-bottom:20px;">Pick a path and complete checkpoints, boss battles, and exams</p>
  <input class="minp" style="max-width:400px;margin-bottom:20px;" placeholder="Search languages & paths..." oninput="filterC(this.value)" id="cs"/>
  <div class="lgrid" id="cg"></div>`;
  const g = document.getElementById('cg');
  LANGS.forEach(l => g.appendChild(mkCard(l)));
}

function filterC(q) {
  const g = document.getElementById('cg'); if (!g) return; g.innerHTML = '';
  LANGS.filter(l => l.n.toLowerCase().includes(q.toLowerCase())).forEach(l => g.appendChild(mkCard(l)));
}

// ─── INTERACTIVE WINDING ROADMAP RENDERING ──────
function openCourse(lang) {
  curLang = lang;
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-course').classList.add('on');
  
  renderRoadmap();
}

function renderRoadmap() {
  const lang = curLang;
  const nodes = LESSONS[lang.id];
  const done = nodes.filter(n => n.type !== 'header' && P.done[n.id]).length;
  const total = nodes.filter(n => n.type !== 'header').length;
  const progressPercent = pct(done, total);

  document.getElementById('course-pi').innerHTML = `
    <button class="back-btn" onclick="nav('courses')">← Back to Paths</button>
    <div class="ch glass">
      <div class="chico" style="background:${lang.bg};border:1px solid ${lang.c}33;">${lang.ico}</div>
      <div style="flex:1;">
        <h2 style="font-size:24px;font-weight:900;">${lang.n} Path</h2>
        <div style="font-size:13px;color:rgba(255,255,255,.38);margin-bottom:8px;">Interactive Road Node Tree</div>
        <div class="pbar-t" style="height:6px;max-width:400px;"><div class="pfill" style="background:${lang.c};width:${progressPercent}%;height:100%;"></div></div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:6px;">${done} / ${total} checkpoints completed (${progressPercent}%)</div>
      </div>
    </div>
    
    <!-- Visual Connective Roadmap Winding Node Tree -->
    <div class="roadmap-container glass">
      <div class="roadmap-path"></div>
      <div id="roadmap-nodes-box" style="width:100%;"></div>
    </div>
  `;

  const box = document.getElementById('roadmap-nodes-box');
  let currentUnlocked = true; // first node is unlocked

  nodes.forEach((node, idx) => {
    if (node.type === 'header') {
      const headerDiv = document.createElement('div');
      headerDiv.className = 'roadmap-ch-hdr';
      headerDiv.innerHTML = `<h3>${node.title}</h3><p>${node.desc}</p>`;
      box.appendChild(headerDiv);
      return;
    }

    const isCompleted = !!P.done[node.id];
    const isUnlocked = currentUnlocked;
    if (isUnlocked) {
      currentUnlocked = isCompleted; // next node is unlocked only if this is completed
    }

    const wrap = document.createElement('div');
    wrap.className = `roadmap-node-wrap`;
    
    let nodeClass = 'locked';
    let nodeIco = '🔒';
    if (isCompleted) {
      nodeClass = 'completed';
      nodeIco = node.type === 'boss' ? '🐲' : node.type === 'game' ? '🎮' : node.type === 'exam' ? '📝' : node.type === 'certificate' ? '🎓' : '✅';
    } else if (isUnlocked) {
      nodeClass = 'active';
      nodeIco = node.type === 'boss' ? '👿' : node.type === 'game' ? '🕹️' : node.type === 'exam' ? '📝' : node.type === 'certificate' ? '📜' : '📖';
    }

    wrap.innerHTML = `
      <div class="roadmap-node ${nodeClass}" id="nd-${node.id}">
        ${nodeIco}
        <div class="roadmap-node-label">${node.t || node.title}</div>
      </div>
    `;

    wrap.onclick = () => {
      if (!isUnlocked) {
        toast('🔒 Complete preceding checkpoints to unlock this node!');
        return;
      }
      showNodeTooltip(node, isCompleted);
    };

    box.appendChild(wrap);
  });
}

function showNodeTooltip(node, isCompleted) {
  // Render popup overlay with details about the roadmap node
  let m = document.getElementById('node-tooltip-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'node-tooltip-modal';
    m.className = 'moverlay';
    document.body.appendChild(m);
  }
  m.classList.add('on');
  
  let rewardText = `⚡ ${node.xp || 20} XP`;
  if (node.coins) rewardText += ` · 🪙 ${node.coins} Coins`;
  if (node.gems) rewardText += ` · 💎 ${node.gems} Gems`;

  m.innerHTML = `
    <div class="mbox glass" style="max-width:380px; text-align:center;">
      <button class="mclose" onclick="closeM('node-tooltip-modal')">✕</button>
      <h3 style="font-size:20px;font-weight:900;margin-bottom:8px;">${node.t || node.title}</h3>
      <div style="font-size:11px;text-transform:uppercase;color:var(--accent-2);font-weight:800;letter-spacing:1px;margin-bottom:12px;">Node Checkpoint: ${node.type}</div>
      <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:14px;">${node.exp || node.desc || 'Complete this checkpoint to advance along the path.'}</p>
      <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;margin-bottom:16px;font-weight:700;font-size:12px;color:var(--accent);">
        Rewards: ${rewardText}
      </div>
      <button class="mprim" onclick="startRoadmapNode('${node.id}')">${isCompleted ? 'Review Checkpoint' : 'Launch Node ⚡'}</button>
    </div>
  `;
}

function startRoadmapNode(nodeId) {
  closeM('node-tooltip-modal');
  launchRoadmapNode(curLang.id, nodeId);
}

function launchRoadmapNode(langId, nodeId) {
  curLang = LANGS.find(l => l.id === langId) || curLang;
  const nodes = LESSONS[curLang.id];
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  if (node.type === 'lesson' || node.type === 'challenge') {
    openLesson(curLang, node);
  } else if (node.type === 'game') {
    openMiniGame(curLang, node);
  } else if (node.type === 'boss') {
    openBossBattle(curLang, node);
  } else if (node.type === 'project') {
    openProject(curLang, node);
  } else if (node.type === 'exam') {
    openFinalExam(curLang, node);
  } else if (node.type === 'certificate') {
    openCertificate(curLang, node);
  }
}

// ─── MONACO EDITOR LOADER ───────────────────────
function loadMonacoEditor(containerId, value, language, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (window.monaco) {
    initEditor();
  } else {
    container.innerHTML = `<div class="monaco-loading">⚡ Requiring Monaco Editor IDE from CDN...</div>`;
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js';
    s.onload = () => {
      window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      window.require(['vs/editor/editor.main'], () => {
        initEditor();
      });
    };
    document.head.appendChild(s);
  }

  function initEditor() {
    container.innerHTML = '';
    let monacoLang = 'javascript';
    if (language === 'py' || language === 'python') monacoLang = 'python';
    else if (language === 'html') monacoLang = 'html';
    else if (language === 'css') monacoLang = 'css';
    else if (language === 'sql') monacoLang = 'sql';
    else if (language === 'java') monacoLang = 'java';
    else if (language === 'cpp') monacoLang = 'cpp';
    else if (language === 'cs' || language === 'csharp') monacoLang = 'csharp';
    else if (language === 'go') monacoLang = 'go';
    else if (language === 'rs' || language === 'rust') monacoLang = 'rust';

    let theme = 'vs-dark';
    if (P.equippedTheme === 'matrix') theme = 'hc-black';

    monacoEditor = window.monaco.editor.create(container, {
      value: value,
      language: monacoLang,
      theme: theme,
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      fontFamily: 'JetBrains Mono',
      lineHeight: 18,
      tabSize: 4,
      insertSpaces: true
    });

    monacoEditor.onDidChangeModelContent(() => {
      const code = monacoEditor.getValue();
      if (onChange) onChange(code);
    });
  }
}

// ─── LESSON / PLAYGROUND ───────────────────────
function openLesson(lang, lesson) {
  curLang = lang; curLesson = lesson; lesStep = 'learn';
  lesCode = lesson.starter || ''; lesRan = false; qSel = null; qSub = false;
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-lesson').classList.add('on');
  renderLes();
}

function renderLes() {
  const l = curLang, les = curLesson;
  document.getElementById('lesson-pi').innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
    <button class="back-btn" style="margin:0;" onclick="openCourse(curLang)">← Back to Roadmap</button>
    <div style="text-align:center;"><div style="font-weight:800;font-size:16px;">${les.t}</div><div style="font-size:12px;color:rgba(255,255,255,.38);">${l.n} · <span style="color:${l.c};">⚡ ${les.xp} XP</span></div></div>
    <button class="ai-fab-btn" style="font-size:12px;padding:7px 13px;" onclick="openAI(true)">🤖 Ask AI</button>
  </div>
  <div class="l-tabs-bar">
    ${['learn', 'code', 'quiz'].map((s, i) => `<button class="l-tab ${lesStep === s ? 'on' : ''}" onclick="setStep('${s}')">${i + 1}. ${s.charAt(0).toUpperCase() + s.slice(1)}</button>`).join('')}
  </div>
  <div id="lbody" class="fin"></div>`;
  renderLesBody();
}

function setStep(s) { lesStep = s; renderLes(); }

function renderLesBody() {
  const l = curLang, les = curLesson;
  const body = document.getElementById('lbody'); if (!body) return;

  if (lesStep === 'learn') {
    body.innerHTML = `<div class="l-layout">
      <div>
        <div class="lpanel" style="margin-bottom:14px;">
          <div class="lptit" style="color:${l.c};">📚 Explanation</div>
          <div class="lptxt">${les.exp}</div>
        </div>
        <div class="task-box" style="background:${l.bg};border:1px solid ${l.c}33;">
          <div class="lptit" style="color:${l.c};">🎯 Lesson Checkpoint</div>
          <div style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.65;">${les.task}</div>
        </div>
      </div>
      <div class="lpanel">
        <div class="lptit">💡 AI Tutor Advice</div>
        <div style="margin-bottom:12px;">
          ${renderMascotSVG('thinking')}
        </div>
        <p style="font-size:12.5px;color:var(--muted);line-height:1.6;">Use the Ask AI Tutor tab if you are feeling stuck on logic bugs. Remember, no cheats allowed! 🚀</p>
      </div>
    </div>
    <div style="margin-top:18px;">
      <button onclick="setStep('code')" style="background:${l.c};color:#fff;border:none;border-radius:12px;padding:13px 28px;font-weight:800;font-size:15px;">Launch Code Editor →</button>
    </div>`;
  }

  else if (lesStep === 'code') {
    body.innerHTML = `<div class="split-workspace">
      <div>
        <div class="editor-pane">
          <div class="codetbar">
            <span class="cdot" style="background:#EF4444;"></span>
            <span class="cdot" style="background:#F59E0B;"></span>
            <span class="cdot" style="background:#22C55E;"></span>
            <span class="cfile">lesson.${l.ext}</span>
          </div>
          <div id="monaco-editor-playground" class="monaco-container"></div>
        </div>
        <button class="run-btn" onclick="runCode()">▶ Run Code</button>
        ${lesRan && lastRun ? runPanel(lastRun, les, l.c) : ''}
        <div class="hint-row">
          <button class="hint-btn" onclick="openAI(true)">🤖 Ask AI for a hint</button>
          <button class="sol-btn" onclick="showSol()">👁 Show Solution</button>
        </div>
      </div>
      <div>
        <div class="lpanel" style="margin-bottom:12px;">
          <div class="lptit" style="color:${l.c};">🎯 Task</div>
          <div style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.65;">${les.task}</div>
        </div>
        <div class="lpanel">
          <div class="lptit">📟 Expected Output</div>
          <div class="exp-out">${les.out}</div>
        </div>
      </div>
    </div>`;
    
    loadMonacoEditor('monaco-editor-playground', lesCode, l.ext, (val) => {
      lesCode = val;
    });
  }

  else {
    const q = les.quiz, sel = qSel, sub = qSub, cor = sel === q.ans;
    body.innerHTML = `<div style="max-width:620px; margin: 0 auto;">
      <div class="lpanel glass">
        <div class="lptit" style="color:${l.c};">⚡ Quick Quiz Checkpoint</div>
        <div style="font-weight:700;font-size:17px;margin-bottom:18px;line-height:1.4;">${q.q}</div>
        ${q.opts.map((o, i) => {
          let cls = 'qopt';
          if (sub) { if (i === q.ans) cls += ' cor'; else if (i === sel) cls += ' wrng'; }
          else if (i === sel) cls += ' sel';
          return `<button class="${cls}" onclick="selQ(${i})" ${sub ? 'disabled' : ''}><span class="qlet">${String.fromCharCode(65 + i)}</span>${o}</button>`;
        }).join('')}
        ${!sub
          ? `<button class="check-btn" onclick="subQ()" ${sel === null ? 'disabled' : ''}>Check Answer</button>`
          : `<div style="background:${cor ? '#031A0F' : '#1A0505'};border:1px solid ${cor ? '#22C55E' : '#EF4444'};border-radius:11px;padding:11px 14px;color:${cor ? '#4ADE80' : '#F87171'};font-weight:700;font-size:13px;margin-top:8px;">${cor ? '🎉 Correct! Stellar job!' : '❌ Answer: ' + q.opts[q.ans]}</div>
             <button class="next-btn" onclick="claimXP()" style="background:${l.c};">${cor ? 'Claim XP & Continue 🎯' : 'Continue Anyway →'}</button>`
        }
      </div>
    </div>`;
  }
}

function runPanel(r, les, color) {
  if (r.previewOnly) {
    return '<div class="sban" style="background:#0D2010;">📄 Reference output (preview mode active):</div>' +
      '<pre class="code-out">' + esc(les.out || '(no expected output)') + '</pre>' +
      '<button onclick="setStep(\'quiz\')" style="width:100%;background:' + color + ';color:#fff;border:none;border-radius:12px;padding:13px;font-weight:800;font-size:14px;margin-top:8px;">Take the Quiz →</button>';
  }
  if (r.rendered) {
    return '<div class="sban" style="background:#031A0F;">🖼️ Live HTML/CSS preview rendered</div>' +
      '<iframe class="code-out" sandbox="allow-scripts" srcdoc="' + attr(r.rendered) + '"></iframe>' +
      '<button onclick="setStep(\'quiz\')" style="width:100%;background:' + color + ';color:#fff;border:none;border-radius:12px;padding:13px;font-weight:800;font-size:14px;margin-top:8px;">Take the Quiz →</button>';
  }
  const ok = r.exitCode === 0, matched = ok && matchesExpected(r.stdout, les.out);
  const body = (r.stdout ? esc(r.stdout) : '') + (r.stderr ? '\n' + esc(r.stderr) : '');
  let out = '<pre class="code-out ' + (ok ? '' : 'err') + '">' + (body || '(no output)') + '</pre>';
  if (les.out) {
    out += matched ? '<div class="sban">✅ Output matches! Well done!</div>' : '<div class="sban" style="background:#1A0505;border-color:#EF4444;color:#F87171;">Output doesn\'t match yet — expected:\n' + esc(les.out) + '</div>';
  } else {
    out += ok ? '<div class="sban">✅ Ran successfully!</div>' : '<div class="sban" style="background:#1A0505;border-color:#EF4444;color:#F87171;">⚠️ Fix the errors and run again.</div>';
  }
  out += '<button onclick="setStep(\'quiz\')" style="width:100%;background:' + color + ';color:#fff;border:none;border-radius:12px;padding:13px;font-weight:800;font-size:14px;margin-top:8px;">Take the Quiz →</button>';
  return out;
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function attr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

async function runCode() {
  if (monacoEditor) lesCode = monacoEditor.getValue();
  const starter = (curLesson.starter || '').trim();
  if (!lesCode.trim() || lesCode.trim() === starter) { toast('✏️ Write your code first!'); return; }
  const btn = document.querySelector('.run-btn'); if (btn) { btn.disabled = true; btn.textContent = 'Running…'; }
  lastRun = await runCodeForLesson(curLang ? curLang.id : 'javascript', lesCode);
  lesRan = true; renderLesBody();
}

function showSol() {
  if (!confirm('Show solution? Try your best first! 💪')) return;
  lesCode = curLesson.code;
  if (monacoEditor) {
    monacoEditor.setValue(lesCode);
  }
  toast('Solution loaded — study and practice it! 📚');
}

function selQ(i) { if (qSub) return; qSel = i; renderLesBody(); }
function subQ() { if (qSel === null) return; qSub = true; renderLesBody(); }

function claimXP() {
  const les = curLesson;
  const passed = passedRun(lastRun, les);
  if (!P.done[les.id] && (!les.out || passed)) {
    const beforeLvl = lvl(P.xp), beforeStr = P.str;
    P.done[les.id] = true;
    P.xp += les.xp;
    P.coins += 15; // default lesson coins reward
    recordActivity(P, todayISO()); saveP();
    showXP(les.xp); updNav();
    confetti();
    if (lvl(P.xp) > beforeLvl) levelUpFlash();
    else if (P.str > beforeStr) streakFlamePulse();
    toast('Progress saved. +15 Coins 🔥 Streak updated!');
  } else if (les.out && !passed) {
    toast('Output doesn\'t match yet — no XP this time. Keep trying!');
  }
  setTimeout(() => openCourse(curLang), 350);
}
function passedRun(r, les) { if (!r) return false; if (r.rendered || r.previewOnly) return true; return r.exitCode === 0 && matchesExpected(r.stdout, les.out); }

// ─── BOSS BATTLES (Task 7) ──────────────────────
function openBossBattle(lang, node) {
  curLang = lang; bossNode = node;
  bossActive = true; bossStageIndex = 0; bossHp = 100;
  bossTimerValue = node.timeLimit || 90;
  lesCode = node.stages[0].starter || '';
  
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-lesson').classList.add('on');
  
  initBossBattleArena();
}

function initBossBattleArena() {
  const l = curLang;
  const stage = bossNode.stages[bossStageIndex];
  const container = document.getElementById('lesson-pi');
  
  container.innerHTML = `
    <div class="boss-arena">
      <h2 style="font-weight:900;color:#ef4444;text-shadow:0 0 10px rgba(239,68,68,0.5);">⚔️ CHAPTER BOSS: THE COMPILER GUARDIAN</h2>
      <div class="boss-timer" id="boss-clock">Time: ${bossTimerValue}s</div>
      <div class="boss-hp-bar">
        <div class="boss-hp-fill" id="boss-hp-fill" style="width:${bossHp}%;"></div>
        <div class="boss-hp-text" id="boss-hp-text">Boss Integrity: ${bossHp}%</div>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.4)">Solve each stage before time runs out to defeat the Boss!</div>
    </div>
    
    <div class="split-workspace" style="margin-top:20px;">
      <div>
        <div class="editor-pane">
          <div class="codetbar">
            <span class="cdot" style="background:#EF4444;"></span>
            <span class="cdot" style="background:#F59E0B;"></span>
            <span class="cdot" style="background:#22C55E;"></span>
            <span class="cfile">boss_battle.${l.ext}</span>
          </div>
          <div id="monaco-boss-editor" class="monaco-container"></div>
        </div>
        <button class="run-btn" onclick="executeBossStage()" style="background:#ef4444;">💥 Fire Compiler Strike</button>
      </div>
      <div>
        <div class="lpanel glass">
          <div class="lptit" style="color:#ef4444;">Stage Checkpoint ${bossStageIndex + 1} of ${bossNode.stages.length}</div>
          <p style="font-size:13.5px;line-height:1.65;font-weight:600;margin-bottom:12px;">${stage.task}</p>
        </div>
        <div class="lpanel" style="margin-top:10px;">
          <div class="lptit">📟 Expected Output</div>
          <div class="exp-out">${stage.out}</div>
        </div>
      </div>
    </div>
  `;

  loadMonacoEditor('monaco-boss-editor', lesCode, l.ext, (val) => {
    lesCode = val;
  });

  // Start boss countdown timer
  if (gameTimer) clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    bossTimerValue--;
    const clock = document.getElementById('boss-clock');
    if (clock) clock.textContent = `Time: ${bossTimerValue}s`;
    
    if (bossTimerValue <= 0) {
      clearInterval(gameTimer);
      failBossBattle();
    }
  }, 1000);
}

async function executeBossStage() {
  if (monacoEditor) lesCode = monacoEditor.getValue();
  const stage = bossNode.stages[bossStageIndex];
  
  toast('Executing compiler strike...');
  const runResult = await runCodeForLesson(curLang.id, lesCode);
  const ok = runResult.exitCode === 0 && matchesExpected(runResult.stdout, stage.out);
  
  if (ok) {
    // Stage completed successfully
    bossStageIndex++;
    bossHp = Math.max(0, 100 - (bossStageIndex / bossNode.stages.length) * 100);
    
    const fill = document.getElementById('boss-hp-fill');
    const text = document.getElementById('boss-hp-text');
    if (fill) fill.style.width = bossHp + '%';
    if (text) text.textContent = `Boss Integrity: ${bossHp}%`;
    
    if (bossStageIndex >= bossNode.stages.length) {
      // Victory!
      clearInterval(gameTimer);
      victoryBossBattle();
    } else {
      toast('💥 Stage Cleared! Boss hit! Preparing Stage ' + (bossStageIndex + 1));
      lesCode = bossNode.stages[bossStageIndex].starter || '';
      setTimeout(() => {
        initBossBattleArena();
      }, 1000);
    }
  } else {
    // Penalty
    bossTimerValue = Math.max(1, bossTimerValue - 10);
    toast('❌ Error! Guardian blocked. -10s Penalty!');
  }
}

function victoryBossBattle() {
  confetti();
  P.done[bossNode.id] = true;
  P.xp += bossNode.xp || 100;
  P.gems += bossNode.gems || 3;
  saveP();
  updNav();
  
  const container = document.getElementById('lesson-pi');
  container.innerHTML = `
    <div class="card glass" style="text-align:center;padding:40px;max-width:500px;margin:30px auto;">
      <h2 style="font-weight:900;color:var(--accent);font-size:32px;">🏆 BOSS DEFEATED!</h2>
      <div style="margin:20px 0;">
        ${renderMascotSVG('happy')}
      </div>
      <p style="font-size:15px;color:var(--muted);margin-bottom:20px;">You crushed the Compiler Guardian and completed Chapter 1!</p>
      <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;font-weight:800;color:var(--accent);margin-bottom:24px;">
        Rewards: +${bossNode.xp} XP ⚡ · +${bossNode.gems} Gems 💎
      </div>
      <button class="mprim" onclick="openCourse(curLang)">Back to Path Map</button>
    </div>
  `;
}

function failBossBattle() {
  const container = document.getElementById('lesson-pi');
  container.innerHTML = `
    <div class="card glass" style="text-align:center;padding:40px;max-width:500px;margin:30px auto;border-color:#ef4444;">
      <h2 style="font-weight:900;color:#ef4444;font-size:32px;">⚔️ DEFEAT</h2>
      <div style="margin:20px 0;">
        ${renderMascotSVG('sad')}
      </div>
      <p style="font-size:15px;color:var(--muted);margin-bottom:20px;">The time expired before the Guardian was disabled.</p>
      <button class="mprim" onclick="launchRoadmapNode('${curLang.id}', '${bossNode.id}')" style="background:#ef4444;width:100%;margin-bottom:8px;">Try Again</button>
      <button class="msec" onclick="openCourse(curLang)" style="width:100%;margin:0;">Flee to Safety</button>
    </div>
  `;
}

// ─── MINI-GAMES MODULE (Task 7) ─────────────────
function openMiniGame(lang, node) {
  curLang = lang; gameData = node;
  gameActive = true; gamePoints = 0;
  gameSubtype = node.gameType;
  
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-lesson').classList.add('on');
  
  if (gameSubtype === 'debug') {
    initDebugRace();
  } else if (gameSubtype === 'puzzle') {
    initCodePuzzle();
  } else if (gameSubtype === 'typing') {
    initTypingSpeed();
  }
}

// Subgame 1: Debug Race
function initDebugRace() {
  let bugIndex = 0;
  const bugs = gameData.bugs;
  const container = document.getElementById('lesson-pi');
  
  function renderBug() {
    if (bugIndex >= bugs.length) {
      winGame();
      return;
    }
    const bug = bugs[bugIndex];
    container.innerHTML = `
      <div class="game-arena glass">
        <h2 style="font-weight:900;margin-bottom:6px;">🎮 BUG RACE</h2>
        <div style="font-size:13px;color:var(--muted);margin-bottom:14px;">Fix the syntax bug in the textbox below:</div>
        
        <div style="background:#040407;border:1px solid var(--line);border-radius:10px;padding:18px;width:100%;font-family:'JetBrains Mono',monospace;margin-bottom:14px;color:#f87171;">
          ${esc(bug.broken)}
        </div>
        
        <input id="debug-fix-input" class="minp" placeholder="Type correct statement here..." style="margin-bottom:12px;"/>
        <button class="mprim" onclick="submitDebugFix()" style="width:100%;">Squash Bug 💥</button>
      </div>
    `;
    
    window.submitDebugFix = () => {
      const fix = (document.getElementById('debug-fix-input')?.value || '').trim();
      if (fix === bug.fixed) {
        bugIndex++;
        toast('🎉 Correct! Squashed!');
        renderBug();
      } else {
        toast('❌ Still bugged! Try again.');
      }
    };
  }
  
  renderBug();
}

// Subgame 2: Code Puzzle
function initCodePuzzle() {
  // Shuffled lines
  let lines = [...gameData.lines].sort(() => Math.random() - 0.5);
  const container = document.getElementById('lesson-pi');
  
  window.moveLine = (idx, direction) => {
    if (direction === 'up' && idx > 0) {
      const temp = lines[idx]; lines[idx] = lines[idx-1]; lines[idx-1] = temp;
    } else if (direction === 'down' && idx < lines.length - 1) {
      const temp = lines[idx]; lines[idx] = lines[idx+1]; lines[idx+1] = temp;
    }
    renderPuzzle();
  };

  window.verifyPuzzle = () => {
    const arranged = lines.join('\n');
    const correct = gameData.lines.join('\n');
    if (arranged === correct) {
      winGame();
    } else {
      toast('❌ Output mismatch! Reorder code lines.');
    }
  };

  function renderPuzzle() {
    container.innerHTML = `
      <div class="game-arena glass" style="align-items:stretch;">
        <h2 style="font-weight:900;text-align:center;margin-bottom:6px;">🧩 CODE PUZZLE: LINE REORDER</h2>
        <p style="font-size:12.5px;color:var(--muted);text-align:center;margin-bottom:18px;">Move the rows to reconstruct a valid code snippet:</p>
        
        <div style="margin-bottom:20px;">
          ${lines.map((line, idx) => `
            <div class="puzzle-line">
              <span style="font-family:'JetBrains Mono',monospace;font-size:12.5px;color:var(--accent);">${esc(line)}</span>
              <div style="display:flex;gap:4px;">
                <button onclick="moveLine(${idx}, 'up')" style="background:rgba(255,255,255,0.06);border:1px solid var(--line);border-radius:4px;width:24px;height:24px;color:#fff;">↑</button>
                <button onclick="moveLine(${idx}, 'down')" style="background:rgba(255,255,255,0.06);border:1px solid var(--line);border-radius:4px;width:24px;height:24px;color:#fff;">↓</button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <button class="mprim" onclick="verifyPuzzle()" style="width:100%;">Verify Layout</button>
      </div>
    `;
  }
  
  renderPuzzle();
}

// Subgame 3: Typing Speed
function initTypingSpeed() {
  const words = [...gameData.words];
  let wordScore = 0;
  let wordY = 0;
  let currentWord = words[Math.floor(Math.random() * words.length)];
  const container = document.getElementById('lesson-pi');

  if (gameTimer) clearInterval(gameTimer);

  function gameTick() {
    wordY += 15;
    const wordEl = document.getElementById('falling-word');
    if (wordEl) {
      wordEl.style.top = wordY + 'px';
    }
    if (wordY >= 150) {
      // Hit bottom: reset word
      wordY = 0;
      currentWord = words[Math.floor(Math.random() * words.length)];
      toast('💥 Bug hit the ground! Watch out!');
      renderArena();
    }
  }

  window.checkTypingMatch = () => {
    const input = document.getElementById('typing-input');
    if (input && input.value.trim() === currentWord) {
      wordScore++;
      wordY = 0;
      input.value = '';
      currentWord = words[Math.floor(Math.random() * words.length)];
      toast('💥 Blast!');
      
      if (wordScore >= 5) {
        clearInterval(gameTimer);
        winGame();
      } else {
        renderArena();
      }
    }
  };

  function renderArena() {
    container.innerHTML = `
      <div class="game-arena glass" style="align-items:stretch;">
        <h2 style="font-weight:900;text-align:center;margin-bottom:6px;">🎯 SYNTAX SHOOTER</h2>
        <p style="font-size:12.5px;color:var(--muted);text-align:center;margin-bottom:14px;">Type the falling keywords fast. Points: ${wordScore} / 5</p>
        
        <div class="typing-container">
          <div class="falling-word" id="falling-word" style="left:40%;top:${wordY}px;">${currentWord}</div>
        </div>
        
        <input id="typing-input" class="minp" placeholder="Type here..." oninput="checkTypingMatch()" style="margin-bottom:10px;text-align:center;font-size:16px;"/>
      </div>
    `;
    const input = document.getElementById('typing-input');
    if (input) input.focus();
  }

  renderArena();
  gameTimer = setInterval(gameTick, 400);
}

function winGame() {
  if (gameTimer) clearInterval(gameTimer);
  P.done[gameData.id] = true;
  P.xp += gameData.xp || 30;
  P.coins += gameData.coins || 50;
  saveP();
  updNav();
  confetti();
  
  const container = document.getElementById('lesson-pi');
  container.innerHTML = `
    <div class="card glass" style="text-align:center;padding:40px;max-width:500px;margin:30px auto;">
      <h2 style="font-weight:900;color:var(--accent);font-size:30px;">🎉 STAGE CLEAR</h2>
      <div style="margin:20px 0;">
        ${renderMascotSVG('happy')}
      </div>
      <p style="font-size:14px;color:var(--muted);margin-bottom:20px;">You completed the mini-game challenge successfully!</p>
      <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:12px;font-weight:800;color:var(--accent);margin-bottom:24px;">
        Rewards: +${gameData.xp} XP ⚡ · +${gameData.coins} Coins 🪙
      </div>
      <button class="mprim" onclick="openCourse(curLang)">Back to Path Map</button>
    </div>
  `;
}

// ─── PROJECTS MODULE ───────────────────────────
function openProject(lang, node) {
  curLang = lang; projectNode = node;
  lesCode = node.starterCode || ''; lesRan = false;
  
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-lesson').classList.add('on');
  
  renderProjectScreen();
}

function renderProjectScreen() {
  const l = curLang, node = projectNode;
  const body = document.getElementById('lesson-pi');
  
  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <button class="back-btn" style="margin:0;" onclick="openCourse(curLang)">← Back to Roadmap</button>
      <h2 style="font-weight:900;font-size:18px;">🛠️ CHAPTER PROJECT</h2>
      <div style="font-size:12px;color:rgba(255,255,255,.38);">${l.n} · <span style="color:${l.c};">⚡ ${node.xp} XP</span></div>
    </div>
    
    <div class="split-workspace">
      <div>
        <div class="editor-pane">
          <div class="codetbar">
            <span class="cdot" style="background:#EF4444;"></span>
            <span class="cdot" style="background:#F59E0B;"></span>
            <span class="cdot" style="background:#22C55E;"></span>
            <span class="cfile">app.${l.ext}</span>
          </div>
          <div id="monaco-project-editor" class="monaco-container"></div>
        </div>
        <button class="run-btn" onclick="executeProjectRun()">▶ Build & Deploy Project</button>
        ${lesRan && lastRun ? runPanel(lastRun, node, l.c) : ''}
      </div>
      <div>
        <div class="lpanel glass" style="margin-bottom:12px;">
          <h3 style="font-weight:900;margin-bottom:8px;">${node.title}</h3>
          <p style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:12px;">${node.desc}</p>
          <div class="lptit">Steps Required</div>
          <ol style="font-size:12.5px;color:var(--ink);line-height:1.8;padding-left:16px;">
            ${node.steps.map(s => `<li>${s}</li>`).join('')}
          </ol>
        </div>
        <div class="lpanel">
          <div class="lptit">📟 Expected Terminal Output</div>
          <div class="exp-out">${node.out}</div>
        </div>
      </div>
    </div>
  `;

  loadMonacoEditor('monaco-project-editor', lesCode, l.ext, (val) => {
    lesCode = val;
  });
}

async function executeProjectRun() {
  if (monacoEditor) lesCode = monacoEditor.getValue();
  const node = projectNode;
  const btn = document.querySelector('.run-btn'); if (btn) { btn.disabled = true; btn.textContent = 'Building...'; }
  
  lastRun = await runCodeForLesson(curLang.id, lesCode);
  lesRan = true;
  
  renderProjectScreen();
}

// ─── FINAL EXAMS MODULE ────────────────────────
function openFinalExam(lang, node) {
  curLang = lang; examNode = node;
  examAnswers = []; examQuestionIndex = 0;
  
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-lesson').classList.add('on');
  
  renderExamQuestion();
}

function renderExamQuestion() {
  const q = examNode.questions[examQuestionIndex];
  const container = document.getElementById('lesson-pi');
  
  container.innerHTML = `
    <div style="max-width:600px;margin:30px auto;">
      <div class="card glass">
        <h2 style="font-weight:900;color:var(--accent-2);margin-bottom:8px;">🎓 FINAL EXAM CHECKPOINT</h2>
        <div style="font-size:12px;color:var(--muted);margin-bottom:18px;">Question ${examQuestionIndex + 1} of ${examNode.questions.length}</div>
        
        <p style="font-size:16px;font-weight:700;line-height:1.4;margin-bottom:20px;">${q.q}</p>
        
        <div>
          ${q.opts.map((opt, idx) => `
            <button class="qopt" onclick="selectExamOpt(${idx})" id="eopt-${idx}">
              <span class="qlet">${String.fromCharCode(65 + idx)}</span>${opt}
            </button>
          `).join('')}
        </div>
        
        <button class="check-btn" onclick="nextExamQuestion()" id="exam-next-btn" disabled style="margin-top:14px;">Next Question →</button>
      </div>
    </div>
  `;
}

let selectedExamIdx = null;
function selectExamOpt(idx) {
  selectedExamIdx = idx;
  document.querySelectorAll('.qopt').forEach(btn => btn.classList.remove('sel'));
  const btn = document.getElementById('eopt-' + idx);
  if (btn) btn.classList.add('sel');
  
  const nextBtn = document.getElementById('exam-next-btn');
  if (nextBtn) nextBtn.disabled = false;
}

function nextExamQuestion() {
  examAnswers.push(selectedExamIdx);
  selectedExamIdx = null;
  examQuestionIndex++;
  
  if (examQuestionIndex >= examNode.questions.length) {
    evaluateExam();
  } else {
    renderExamQuestion();
  }
}

function evaluateExam() {
  const qs = examNode.questions;
  let correctCount = 0;
  qs.forEach((q, idx) => {
    if (examAnswers[idx] === q.ans) correctCount++;
  });
  
  const passed = correctCount === qs.length;
  const container = document.getElementById('lesson-pi');
  
  if (passed) {
    confetti();
    P.done[examNode.id] = true;
    P.xp += examNode.xp;
    P.coins += examNode.coins;
    saveP();
    updNav();
    
    container.innerHTML = `
      <div class="card glass" style="text-align:center;padding:40px;max-width:500px;margin:30px auto;border-color:var(--accent);">
        <h2 style="font-weight:900;color:var(--accent);font-size:32px;">🏆 EXAM PASSED!</h2>
        <div style="margin:20px 0;">
          ${renderMascotSVG('happy')}
        </div>
        <p style="font-size:15px;color:var(--muted);margin-bottom:20px;">Stellar achievement! You scored 100% on the Final Mastery Exam.</p>
        <div style="background:rgba(255,255,255,0.05);padding:14px;border-radius:12px;font-weight:800;color:var(--accent);margin-bottom:24px;">
          Rewards: +${examNode.xp} XP ⚡ · +${examNode.coins} Coins 🪙
        </div>
        <button class="mprim" onclick="openCourse(curLang)">Back to Path Map</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="card glass" style="text-align:center;padding:40px;max-width:500px;margin:30px auto;border-color:#ef4444;">
        <h2 style="font-weight:900;color:#ef4444;font-size:32px;">EXAM FAILED</h2>
        <div style="margin:20px 0;">
          ${renderMascotSVG('sad')}
        </div>
        <p style="font-size:14px;color:var(--muted);margin-bottom:20px;">You answered ${correctCount} out of ${qs.length} questions correctly. 100% score is required to unlock your certificate.</p>
        <button class="mprim" onclick="launchRoadmapNode('${curLang.id}', '${examNode.id}')" style="background:#ef4444;width:100%;margin-bottom:8px;">Retake Exam</button>
        <button class="msec" onclick="openCourse(curLang)" style="width:100%;margin:0;">Back to Path Map</button>
      </div>
    `;
  }
}

// ─── CERTIFICATE ENGINE ─────────────────────────
function openCertificate(lang, node) {
  curLang = lang;
  document.querySelectorAll('.pg').forEach(p => p.classList.remove('on'));
  document.getElementById('pg-lesson').classList.add('on');
  
  const certId = 'SYN-' + lang.id.toUpperCase() + '-' + Math.floor(Math.random() * 900000 + 100000);
  const container = document.getElementById('lesson-pi');
  const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  
  container.innerHTML = `
    <div class="cert-container glass" style="padding:24px;">
      <h2 style="font-weight:900;margin-bottom:14px;text-align:center;">🎓 VERIFIED CREDENTIAL</h2>
      
      <!-- Certificate Vector Design -->
      <svg class="cert-svg" viewBox="0 0 800 550" xmlns="http://www.w3.org/2000/svg">
        <!-- Border -->
        <rect x="15" y="15" width="770" height="520" fill="#0C0D12" stroke="var(--line, #5B6BF8)" stroke-width="8" rx="10"/>
        <rect x="25" y="25" width="750" height="500" fill="none" stroke="var(--accent, #b7ff5a)" stroke-width="2" rx="8"/>
        
        <!-- Header -->
        <text x="400" y="90" text-anchor="middle" font-family="'Inter', sans-serif" font-size="28" font-weight="900" fill="#fff" letter-spacing="4">SYNTAXIA ACADEMY</text>
        <text x="400" y="115" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="800" fill="var(--accent)" letter-spacing="2">OFFICIAL DEVELOPER CERTIFICATE</text>
        
        <!-- Main body -->
        <text x="400" y="180" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="rgba(255,255,255,0.4)">This credential certifies that</text>
        <text x="400" y="240" text-anchor="middle" font-family="'Inter', sans-serif" font-size="36" font-weight="900" fill="#fff" text-decoration="underline">${P.name}</text>
        <text x="400" y="290" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="rgba(255,255,255,0.4)">has successfully completed the comprehensive developer roadmap path for</text>
        <text x="400" y="340" text-anchor="middle" font-family="'Inter', sans-serif" font-size="26" font-weight="900" fill="var(--accent)">${lang.n} Programming</text>
        
        <!-- Bottom metadata -->
        <text x="140" y="440" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.3)">DATE OF ISSUANCE</text>
        <text x="140" y="465" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="700" fill="#fff">${dateStr}</text>
        
        <text x="660" y="440" text-anchor="middle" font-family="'Inter', sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.3)">VERIFICATION ID</text>
        <text x="660" y="465" text-anchor="middle" font-family="'Inter', sans-serif" font-size="13" font-weight="700" fill="#fff" font-family="monospace">${certId}</text>
        
        <!-- Seal / Emblem -->
        <g transform="translate(365, 410)">
          <circle cx="35" cy="35" r="30" fill="var(--line)" />
          <polygon points="35,18 48,46 22,46" fill="var(--accent)" />
          <circle cx="35" cy="35" r="23" fill="none" stroke="#000" stroke-width="2"/>
        </g>
      </svg>
      
      <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;width:100%;max-width:580px;">
        <button class="mprim" onclick="shareCert('linkedin', '${lang.n}')" style="margin:0;flex:1;background:#0077b5;">Share on LinkedIn</button>
        <button class="mprim" onclick="shareCert('twitter', '${lang.n}')" style="margin:0;flex:1;background:#1da1f2;">Share on Twitter</button>
        <button class="msec" onclick="openCourse(curLang)" style="margin:0;flex:1;">Back to Path Map</button>
      </div>
    </div>
  `;
}

function shareCert(platform, pathName) {
  const text = encodeURIComponent(`I am thrilled to announce that I have successfully cleared the official ${pathName} Developer Roadmap path on Syntaxia! ⚡🎓`);
  let url = '';
  if (platform === 'linkedin') {
    url = `https://www.linkedin.com/sharing/share-offsite/?text=${text}`;
  } else {
    url = `https://twitter.com/intent/tweet?text=${text}`;
  }
  window.open(url, '_blank');
}

// ─── SYNTAXIA SHOP SYSTEM (Task 8) ──────────────
function renderShop() {
  const container = document.getElementById('shop-pi');
  
  // Calculate category lists
  const itemsList = SHOP_ITEMS[activeTabShop] || [];

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <h2 style="font-size:24px;font-weight:900;">🛒 Syntaxia Shop</h2>
        <p style="color:rgba(255,255,255,.38);font-size:13px;">Spend your coins and gems on custom aesthetics</p>
      </div>
      <div style="display:flex;gap:8px;">
        <div class="astat" style="font-size:14px;font-weight:800;color:#F59E0B;">🪙 ${P.coins}</div>
        <div class="astat" style="font-size:14px;font-weight:800;color:var(--accent-2);">💎 ${P.gems}</div>
      </div>
    </div>

    <!-- Shop Tabs -->
    <div class="ltabs" style="margin-bottom:16px;">
      ${Object.keys(SHOP_ITEMS).map(tab => `
        <button class="ltab" style="${activeTabShop === tab ? 'background:var(--accent-2);color:#000;' : ''}" onclick="setShopTab('${tab}')">
          ${tab.toUpperCase()}
        </button>
      `).join('')}
    </div>

    <!-- Shop Grid -->
    <div class="shop-grid">
      ${itemsList.map(item => {
        let isPurchased = false;
        let isEquipped = false;
        
        if (activeTabShop === 'themes') {
          isPurchased = P.purchasedThemes.includes(item.id);
          isEquipped = P.equippedTheme === item.id;
        } else if (activeTabShop === 'cursors') {
          isPurchased = P.purchasedCursors.includes(item.id);
          isEquipped = P.equippedCursor === item.id;
        }
        
        let buyButton = '';
        if (isEquipped) {
          buyButton = `<button class="shop-btn equipped" disabled>Equipped ✓</button>`;
        } else if (isPurchased) {
          buyButton = `<button class="shop-btn equip" onclick="equipShopItem('${item.id}')">Equip</button>`;
        } else {
          buyButton = `<button class="shop-btn buy" onclick="purchaseShopItem('${item.id}', ${item.cost})">🪙 ${item.cost}</button>`;
        }

        return `
          <div class="shop-card glass">
            <div style="font-size:28px;margin-bottom:8px;">${item.ico || '🎨'}</div>
            <div style="font-weight:800;font-size:14px;margin-bottom:4px;">${item.n}</div>
            <div style="font-size:11px;color:var(--muted);line-height:1.4;margin-bottom:12px;">${item.desc}</div>
            ${buyButton}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function setShopTab(tab) {
  activeTabShop = tab;
  renderShop();
}

function purchaseShopItem(itemId, cost) {
  if (P.coins < cost) {
    toast('❌ Not enough coins!');
    return;
  }
  P.coins -= cost;
  if (activeTabShop === 'themes') {
    P.purchasedThemes.push(itemId);
  } else if (activeTabShop === 'cursors') {
    P.purchasedCursors.push(itemId);
  }
  saveP();
  updNav();
  toast('🎉 Item purchased successfully!');
  renderShop();
}

function equipShopItem(itemId) {
  if (activeTabShop === 'themes') {
    P.equippedTheme = itemId;
  } else if (activeTabShop === 'cursors') {
    P.equippedCursor = itemId;
  }
  saveP();
  applyThemeAndCursor();
  toast('Aesthetics equipped!');
  renderShop();
}

// ─── LEADERBOARD ───────────────────────────────
function renderLB() {
  const pi = document.getElementById('lb-pi');
  pi.innerHTML = `<h2 style="font-size:24px;font-weight:900;margin-bottom:4px;">🏆 Competitive Leagues</h2>
  <p style="color:rgba(255,255,255,.38);font-size:14px;margin-bottom:20px;">Compete weekly with coders worldwide</p>
  <div class="ltabs" id="ltabs"></div>
  <div class="lb-layout"><div class="lb-panel" id="lbpanel"></div><div id="lbside"></div></div>`;
  
  const tabs = document.getElementById('ltabs');
  LEAGUES.forEach(lg => {
    const b = document.createElement('button'); b.className = 'ltab';
    if (lbTab === lg.id) { b.style.background = lg.col + '22'; b.style.borderColor = lg.col + '66'; b.style.color = lg.col; }
    b.innerHTML = lg.ico + ' ' + lg.n; b.onclick = () => { lbTab = lg.id; renderLB(); };
    tabs.appendChild(b);
  });
  
  const lg = LEAGUES.find(l => l.id === lbTab);
  const users = LB.filter(u => u.xp >= lg.min && u.xp < lg.max).sort((a, b) => b.xp - a.xp);
  const myXP = P.xp, inL = myXP >= lg.min && myXP < lg.max;
  LB.find(u => u.me).xp = myXP;
  
  const show = inL ? users : [...users, ...(lbTab === 'bronze' ? [LB.find(u => u.me)] : [])].sort((a, b) => b.xp - a.xp);
  const panel = document.getElementById('lbpanel');
  panel.innerHTML = `<div class="lb-hdr">${lg.ico} ${lg.n} League · ${show.length} competitors</div>`;
  
  show.forEach((u, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
    const row = document.createElement('div'); row.className = 'lbr' + (u.me ? ' me' : '');
    row.innerHTML = `<div class="lb-rank">${medal.length > 2 ? medal : '<span style="font-size:18px;">' + medal + '</span>'}</div>
    <img src="${u.me ? userAvatarURL() : av(u.av)}" class="lb-av"/><div style="flex:1;"><div style="font-size:14px;font-weight:700;">${u.me ? '⭐ ' + P.name : u.c + ' ' + u.n}</div><div style="font-size:12px;color:rgba(255,255,255,.35);">🔥 ${u.str} day streak</div></div><div class="lb-pts">${u.xp.toLocaleString()} XP</div>`;
    panel.appendChild(row);
  });
  
  if (!show.length) panel.innerHTML += `<div style="padding:30px;text-align:center;color:rgba(255,255,255,.3);">No coders in this league yet. Be the first!</div>`;
  document.getElementById('lbside').innerHTML = `
  <div class="card glass" style="background:${lg.col}11;border-color:${lg.col}33;margin-bottom:12px;">
    <div style="font-size:44px;margin-bottom:10px;">${lg.ico}</div>
    <div style="font-size:19px;font-weight:900;color:${lg.col};margin-bottom:4px;">${lg.n} League</div>
    <div style="font-size:13px;color:rgba(255,255,255,.38);line-height:1.6;margin-bottom:10px;">${lg.desc}</div>
    <div style="font-size:12px;color:rgba(255,255,255,.28);">Requires ${lg.min.toLocaleString()}+ XP</div>
  </div>
  <div class="card glass">
    <div style="font-weight:700;margin-bottom:8px;">Your Status</div>
    <div style="font-size:13px;color:rgba(255,255,255,.38);line-height:1.6;margin-bottom:10px;">${inL ? 'You\'re in this league with ' + myXP + ' XP!' : 'Reach ' + lg.min.toLocaleString() + ' XP to join.'}</div>
    <div class="pbar-t" style="height:6px;"><div class="pfill" style="background:${lg.col};width:${Math.min(100, (myXP / Math.max(1, lg.max)) * 100)}%;height:100%;"></div></div>
  </div>`;
}

// ─── PROFILE ───────────────────────────────────
function renderProfile() {
  updNav();
  const x = P.xp, lg = league(x);
  
  // Calculate completed badges list
  const earnedBadges = BADGES.filter(b => b.check(P));

  document.getElementById('profile-pi').innerHTML = `
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <h2 style="font-size:24px;font-weight:900;">👤 Profile Checkpoint</h2>
    <button title="Settings" onclick="showSettings()" style="width:38px;height:38px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .2s;" onmouseover="this.style.background='rgba(255,255,255,.18)'" onmouseout="this.style.background='rgba(255,255,255,.07)'"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
  </div>
  <div class="pl">
    <div>
      <div class="pcard glass" style="margin-bottom:12px;">
        <img src="${userAvatarURL()}" class="pav"/>
        <div class="pname" id="pname">${P.name}</div>
        <div class="ph">@${P.title || 'Script Initiate'}</div>
        <div class="psg">
          <div class="ps"><div class="psv">${x}</div><div class="psl">XP</div></div>
          <div class="ps"><div class="psv">${P.str}</div><div class="psl">Streak 🔥</div></div>
          <div class="ps"><div class="psv">${Object.keys(P.done).length}</div><div class="psl">Nodes</div></div>
        </div>
        <div class="card glass" style="text-align:left;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-weight:700;">League</span><span style="color:#F59E0B;font-weight:700;">${lg.ico} ${lg.n}</span></div>
          <div class="pbar-t" style="height:6px;"><div class="pfill" style="background:${lg.col};width:${Math.min(100, ((x - lg.min) / Math.max(1, lg.max - lg.min)) * 100)}%;height:100%;"></div></div>
          <div style="font-size:12px;color:rgba(255,255,255,.3);margin-top:6px;">${x} XP · Level ${lvl(x)}</div>
        </div>
        <button onclick="showSettings()" class="msec" style="width:100%;margin:0;">Edit Profile</button>
      </div>
      <div class="card glass">
        <div style="font-weight:800;margin-bottom:12px;">🏅 Badges & Trophies (${earnedBadges.length})</div>
        <div class="bdgrid">
          ${earnedBadges.map(b => `<div class="bdg" title="${b.desc}"><div style="font-size:21px;">${b.ico}</div><div style="font-size:10px;color:rgba(255,255,255,.35);font-weight:600;margin-top:4px;">${b.l}</div></div>`).join('')}
          ${earnedBadges.length === 0 ? '<div style="font-size:11px;color:var(--muted);grid-column:1/-1;">Complete lessons to earn badges</div>' : ''}
        </div>
      </div>
    </div>
    <div>
      <div class="card glass">
        <div style="font-weight:800;margin-bottom:14px;">📈 Learning Path Progress</div>
        <div id="prog-list"></div>
      </div>
    </div>
  </div>`;
  
  const pl = document.getElementById('prog-list'); let any = false;
  LANGS.forEach(l => {
    const done = LESSONS[l.id].filter(x => P.done[x.id]).length; if (!done) return; any = true;
    const total = LESSONS[l.id].filter(x => x.type !== 'header').length, p = pct(done, total);
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;';
    d.innerHTML = `<div style="width:32px;height:32px;border-radius:9px;background:${l.bg};border:1px solid ${l.c}33;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${l.ico}</div>
    <div style="flex:1;"><div style="font-weight:700;font-size:14px;margin-bottom:4px;">${l.n}</div><div class="pbar-t" style="height:5px;"><div class="pfill" style="background:${l.c};width:${p}%;height:100%;"></div></div></div>
    <span style="font-size:13px;font-weight:800;color:${l.c};">${p === 100 ? '✓' : p + '%'}</span>`;
    d.onclick = () => openCourse(l); pl.appendChild(d);
  });
  if (!any) pl.innerHTML = '<div style="color:rgba(255,255,255,.3);text-align:center;padding:24px;">Start a roadmap path to see your progress here!</div>';
}

// ─── SETTINGS ──────────────────────────────────
function showSettings() {
  document.getElementById('settings-m').classList.add('on');
}
function saveSettings() {
  const n = document.getElementById('name-inp').value.trim();
  if (n) {
    P.name = n;
    saveP();
    const pn = document.getElementById('pname'); if (pn) pn.textContent = n;
  }
  closeM('settings-m');
  toast('✅ Settings saved!');
  renderProfile();
}

// ─── MODALS ────────────────────────────────────
function closeM(id) { document.getElementById(id).classList.remove('on'); }
document.querySelectorAll('.moverlay').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('on'); }));

// ─── AI INLINE PANEL ──────────────────────────
let aiMsgs = [], aiLoad = false, aiCtx = false;
window._chips = [];

function initAIPanel() {
  aiMsgs = []; aiLoad = false; aiCtx = false;
  const greet = 'Hey! 👋 I am your **Syntaxia AI Tutor**!\n\nI can help with Python 🐍, JavaScript 💛, Java ☕, SQL 🗄️ and ' + LANGS.length + ' more languages!\n\nWhat would you like to learn? 🚀';
  aiMsgs = [{ r: 'a', t: greet }];
  window._chips = ['How do I start Python?', 'Explain variables', 'What is a function?', 'Best beginner language?'];
  renderAI(); updAIBtn();
}

function setAILessonCtx(lesson, lang) {
  aiCtx = true;
  if (lesson) document.getElementById('ai-sub').textContent = 'Helping with: ' + lesson.t;
}

function clearAIChat() {
  aiMsgs = []; aiCtx = false;
  const sub = document.getElementById('ai-sub');
  if (sub) sub.textContent = 'Ready to help';
  initAIPanel();
}

function openAI(lesson) {
  if (lesson && curLesson) setAILessonCtx(curLesson, curLang);
}

function renderAI() {
  const c = document.getElementById('ai-panel-msgs');
  if (!c) return;
  c.innerHTML = '';
  aiMsgs.forEach(m => {
    const row = document.createElement('div'); row.className = 'amr' + (m.r === 'u' ? ' u' : '');
    const av2 = document.createElement('div'); av2.className = 'ami ' + (m.r === 'a' ? 'bot' : 'usr'); av2.textContent = m.r === 'a' ? '🤖' : '👤';
    const bub = document.createElement('div'); bub.className = 'abub' + (m.r === 'u' ? ' u' : ''); bub.innerHTML = fmtAI(m.t);
    if (m.r === 'a') { row.appendChild(av2); row.appendChild(bub); } else { row.appendChild(bub); row.appendChild(av2); }
    c.appendChild(row);
  });
  if (aiLoad) {
    const row = document.createElement('div'); row.className = 'amr';
    row.innerHTML = '<div class="ami bot">🤖</div><div class="abub" style="padding:10px 13px;display:flex;gap:5px;align-items:center;"><div class="ddot" style="animation-delay:0s"></div><div class="ddot" style="animation-delay:.2s"></div><div class="ddot" style="animation-delay:.4s"></div></div>';
    c.appendChild(row);
  }
  requestAnimationFrame(() => { c.scrollTop = c.scrollHeight; });
  const cc = document.getElementById('ai-panel-chips');
  if (cc && aiMsgs.filter(m => m.r === 'u').length === 0) {
    cc.innerHTML = window._chips.map((q, i) =>
      `<button class="apc" data-i="${i}" onclick="chipSend(this)">${q}</button>`
    ).join('');
  } else if (cc && aiMsgs.filter(m => m.r === 'u').length > 0) {
    cc.innerHTML = '';
  }
}

function fmtAI(raw) {
  const parts = raw.split(/(```[\s\S]*?```)/g);
  return parts.map(p => {
    if (p.startsWith('```') && p.endsWith('```')) {
      const inner = p.slice(3, -3).replace(/^\w+\n?/, '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return '<pre class="cb">' + inner + '</pre>';
    }
    const lines = p.split('\n'); let html = '', buf = [];
    const flush = () => { if (buf.length) { html += '<p>' + buf.join(' ') + '</p>'; buf = []; } };
    lines.forEach(line => {
      if (!line.trim()) { flush(); }
      else { buf.push(line.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`([^`]+)`/g, '<code class="ic">$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#fff;">$1</strong>')); }
    });
    flush(); return html;
  }).join('');
}

function chipSend(btn) { const q = window._chips[parseInt(btn.dataset.i)]; if (q) aiSend(q); }

async function aiSend(preset) {
  const inp = document.getElementById('api-inp');
  const txt = (preset || inp.value).trim(); if (!txt || aiLoad) return;
  if (inp) inp.value = '';
  const isL = aiCtx && !!curLesson;
  const prompt = isL ? '[Lesson: "' + curLesson.t + '" (' + curLang.n + '). Task: ' + curLesson.task + ']\n\n' + txt : txt;
  aiMsgs.push({ r: 'u', t: txt }); aiLoad = true; renderAI(); updAIBtn();

  const rawHistory = aiMsgs.slice(0, -1).filter(m => m.t);
  const messages = [
    { role: 'system', content: isL ? SYS_LES : SYS_GEN },
    ...rawHistory.map(m => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t })),
    { role: 'user', content: prompt }
  ];

  let reply = '', lastErr = '';
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'error ' + res.status);
    reply = (data.reply || '').trim();
  } catch (e) {
    lastErr = e.message || 'fetch failed';
  }

  if (reply) {
    aiMsgs.push({ r: 'a', t: reply });
  } else {
    const isFile = location.protocol === 'file:';
    const isCORS = lastErr.toLowerCase().includes('fetch') || lastErr.toLowerCase().includes('network') || lastErr.toLowerCase().includes('cors');
    let msg = '⚠️ **AI Tutor unavailable.**\n\n' + lastErr;
    if (isFile && isCORS)
      msg = '⚠️ **Server needed.**\n\nThe AI Tutor now uses a secure `/api/chat` endpoint, so it needs Vercel or a local serverless dev server.\n\n**Quick fix:** run:\n```\nvercel dev\n```';
    else if (isCORS)
      msg = '⚠️ **Connection failed.**\n\nYour network blocked the request. Check your internet connection and try again.';
    else if (lastErr.includes('GROQ_API_KEY'))
      msg = '🔑 **AI key missing.**\n\nAsk the site owner to add `GROQ_API_KEY` in Vercel Project Settings → Environment Variables.';
    else if (lastErr.includes('quota') || lastErr.includes('429') || lastErr.includes('rate limit'))
      msg = '⏳ **Rate limit reached.**\n\nWait 60 seconds then try again.';
    else if (lastErr.includes('401') || lastErr.includes('403'))
      msg = '🔑 **AI key rejected.**\n\nAsk the site owner to check the Groq key in Vercel.';
    aiMsgs.push({ r: 'a', t: msg });
  }
  aiLoad = false; renderAI(); updAIBtn();
  const i = document.getElementById('api-inp'); if (i) i.focus();
}

function updAIBtn() {
  const inp = document.getElementById('api-inp'), btn = document.getElementById('api-sbtn');
  if (!inp || !btn) return;
  const ok = inp.value.trim() && !aiLoad;
  btn.disabled = !ok; btn.style.opacity = ok ? '1' : '.28';
  btn.textContent = aiLoad ? '…' : '↑';
  inp.style.borderColor = inp.value ? '#8B5CF6' : 'rgba(255,255,255,.08)';
}

// ─── AVATAR BUILDER ───────────────────────────
function userAvatarURL() { return avatarURL(P.avatar); }
function applyAvatars() {
  const navAv = document.getElementById('nav-avatar'); if (navAv) navAv.src = userAvatarURL();
}
let avDraft = null;
function renderAvatarBuilder() {
  let o = document.getElementById('avatar-m');
  if (!o) { o = document.createElement('div'); o.id = 'avatar-m'; o.className = 'moverlay'; o.addEventListener('click', e => { if (e.target === o) closeAvatarBuilder(); }); document.body.appendChild(o); }
  const styleObj = AVATAR_STYLES.find(s => s.id === avDraft.style) || AVATAR_STYLES[0];
  const chipRow = (rows, param) => {
    const cur = (param === 'top' ? (avDraft.options.top) : (avDraft.options[param])) || '';
    return rows.map(([v, label]) => `<button class="achip ${(v || '') === cur ? 'on' : ''}" data-param="${param}" data-v="${v || ''}">${label}</button>`).join('');
  };
  o.classList.add('on');
  o.innerHTML = `<div class="mbox glass" style="max-width:520px;">
    <button class="mclose" onclick="closeAvatarBuilder()">✕</button>
    <div class="mtit">🎨 Customize Avatar</div>
    <div class="msub">Pick a style, features, and background</div>
    <div style="display:flex;gap:18px;align-items:center;margin:4px 0 14px;">
      <img src="${avatarURL(avDraft)}" style="width:104px;height:104px;border-radius:50%;border:3px solid #5B6BF8;background:#0b0c10;flex-shrink:0;"/>
      <div style="flex:1;">
        <div class="av-lbl">Style</div>
        <div class="chip-wrap">${AVATAR_STYLES.map(s => `<button class="achip ${s.id === avDraft.style ? 'on' : ''}" data-style="${s.id}">${s.label}</button>`).join('')}</div>
        <button class="msec" style="margin-top:6px;width:auto;padding:8px 14px;" onclick="randomizeAvatar()">🎲 Randomize look</button>
      </div>
    </div>
    ${styleObj.parts ? `
      <div class="av-lbl">Mouth</div><div class="chip-wrap">${chipRow(AVATAR_MOUTH, 'mouth')}</div>
      <div class="av-lbl">Eyes</div><div class="chip-wrap">${chipRow(AVATAR_EYES, 'eyes')}</div>
      <div class="av-lbl">Eyebrows</div><div class="chip-wrap">${chipRow(AVATAR_EYEBROWS, 'eyebrows')}</div>
      <div class="av-lbl">Headwear</div><div class="chip-wrap">${chipRow(AVATAR_TOP, 'top')}</div>
    ` : '<div class="msub" style="margin:6px 0;">Facial features apply to the Person style — switch to it to use them.</div>'}
    <div class="av-lbl">Background</div>
    <div class="chip-wrap">${BG_COLORS.map(c => `<button class="bg-swatch ${c === avDraft.bg ? 'on' : ''}" data-bg="${c}" style="background:#${c};"></button>`).join('')}</div>
    <button class="mprim" onclick="saveAvatar()" style="margin-top:16px;">Save Avatar</button>
  </div>`;
  o.querySelectorAll('button[data-param]').forEach(b => b.onclick = () => {
    const p = b.dataset.param, v = b.dataset.v;
    if (v) avDraft.options[p] = v; else delete avDraft.options[p];
    renderAvatarBuilder();
  });
  o.querySelectorAll('button[data-style]').forEach(b => b.onclick = () => { avDraft.style = b.dataset.style; renderAvatarBuilder(); });
  o.querySelectorAll('button[data-bg]').forEach(b => b.onclick = () => { avDraft.bg = b.dataset.bg; renderAvatarBuilder(); });
}
function openAvatarBuilder() {
  avDraft = { style: P.avatar.style, seed: P.avatar.seed, bg: P.avatar.bg, options: { ...(P.avatar.options || {}) } };
  renderAvatarBuilder();
}
function closeAvatarBuilder() { const o = document.getElementById('avatar-m'); if (o) o.classList.remove('on'); }
function randomizeAvatar() { if (!avDraft) return; const c = randomAvatarConfig(); avDraft.style = 'avataaars'; avDraft.seed = c.seed; avDraft.bg = c.bg; avDraft.options = c.options; renderAvatarBuilder(); }
function saveAvatar() { if (!avDraft) return; P.avatar = avDraft; saveP(); applyAvatars(); toast('Avatar updated! 🎨'); closeAvatarBuilder(); if (document.getElementById('profile-pi')) renderProfile(); }

// ─── ANIMATIONS (reduced-motion aware) ─────────
function prefersReducedMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
function confetti() {
  if (prefersReducedMotion()) return;
  let c = document.getElementById('confetti-c');
  if (!c) { c = document.createElement('canvas'); c.id = 'confetti-c'; c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99998;'; document.body.appendChild(c); }
  const ctx = c.getContext('2d'); const W = c.width = window.innerWidth, H = c.height = window.innerHeight;
  const colors = ['#5B6BF8', '#b7ff5a', '#F59E0B', '#EF4444', '#22C55E', '#8B5CF6', '#48d8ff'];
  const P2 = Array.from({ length: 90 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .32, vx: (Math.random() - .5) * 9, vy: Math.random() * -9 - 3, g: .25 + Math.random() * .18, s: 6 + Math.random() * 7, col: colors[(Math.random() * colors.length) | 0], rot: Math.random() * 6, vr: (Math.random() - .5) * .35 }));
  let f = 0;
  (function tick() { ctx.clearRect(0, 0, W, H); P2.forEach(p => { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); }); f++; if (f < 130) requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H); })();
}
function streakFlamePulse() {
  if (prefersReducedMotion()) return;
  const s = document.getElementById('n-str'); if (!s) return; const box = s.parentElement;
  box.style.transition = 'transform .22s, color .22s'; box.style.transform = 'scale(1.45)'; box.style.color = '#F59E0B';
  setTimeout(() => { box.style.transform = 'scale(1)'; box.style.color = ''; }, 240);
}
function levelUpFlash() {
  if (prefersReducedMotion()) { toast('🎉 Level up!'); return; }
  let o = document.getElementById('lvl-flash');
  if (!o) { o = document.createElement('div'); o.id = 'lvl-flash'; o.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:99997;pointer-events:none;'; o.innerHTML = '<div style="font-size:clamp(40px,8vw,90px);font-weight:900;color:#b7ff5a;text-shadow:0 0 40px rgba(183,255,90,.8);letter-spacing:-2px;">LEVEL UP!</div>'; document.body.appendChild(o);}
  o.style.display = 'flex';
  o.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.12)' }, { opacity: 1, transform: 'scale(1)', offset: .5 }, { opacity: 0, transform: 'scale(1.25)' }], { duration: 1700, easing: 'ease-out' });
  setTimeout(() => { o.style.display = 'none'; }, 1750);
}

// ─── EXPOSE FOR INLINE ONCLICK HANDLERS ───────
window.LANGS = LANGS;
window.LESSONS = LESSONS;
Object.defineProperty(window, 'curLang', { get: () => curLang, configurable: true });
Object.assign(window, {
  go, nav, showSettings, closeM, saveSettings, clearAIChat, aiSend, updAIBtn,
  openCourse, openLesson, setStep, runCode, openAI, showSol, selQ, subQ, claimXP,
  filterC, startMission, startCustomMission, chipSend, renderHome, renderCourses,
  renderMission, renderLB, renderProfile, openAvatarBuilder, closeAvatarBuilder,
  saveAvatar, randomizeAvatar, completeAuth,
  
  // Custom Gamification handlers
  renderShop, setShopTab, purchaseShopItem, equipShopItem,
  // Note: submitDebugFix, moveLine, verifyPuzzle, checkTypingMatch are attached
  // to window inside their render fns (window.X = ...), so they are NOT bare
  // identifiers here — listing them would throw ReferenceError and abort the
  // whole Object.assign, breaking every inline onclick handler.
  executeBossStage, nextExamQuestion, selectExamOpt, shareCert,
  launchRoadmapNode, startRoadmapNode, claimQuest
});

// ─── INIT ──────────────────────────────────────
initAuth();
initAestheticBg();
initAIPanel();
renderHome();
