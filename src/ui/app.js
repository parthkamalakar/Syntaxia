// Auto-extracted from syntaxia.html
import { LANGS } from '../data/languages.js';
import { LESSONS } from '../data/courses.js';
import { LEAGUES, BADGES, LB, MISSIONS } from '../data/gamification.js';
import P, { saveP } from '../state.js';
import { SYS_GEN, SYS_LES } from '../features/ai.js';


// ─── UI STATE ─────────────────────────────────
let curLang=null, curLesson=null, lesStep='learn', lesCode='', lesRan=false;
let qSel=null, qSub=false;
let lbTab='rookie';

// ─── HELPERS ───────────────────────────────────
function av(seed){return 'https://api.dicebear.com/7.x/avataaars/svg?seed='+seed+'&backgroundColor=0b0c10';}
function lvl(xp){return Math.floor(xp/100)+1;}
function league(xp){return LEAGUES.find(l=>xp>=l.min&&xp<l.max)||LEAGUES[0];}
function pct(done,total){return total?Math.round(done/total*100):0;}
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.remove('on');void t.offsetWidth;t.classList.add('on');
  setTimeout(()=>t.classList.remove('on'),2300);
}
function showXP(a){
  const el=document.getElementById('xpb');
  el.querySelector('div').textContent='+'+a+' XP ⚡';
  el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  setTimeout(()=>el.classList.remove('on'),1900);
}
function updNav(){
  const x=P.xp,l=lvl(x);
  document.getElementById('n-str').textContent=P.str;
  document.getElementById('n-xp').textContent=x;
  LB.find(u=>u.me).xp=x;
}

// ─── LANDING ───────────────────────────────────
function go(pg){
  document.getElementById('landing').style.display='none';
  document.getElementById('app').classList.add('on');
  nav(pg);
}
document.getElementById('l-send').onclick=()=>{
  const v=document.getElementById('l-inp').value.trim();
  window._lmsg=v;
  go('home');
  if(v){setTimeout(()=>{setAILessonCtx(null,null);setTimeout(()=>{const inp=document.getElementById('api-inp');if(inp){inp.value=v;updAIBtn();aiSend(v);window._lmsg='';}},300);},400);}
};
document.getElementById('l-inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.getElementById('l-send').click();}});

// ─── NAV ───────────────────────────────────────
function nav(pg){
  document.querySelectorAll('.pg').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.alink').forEach(b=>b.classList.toggle('on',b.dataset.p===pg));
  const el=document.getElementById('pg-'+pg);
  if(el)el.classList.add('on');
  if(pg==='home')renderHome();
  if(pg==='courses')renderCourses();
  if(pg==='mission')renderMission();
  if(pg==='leaderboard')renderLB();
  if(pg==='profile')renderProfile();
  updNav();
}

// ─── HOME ──────────────────────────────────────
function renderHome(){
  updNav();
  const x=P.xp,lv=lvl(x),lg=league(x),xpP=x%100;
  document.getElementById('home-pi').innerHTML=`
  <div class="hero app-hero">
    <div class="hero-badge">AI tutor online · ${LANGS.length} languages · ${Object.keys(P.done).length} lessons completed</div>
    <h1>Find the next thing worth building.</h1>
    <p>Syntaxia combines bite-size lessons, a permanent AI tutor, and guided build missions so beginners move from syntax to shipped mini-projects.</p>
    <div class="hero-btns">
      <button class="hbtn p" onclick="nav('mission')">Open Mission Lab</button>
      <button class="hbtn s" onclick="nav('courses')">Browse Courses</button>
    </div>
  </div>
  <div class="srow">
    <div class="sbox"><span class="sico">⚡</span><div><div class="sval">${x} XP</div><div class="slbl">Total XP</div></div></div>
    <div class="sbox"><span class="sico">🔥</span><div><div class="sval">${P.str}</div><div class="slbl">Day Streak</div></div></div>
    <div class="sbox"><span class="sico">📚</span><div><div class="sval">${Object.keys(P.done).length}</div><div class="slbl">Lessons Done</div></div></div>
    <div class="sbox" onclick="nav('leaderboard')"><span class="sico">${lg.ico}</span><div><div class="sval">${lg.n}</div><div class="slbl">League</div></div></div>
  </div>
  <div class="mission-strip">
    <div>
      <div class="sec" style="margin:0 0 8px;">New in Syntaxia</div>
      <h2>Mission Lab turns “I want to build X” into a guided coding path.</h2>
      <p>Pick a mission, get a step plan, then use the AI tutor to review your thinking instead of just handing you answers.</p>
    </div>
    <button class="hbtn p" onclick="nav('mission')">Try Mission Lab</button>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;"><div class="sec" style="margin:0;">Featured Courses</div><button onclick="nav('courses')" class="text-btn">View all →</button></div>
  <div class="lgrid" id="hl1" style="margin-top:12px;"></div>
  <div class="sec">More Languages</div>
  <div class="lgrid" id="hl2"></div>`;
  const main=LANGS.filter((_,i)=>i<6), rest=LANGS.filter((_,i)=>i>=6);
  ['hl1','hl2'].forEach((id,idx)=>{
    const g=document.getElementById(id);if(!g)return;
    (idx===0?main:rest).forEach(l=>g.appendChild(mkCard(l)));
  });
}

function mkCard(l){
  const done=LESSONS[l.id].filter(x=>P.done[x.id]).length;
  const total=LESSONS[l.id].length,p=pct(done,total);
  const d=document.createElement('div');d.className='lcard';
  d.innerHTML=`<div class="lico" style="background:${l.bg};border:1px solid ${l.c}33;">${l.ico}</div>
  <div class="lname">${l.n}</div><div class="lsub">${l.codrs} Codders</div>
  <div class="pbar-t" style="height:5px;"><div class="pfill" style="background:${l.c};width:${p}%;height:100%;"></div></div>
  <div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:4px;">${done}/${total} lessons</div>
  ${p===100?'<div class="done-ico">✓</div>':''}
  <div class="lcard-glow" style="background:${l.c};"></div>`;
  d.onclick=()=>openCourse(l);
  return d;
}

// ─── MISSION LAB ───────────────────────────────
function renderMission(){
  const doneCount=Object.keys(P.done).length;
  document.getElementById('mission-pi').innerHTML=`
  <div class="mission-head">
    <div>
      <div class="hero-badge">Not another course catalog</div>
      <h1>Mission Lab</h1>
      <p>Choose a practical build mission. Syntaxia gives you a small project brief, a step-by-step route, and a one-click prompt for the AI tutor.</p>
    </div>
    <div class="mission-orb"><span>${doneCount}</span><small>lessons banked</small></div>
  </div>
  <div class="mission-grid">
    ${MISSIONS.map(m=>`
      <article class="mission-card">
        <div class="mission-top"><span>${m.stack}</span><span>${m.time}</span></div>
        <h2>${m.title}</h2>
        <div class="mission-diff">${m.difficulty}</div>
        <ol>${m.steps.map(s=>`<li>${s}</li>`).join('')}</ol>
        <button class="hbtn p" onclick="startMission('${m.id}')">Start Mission</button>
      </article>
    `).join('')}
  </div>
  <div class="mission-custom">
    <div>
      <h2>Bring your own idea</h2>
      <p>Describe the app, bug, or concept you care about. The tutor will turn it into a beginner-sized route.</p>
    </div>
    <textarea id="mission-custom" placeholder="Example: I want to build a budget calculator in JavaScript"></textarea>
    <button class="hbtn s" onclick="startCustomMission()">Generate route</button>
  </div>`;
}

function startMission(id){
  const m=MISSIONS.find(x=>x.id===id);if(!m)return;
  nav('home');openAI(false);
  const inp=document.getElementById('api-inp');
  const prompt='Create a guided Syntaxia Mission Lab route for me: '+m.prompt+' Keep it beginner-friendly, split it into checkpoints, and ask me to complete checkpoint 1 first.';
  if(inp){inp.value=prompt;updAIBtn();aiSend(prompt);}
}

function startCustomMission(){
  const txt=(document.getElementById('mission-custom')?.value||'').trim();
  if(!txt){toast('Describe a mission first.');return;}
  nav('home');openAI(false);
  const prompt='Turn this into a Syntaxia Mission Lab route: '+txt+'. Give checkpoints, suggested language, and the first tiny task.';
  const inp=document.getElementById('api-inp');
  if(inp){inp.value=prompt;updAIBtn();aiSend(prompt);}
}

// ─── COURSES PAGE ──────────────────────────────
function renderCourses(){
  document.getElementById('courses-pi').innerHTML=`
  <h2 style="font-size:24px;font-weight:900;margin-bottom:4px;">All Courses</h2>
  <p style="color:rgba(255,255,255,.38);font-size:14px;margin-bottom:20px;">Choose a language and begin your journey</p>
  <input class="minp" style="max-width:400px;margin-bottom:20px;" placeholder="Search languages..." oninput="filterC(this.value)" id="cs"/>
  <div class="lgrid" id="cg"></div>`;
  const g=document.getElementById('cg');
  LANGS.forEach(l=>g.appendChild(mkCard(l)));
}
function filterC(q){
  const g=document.getElementById('cg');if(!g)return;g.innerHTML='';
  LANGS.filter(l=>l.n.toLowerCase().includes(q.toLowerCase())).forEach(l=>g.appendChild(mkCard(l)));
}

// ─── COURSE DETAIL ─────────────────────────────
function openCourse(lang){
  curLang=lang;
  document.querySelectorAll('.pg').forEach(p=>p.classList.remove('on'));
  document.getElementById('pg-course').classList.add('on');
  const done=LESSONS[lang.id].filter(l=>P.done[l.id]).length;
  const total=LESSONS[lang.id].length,p=pct(done,total);
  const eXP=LESSONS[lang.id].filter(l=>P.done[l.id]).reduce((s,l)=>s+l.xp,0);
  const tXP=LESSONS[lang.id].reduce((s,l)=>s+l.xp,0);
  document.getElementById('course-pi').innerHTML=`
  <button class="back-btn" onclick="nav('courses')">← Back</button>
  <div class="ch">
    <div class="chico" style="background:${lang.bg};border:1px solid ${lang.c}33;">${lang.ico}</div>
    <div style="flex:1;">
      <h2 style="font-size:24px;font-weight:900;">${lang.n}</h2>
      <div style="font-size:13px;color:rgba(255,255,255,.38);margin-bottom:12px;">${lang.codrs} Codders learning this</div>
      <div class="ch-stats">
        <div class="ch-stat"><div class="ch-sv">${done}/${total}</div><div class="ch-sl">Lessons</div></div>
        <div class="ch-stat"><div class="ch-sv">${eXP}/${tXP}</div><div class="ch-sl">XP Earned</div></div>
        <div class="ch-stat"><div class="ch-sv">${p}%</div><div class="ch-sl">Progress</div></div>
      </div>
      <div class="pbar-t" style="height:6px;max-width:400px;margin-top:14px;"><div class="pfill" style="background:${lang.c};width:${p}%;height:100%;"></div></div>
    </div>
  </div>
  <div class="sec">Lessons</div>
  <div class="lgrid2" id="ll"></div>`;
  const ll=document.getElementById('ll');
  LESSONS[lang.id].forEach(lesson=>{
    const isDone=!!P.done[lesson.id];
    const chip=lesson.lv==='Beginner'?'chip-b':lesson.lv==='Intermediate'?'chip-i':'chip-a';
    const row=document.createElement('div');row.className='lrow';
    row.innerHTML=`<div class="lrow-ico" style="background:${isDone?lang.c+'22':'rgba(255,255,255,.05)'};border:1px solid ${isDone?lang.c:'rgba(255,255,255,.08)'};">${isDone?'✅':'📖'}</div>
    <div style="flex:1;"><div class="lrow-title">${lesson.t}</div><div class="lrow-meta"><span class="${chip}">${lesson.lv}</span><span style="font-size:11px;color:rgba(255,255,255,.35);">⚡ ${lesson.xp} XP</span></div></div>
    <button class="start-btn ${isDone?'done':''}" onclick="openLesson(LANGS.find(x=>x.id==='${lang.id}'),LESSONS['${lang.id}'].find(x=>x.id==='${lesson.id}'))">${isDone?'Review':'Start'}</button>`;
    ll.appendChild(row);
  });
}

// ─── LESSON ────────────────────────────────────
function openLesson(lang,lesson){
  curLang=lang;curLesson=lesson;lesStep='learn';
  lesCode=lesson.starter||'';lesRan=false;qSel=null;qSub=false;
  document.querySelectorAll('.pg').forEach(p=>p.classList.remove('on'));
  document.getElementById('pg-lesson').classList.add('on');
  renderLes();
}

function renderLes(){
  const l=curLang,les=curLesson;
  const chip=les.lv==='Beginner'?'chip-b':les.lv==='Intermediate'?'chip-i':'chip-a';
  document.getElementById('lesson-pi').innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
    <button class="back-btn" style="margin:0;" onclick="openCourse(curLang)">← Back</button>
    <div style="text-align:center;"><div style="font-weight:800;font-size:16px;">${les.t}</div><div style="font-size:12px;color:rgba(255,255,255,.38);">${l.n} · ${les.lv} · <span style="color:${l.c};">⚡ ${les.xp} XP</span></div></div>
    <button class="ai-fab-btn" style="font-size:12px;padding:7px 13px;" onclick="openAI(true)">🤖 Ask AI</button>
  </div>
  <div class="l-tabs-bar">
    ${['learn','code','quiz'].map((s,i)=>`<button class="l-tab ${lesStep===s?'on':''}" onclick="setStep('${s}')">${i+1}. ${s.charAt(0).toUpperCase()+s.slice(1)}</button>`).join('')}
  </div>
  <div id="lbody" class="fin"></div>`;
  renderLesBody();
}

function setStep(s){lesStep=s;renderLes();}

function renderLesBody(){
  const l=curLang,les=curLesson;
  const body=document.getElementById('lbody');if(!body)return;

  if(lesStep==='learn'){
    body.innerHTML=`<div class="l-layout">
      <div>
        <div class="lpanel" style="margin-bottom:14px;">
          <div class="lptit" style="color:${l.c};">📚 Lesson</div>
          <div class="lptxt">${les.exp}</div>
        </div>
        <div class="task-box" style="background:${l.bg};border:1px solid ${l.c}33;">
          <div class="lptit" style="color:${l.c};">🎯 Your Task</div>
          <div style="font-size:13px;color:rgba(255,255,255,.6);line-height:1.65;">${les.task}</div>
        </div>
      </div>
      <div class="lpanel">
        <div class="lptit">💡 Tips</div>
        <ul style="font-size:13px;color:rgba(255,255,255,.5);line-height:2;padding-left:18px;">
          <li>Read the explanation carefully</li>
          <li>Try writing the code yourself first</li>
          <li>Only peek at the solution as a last resort</li>
          <li>Use 🤖 Ask AI for hints, not answers</li>
        </ul>
      </div>
    </div>
    <div style="margin-top:18px;">
      <button onclick="setStep('code')" style="background:${l.c};color:#fff;border:none;border-radius:12px;padding:13px 28px;font-weight:800;font-size:15px;">Let's Code! →</button>
    </div>`;
  }

  else if(lesStep==='code'){
    const escaped=lesCode.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    body.innerHTML=`<div class="l-layout">
      <div>
        <div class="codewrap">
          <div class="codetbar">
            <span class="cdot" style="background:#EF4444;"></span>
            <span class="cdot" style="background:#F59E0B;"></span>
            <span class="cdot" style="background:#22C55E;"></span>
            <span class="cfile">lesson.${l.ext}</span>
          </div>
          <textarea class="ced" id="ced">${escaped}</textarea>
        </div>
        <button class="run-btn" onclick="runCode()">▶ Run Code</button>
        ${lesRan?`<div class="outbox">${les.out}</div><div class="sban">✅ Output matches! Well done!</div><button onclick="setStep('quiz')" style="width:100%;background:${l.c};color:#fff;border:none;border-radius:12px;padding:13px;font-weight:800;font-size:14px;margin-top:8px;">Take the Quiz →</button>`:''}
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
    const ed=document.getElementById('ced');
    if(ed)ed.addEventListener('input',e=>{lesCode=e.target.value;});
  }

  else {
    const q=les.quiz,sel=qSel,sub=qSub,cor=sel===q.ans;
    body.innerHTML=`<div style="max-width:620px;">
      <div class="lpanel">
        <div class="lptit" style="color:${l.c};">⚡ Quick Quiz</div>
        <div style="font-weight:700;font-size:17px;margin-bottom:18px;line-height:1.4;">${q.q}</div>
        ${q.opts.map((o,i)=>{
          let cls='qopt';
          if(sub){if(i===q.ans)cls+=' cor';else if(i===sel)cls+=' wrng';}
          else if(i===sel)cls+=' sel';
          return `<button class="${cls}" onclick="selQ(${i})" ${sub?'disabled':''}><span class="qlet">${String.fromCharCode(65+i)}</span>${o}</button>`;
        }).join('')}
        ${!sub
          ?`<button class="check-btn" onclick="subQ()" ${sel===null?'disabled':''}>Check Answer</button>`
          :`<div style="background:${cor?'#031A0F':'#1A0505'};border:1px solid ${cor?'#22C55E':'#EF4444'};border-radius:11px;padding:11px 14px;color:${cor?'#4ADE80':'#F87171'};font-weight:700;font-size:13px;margin-top:8px;">${cor?'🎉 Correct!':'❌ Answer: '+q.opts[q.ans]}</div>
           <button class="next-btn" onclick="claimXP()" style="background:${l.c};">${cor?'Claim XP & Continue 🎯':'Continue Anyway →'}</button>`
        }
      </div>
    </div>`;
  }
}

function runCode(){
  const ed=document.getElementById('ced');if(ed)lesCode=ed.target?ed.target.value:document.getElementById('ced').value;
  const starter=(curLesson.starter||'').trim();
  if(!lesCode.trim()||lesCode.trim()===starter){toast('✏️ Write your code first!');return;}
  lesRan=true;renderLesBody();
}
function showSol(){
  if(!confirm('Show solution? Try your best first! 💪'))return;
  lesCode=curLesson.code;
  const ed=document.getElementById('ced');if(ed){ed.value=lesCode;}
  toast('Solution loaded — study and practice it! 📚');
}
function selQ(i){if(qSub)return;qSel=i;renderLesBody();}
function subQ(){if(qSel===null)return;qSub=true;renderLesBody();}
function claimXP(){
  const les=curLesson;
  if(!P.done[les.id]){
    P.done[les.id]=true;P.xp+=les.xp;saveP();
    showXP(les.xp);toast('Progress saved.');
  }
  setTimeout(()=>openCourse(curLang),350);
}

// ─── LEADERBOARD ───────────────────────────────
function renderLB(){
  const pi=document.getElementById('lb-pi');
  pi.innerHTML=`<h2 style="font-size:24px;font-weight:900;margin-bottom:4px;">🏆 Leagues</h2>
  <p style="color:rgba(255,255,255,.38);font-size:14px;margin-bottom:20px;">Compete weekly with coders worldwide</p>
  <div class="ltabs" id="ltabs"></div>
  <div class="lb-layout"><div class="lb-panel" id="lbpanel"></div><div id="lbside"></div></div>`;
  const tabs=document.getElementById('ltabs');
  LEAGUES.forEach(lg=>{
    const b=document.createElement('button');b.className='ltab';
    if(lbTab===lg.id){b.style.background=lg.col+'22';b.style.borderColor=lg.col+'66';b.style.color=lg.col;}
    b.innerHTML=lg.ico+' '+lg.n;b.onclick=()=>{lbTab=lg.id;renderLB();};
    tabs.appendChild(b);
  });
  const lg=LEAGUES.find(l=>l.id===lbTab);
  const users=LB.filter(u=>u.xp>=lg.min&&u.xp<lg.max).sort((a,b)=>b.xp-a.xp);
  const myXP=P.xp,inL=myXP>=lg.min&&myXP<lg.max;
  LB.find(u=>u.me).xp=myXP;
  const show=inL?users:[...users,...(lbTab==='rookie'?[LB.find(u=>u.me)]:[])].sort((a,b)=>b.xp-a.xp);
  const panel=document.getElementById('lbpanel');
  panel.innerHTML=`<div class="lb-hdr">${lg.ico} ${lg.n} League · ${show.length} coders</div>`;
  show.forEach((u,i)=>{
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    const row=document.createElement('div');row.className='lbr'+(u.me?' me':'');
    row.innerHTML=`<div class="lb-rank">${medal.length>2?medal:'<span style="font-size:18px;">'+medal+'</span>'}</div>
    <img src="${av(u.av)}" class="lb-av"/><div style="flex:1;"><div style="font-size:14px;font-weight:700;">${u.me?'⭐ You':u.c+' '+u.n}</div><div style="font-size:12px;color:rgba(255,255,255,.35);">🔥 ${u.str} day streak</div></div><div class="lb-pts">${u.xp.toLocaleString()} XP</div>`;
    panel.appendChild(row);
  });
  if(!show.length)panel.innerHTML+=`<div style="padding:30px;text-align:center;color:rgba(255,255,255,.3);">No coders in this league yet. Be the first!</div>`;
  document.getElementById('lbside').innerHTML=`
  <div class="card" style="background:${lg.col}11;border-color:${lg.col}33;margin-bottom:12px;">
    <div style="font-size:44px;margin-bottom:10px;">${lg.ico}</div>
    <div style="font-size:19px;font-weight:900;color:${lg.col};margin-bottom:4px;">${lg.n} League</div>
    <div style="font-size:13px;color:rgba(255,255,255,.38);line-height:1.6;margin-bottom:10px;">${lg.desc}</div>
    <div style="font-size:12px;color:rgba(255,255,255,.28);">Requires ${lg.min.toLocaleString()}+ XP</div>
  </div>
  <div class="card">
    <div style="font-weight:700;margin-bottom:8px;">Your Status</div>
    <div style="font-size:13px;color:rgba(255,255,255,.38);line-height:1.6;margin-bottom:10px;">${inL?'You\'re in this league with '+myXP+' XP!':'Reach '+lg.min.toLocaleString()+' XP to join.'}</div>
    <div class="pbar-t" style="height:6px;"><div class="pfill" style="background:${lg.col};width:${Math.min(100,(myXP/Math.max(1,lg.max))*100)}%;height:100%;"></div></div>
  </div>`;
}

// ─── PROFILE ───────────────────────────────────
function renderProfile(){
  updNav();
  const x=P.xp,lg=league(x);
  document.getElementById('profile-pi').innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
    <h2 style="font-size:24px;font-weight:900;">👤 Profile</h2>
    <button title="Settings" onclick="showSettings()" style="width:38px;height:38px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .2s;" onmouseover="this.style.background='rgba(255,255,255,.18)'" onmouseout="this.style.background='rgba(255,255,255,.07)'"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
  </div>
  <div class="pl">
    <div>
      <div class="pcard" style="margin-bottom:12px;">
        <img src="${av('user123')}" class="pav"/>
        <div class="pname" id="pname">You</div>
        <div class="ph">@syntaxia_learner</div>
        <div class="psg">
          <div class="ps"><div class="psv">${x}</div><div class="psl">XP</div></div>
          <div class="ps"><div class="psv">${P.str}</div><div class="psl">Streak 🔥</div></div>
          <div class="ps"><div class="psv">${Object.keys(P.done).length}</div><div class="psl">Lessons</div></div>
        </div>
        <div class="card" style="text-align:left;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-weight:700;">League</span><span style="color:#F59E0B;font-weight:700;">${lg.ico} ${lg.n}</span></div>
          <div class="pbar-t" style="height:6px;"><div class="pfill" style="background:${lg.col};width:${Math.min(100,((x-lg.min)/Math.max(1,lg.max-lg.min))*100)}%;height:100%;"></div></div>
          <div style="font-size:12px;color:rgba(255,255,255,.3);margin-top:6px;">${x} XP · ${lg.n} League</div>
        </div>
        <button onclick="showSettings()" class="msec" style="width:100%;margin:0;">Edit Profile</button>
      </div>
      <div class="card">
        <div style="font-weight:800;margin-bottom:12px;">🏅 Badges</div>
        <div class="bdgrid">${BADGES.map(b=>`<div class="bdg"><div style="font-size:21px;">${b.ico}</div><div style="font-size:10px;color:rgba(255,255,255,.35);font-weight:600;margin-top:4px;">${b.l}</div></div>`).join('')}</div>
      </div>
    </div>
    <div>
      <div class="card">
        <div style="font-weight:800;margin-bottom:14px;">📈 Course Progress</div>
        <div id="prog-list"></div>
      </div>
    </div>
  </div>`;
  const pl=document.getElementById('prog-list');let any=false;
  LANGS.forEach(l=>{
    const done=LESSONS[l.id].filter(x=>P.done[x.id]).length;if(!done)return;any=true;
    const total=LESSONS[l.id].length,p=pct(done,total);
    const d=document.createElement('div');
    d.style.cssText='display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06);cursor:pointer;';
    d.innerHTML=`<div style="width:32px;height:32px;border-radius:9px;background:${l.bg};border:1px solid ${l.c}33;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${l.ico}</div>
    <div style="flex:1;"><div style="font-weight:700;font-size:14px;margin-bottom:4px;">${l.n}</div><div class="pbar-t" style="height:5px;"><div class="pfill" style="background:${l.c};width:${p}%;height:100%;"></div></div></div>
    <span style="font-size:13px;font-weight:800;color:${l.c};">${p===100?'✓':p+'%'}</span>`;
    d.onclick=()=>openCourse(l);pl.appendChild(d);
  });
  if(!any)pl.innerHTML='<div style="color:rgba(255,255,255,.3);text-align:center;padding:24px;">Start a course to see progress here!</div>';
}

// ─── SETTINGS ──────────────────────────────────
function showSettings(){
  document.getElementById('settings-m').classList.add('on');
}
function saveSettings(){
  const n=document.getElementById('name-inp').value.trim();
  if(n){const pn=document.getElementById('pname');if(pn)pn.textContent=n;}
  closeM('settings-m');
  toast('✅ Settings saved!');
}

// ─── MODALS ────────────────────────────────────
function closeM(id){document.getElementById(id).classList.remove('on');}
document.querySelectorAll('.moverlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('on');}));

// ─── AI INLINE PANEL ──────────────────────────
let aiMsgs=[],aiLoad=false,aiCtx=false;
window._chips=[];

function initAIPanel(){
  aiMsgs=[];aiLoad=false;aiCtx=false;
  const greet='Hey! 👋 I am your **Syntaxia AI Tutor**!\n\nI can help with Python 🐍, JavaScript 💛, Java ☕, SQL 🗄️ and '+LANGS.length+' more languages!\n\nWhat would you like to learn? 🚀';
  aiMsgs=[{r:'a',t:greet}];
  window._chips=['How do I start Python?','Explain variables','What is a function?','Best beginner language?'];
  renderAI();updAIBtn();
}

function setAILessonCtx(lesson,lang){
  aiCtx=true;
  if(lesson)document.getElementById('ai-sub').textContent='Helping with: '+lesson.t;
}

function clearAIChat(){
  aiMsgs=[];aiCtx=false;
  document.getElementById('ai-sub').textContent='Ready to help';
  initAIPanel();
}

function openAI(lesson){
  if(lesson&&curLesson)setAILessonCtx(curLesson,curLang);
}

function renderAI(){
  const c=document.getElementById('ai-panel-msgs');
  if(!c)return;
  c.innerHTML='';
  aiMsgs.forEach(m=>{
    const row=document.createElement('div');row.className='amr'+(m.r==='u'?' u':'');
    const av2=document.createElement('div');av2.className='ami '+(m.r==='a'?'bot':'usr');av2.textContent=m.r==='a'?'🤖':'👤';
    const bub=document.createElement('div');bub.className='abub'+(m.r==='u'?' u':'');bub.innerHTML=fmtAI(m.t);
    if(m.r==='a'){row.appendChild(av2);row.appendChild(bub);}else{row.appendChild(bub);row.appendChild(av2);}
    c.appendChild(row);
  });
  if(aiLoad){
    const row=document.createElement('div');row.className='amr';
    row.innerHTML='<div class="ami bot">🤖</div><div class="abub" style="padding:10px 13px;display:flex;gap:5px;align-items:center;"><div class="ddot" style="animation-delay:0s"></div><div class="ddot" style="animation-delay:.2s"></div><div class="ddot" style="animation-delay:.4s"></div></div>';
    c.appendChild(row);
  }
  requestAnimationFrame(()=>{c.scrollTop=c.scrollHeight;});
  const cc=document.getElementById('ai-panel-chips');
  if(cc&&aiMsgs.filter(m=>m.r==='u').length===0){
    cc.innerHTML=window._chips.map((q,i)=>
      `<button class="apc" data-i="${i}" onclick="chipSend(this)">${q}</button>`
    ).join('');
  } else if(cc&&aiMsgs.filter(m=>m.r==='u').length>0){
    cc.innerHTML='';
  }
}

function fmtAI(raw){
  const parts=raw.split(/(```[\s\S]*?```)/g);
  return parts.map(p=>{
    if(p.startsWith('```')&&p.endsWith('```')){
      const inner=p.slice(3,-3).replace(/^\w+\n?/,'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return '<pre class="cb">'+inner+'</pre>';
    }
    const lines=p.split('\n');let html='',buf=[];
    const flush=()=>{if(buf.length){html+='<p>'+buf.join(' ')+'</p>';buf=[];}};
    lines.forEach(line=>{
      if(!line.trim()){flush();}
      else{buf.push(line.trim().replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/`([^`]+)`/g,'<code class="ic">$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong style="color:#fff;">$1</strong>'));}
    });
    flush();return html;
  }).join('');
}

function chipSend(btn){const q=window._chips[parseInt(btn.dataset.i)];if(q)aiSend(q);}

async function aiSend(preset){
  const inp=document.getElementById('api-inp');
  const txt=(preset||inp.value).trim();if(!txt||aiLoad)return;
  inp.value='';
  const isL=aiCtx&&!!curLesson;
  const prompt=isL?'[Lesson: "'+curLesson.t+'" ('+curLang.n+'). Task: '+curLesson.task+']\n\n'+txt:txt;
  aiMsgs.push({r:'u',t:txt});aiLoad=true;renderAI();updAIBtn();

  const rawHistory=aiMsgs.slice(0,-1).filter(m=>m.t);
  const messages=[
    {role:'system',content:isL?SYS_LES:SYS_GEN},
    ...rawHistory.map(m=>({role:m.r==='u'?'user':'assistant',content:m.t})),
    {role:'user',content:prompt}
  ];

  let reply='',lastErr='';
  try{
    const res=await fetch('/api/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages})
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(data.error||'error '+res.status);
    reply=(data.reply||'').trim();
  }catch(e){
    lastErr=e.message||'fetch failed';
  }

  if(reply){
    aiMsgs.push({r:'a',t:reply});
  }else{
    const isFile=location.protocol==='file:';
    const isCORS=lastErr.toLowerCase().includes('fetch')||lastErr.toLowerCase().includes('network')||lastErr.toLowerCase().includes('cors');
    let msg='⚠️ **AI Tutor unavailable.**\n\n'+lastErr;
    if(isFile&&isCORS)
      msg='⚠️ **Server needed.**\n\nThe AI Tutor now uses a secure `/api/chat` endpoint, so it needs Vercel or a local serverless dev server.\n\n**Quick fix:** run:\n```\nvercel dev\n```';
    else if(isCORS)
      msg='⚠️ **Connection failed.**\n\nYour network blocked the request. Check your internet connection and try again.';
    else if(lastErr.includes('GROQ_API_KEY'))
      msg='🔑 **AI key missing.**\n\nAsk the site owner to add `GROQ_API_KEY` in Vercel Project Settings → Environment Variables.';
    else if(lastErr.includes('quota')||lastErr.includes('429')||lastErr.includes('rate limit'))
      msg='⏳ **Rate limit reached.**\n\nWait 60 seconds then try again.';
    else if(lastErr.includes('401')||lastErr.includes('403'))
      msg='🔑 **AI key rejected.**\n\nAsk the site owner to check the Groq key in Vercel.';
    aiMsgs.push({r:'a',t:msg});
  }
  aiLoad=false;renderAI();updAIBtn();
  const i=document.getElementById('api-inp');if(i)i.focus();
}

function updAIBtn(){
  const inp=document.getElementById('api-inp'),btn=document.getElementById('api-sbtn');
  if(!inp||!btn)return;
  const ok=inp.value.trim()&&!aiLoad;
  btn.disabled=!ok;btn.style.opacity=ok?'1':'.28';
  btn.textContent=aiLoad?'…':'↑';
  inp.style.borderColor=inp.value?'#8B5CF6':'rgba(255,255,255,.08)';
}

// ─── EXPOSE FOR INLINE ONCLICK HANDLERS ───────
window.LANGS = LANGS;
window.LESSONS = LESSONS;
Object.defineProperty(window, 'curLang', { get: () => curLang, configurable: true });
Object.assign(window, {
  go, nav, showSettings, closeM, saveSettings, clearAIChat, aiSend, updAIBtn,
  openCourse, openLesson, setStep, runCode, openAI, showSol, selQ, subQ, claimXP,
  filterC, startMission, startCustomMission, chipSend, renderHome, renderCourses,
  renderMission, renderLB, renderProfile
});

// ─── INIT ──────────────────────────────────────
renderHome();
