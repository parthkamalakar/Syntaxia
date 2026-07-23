// Gamification configurations: Leagues, Achievements, Shop Items, and Quests
export const LEAGUES=[
  {id:'bronze',   n:'Bronze',      ico:'🥉', col:'#CD7F32', min:0,     max:500,    desc:'Just getting started!'},
  {id:'silver',   n:'Silver',      ico:'🥈', col:'#C0C0C0', min:500,   max:1200,   desc:'Climbing the ladder!'},
  {id:'gold',     n:'Gold',        ico:'🥇', col:'#FFD700', min:1200,  max:2200,   desc:'Showing real potential!'},
  {id:'platinum', n:'Platinum',    ico:'💿', col:'#E5E4E2', min:2200,  max:3500,   desc:'Polishing your logic!'},
  {id:'diamond',  n:'Diamond',     ico:'💎', col:'#B9F2FF', min:3500,  max:5000,   desc:'Shining under pressure!'},
  {id:'master',   n:'Master',      ico:'🔮', col:'#9B5DE5', min:5000,  max:7000,   desc:'Master of core concepts!'},
  {id:'grandmaster',n:'Grandmaster',ico:'👑',col:'#F15BB5', min:7000,  max:9500,   desc:'Elite structural architect!'},
  {id:'legend',   n:'Legend',      ico:'🐉', col:'#00F5D4', min:9500,  max:12500,  desc:'Writing code like poetry!'},
  {id:'mythic',   n:'Mythic',      ico:'🔥', col:'#FF006E', min:12500, max:16000,  desc:'Beyond ordinary boundaries!'},
  {id:'radiant',  n:'Radiant',     ico:'⚡', col:'#3A86C8', min:16000, max:999999, desc:'Infinite compiler awareness!'},
];

export const BADGES=[
  {id:'first_code', ico:'🚀', l:'First Code',    desc:'Run code successfully', check:(P)=>Object.keys(P.done||{}).length>=1},
  {id:'py_master',  ico:'🐍', l:'Python Master',  desc:'Complete all Python nodes', check:(P)=>Object.keys(P.done||{}).filter(id=>id.startsWith('py')).length>=3},
  {id:'js_wizard',  ico:'🧙‍♂️', l:'JS Wizard',     desc:'Complete all JavaScript nodes', check:(P)=>Object.keys(P.done||{}).filter(id=>id.startsWith('js')).length>=3},
  {id:'bug_hunter', ico:'🐞', l:'Bug Hunter',    desc:'Win 3 or more Debug Races', check:(P)=>(P.unlockedAchievements||[]).includes('bug_hunter_drill')},
  {id:'night_owl',  ico:'🦉', l:'Night Owl',     desc:'Complete a lesson after 10 PM', check:(P)=>true}, // Simulated/triggered on action
  {id:'early_bird', ico:'🌅', l:'Early Bird',    desc:'Complete a lesson before 7 AM', check:(P)=>true},
  {id:'legendary',  ico:'👑', l:'Legend Status', desc:'Reach Level 10', check:(P)=>Math.floor((P.xp||0)/100)+1>=10},
  {id:'collector',  ico:'🛍️', l:'Collector',     desc:'Unlock 3 shop items', check:(P)=>(P.purchasedThemes||[]).length+(P.purchasedCursors||[]).length>=3},
  {id:'perfect_les',ico:'⭐', l:'Perfect Lesson',desc:'Get 100% on a Final Exam', check:(P)=>true},
];

export const SHOP_ITEMS={
  themes: [
    {id:'default',   n:'Classic Obsidian', desc:'Default deep dark theme', cost:0, col:'#0B0C10', text:'#fff'},
    {id:'cyberpunk', n:'Cyberpunk Neon',   desc:'Hyper neon purple and yellow', cost:100, col:'#120422', text:'#ff0055'},
    {id:'matrix',    n:'Matrix Green',     desc:'Retro green terminal environment', cost:120, col:'#020d04', text:'#00ff33'},
    {id:'vaporwave', n:'Vaporwave Sunset',  desc:'Soft magenta and cyan gradient', cost:150, col:'#1d0e2e', text:'#ff00ff'},
  ],
  cursors: [
    {id:'default', n:'Standard pointer', desc:'Normal operating cursor', cost:0, col:'#fff'},
    {id:'neon',    n:'Neon Spark',       desc:'A vibrant glowing energy dot', cost:50, col:'#8B5CF6'},
    {id:'crosshair',n:'Retro Crosshair', desc:'A pixelated green crosshair', cost:80, col:'#22C55E'},
  ],
  pets: [
    {id:'synny',    n:'Synny Bot',       desc:'Helper robot floaty mascot', cost:200, ico:'🤖'},
    {id:'dragon',   n:'Byte Dragon',     desc:'Tiny digital firebreather', cost:300, ico:'🐉'},
    {id:'logic_cat',n:'Logic Cat',       desc:'Stares at compiler bugs', cost:250, ico:'🐱'},
  ],
  titles: [
    {id:'syntax_king', n:'Syntax Overlord',  desc:'Equip a title on profile', cost:80},
    {id:'infinite',    n:'Infinite Looper',  desc:'Equip a title on profile', cost:90},
    {id:'whisperer',   n:'Code Whisperer',   desc:'Equip a title on profile', cost:100},
  ],
  consumables: [
    {id:'freeze', n:'Streak Freeze',   desc:'Protects streak if you miss a day', cost:75, ico:'❄️'},
    {id:'repair', n:'Streak Repair',   desc:'Restore a broken day streak', cost:150, ico:'🔧'},
  ]
};

export const QUESTS={
  daily: [
    {id:'q_d1', title:'Complete a Lesson', desc:'Finish any lesson or challenge', xp:15, coins:20},
    {id:'q_d2', title:'Syntax Practice', desc:'Attempt any mini-game once', xp:20, coins:25},
  ],
  weekly: [
    {id:'q_w1', title:'Boss Defeated', desc:'Defeat a Chapter Boss Battle', xp:50, coins:100},
    {id:'q_w2', title:'Knowledge Harvester', desc:'Accumulate 150 total XP', xp:60, coins:120},
  ]
};

export const LB=[
  {n:'Arjun Sharma',   xp:4850,av:'arjun99',  c:'🇮🇳',str:45},
  {n:'Maria Santos',   xp:4720,av:'maria88',  c:'🇧🇷',str:38},
  {n:'Liam O\'Brien',  xp:4410,av:'liam77',   c:'🇮🇪',str:32},
  {n:'Yuki Tanaka',    xp:4200,av:'yuki66',   c:'🇯🇵',str:29},
  {n:'Fatima Al-Rashid',xp:3980,av:'fatima55',c:'🇸🇦',str:27},
  {n:'Carlos Mendez',  xp:3750,av:'carlos44', c:'🇲🇽',str:24},
  {n:'Sophie Müller',  xp:3600,av:'sophie33', c:'🇩🇪',str:22},
  {n:'Kwame Asante',   xp:3400,av:'kwame22',  c:'🇬🇭',str:20},
  {n:'Priya Patel',    xp:3200,av:'priya11',  c:'🇮🇳',str:18},
  {n:'Jake Williams',  xp:3050,av:'jake00',   c:'🇺🇸',str:16},
  {n:'Mei Chen',       xp:2900,av:'mei99',    c:'🇨🇳',str:14},
  {n:'Omar Hassan',    xp:2750,av:'omar88',   c:'🇪🇬',str:12},
  {n:'Emma Thompson',  xp:2600,av:'emma77',   c:'🇬🇧',str:11},
  {n:'Ravi Kumar',     xp:2450,av:'ravi66',   c:'🇮🇳',str:10},
  {n:'Ana Pereira',    xp:2300,av:'ana55',    c:'🇵🇹',str:9},
  {n:'Sven Lindqvist', xp:2150,av:'sven44',   c:'🇸🇪',str:8},
  {n:'Amara Diallo',   xp:2000,av:'amara33',  c:'🇸🇳',str:7},
  {n:'Hiroshi Kato',   xp:1850,av:'hiroshi22',c:'🇯🇵',str:6},
  {n:'Isabella Rossi', xp:1700,av:'isabella11',c:'🇮🇹',str:6},
  {n:'Diego Vargas',   xp:1550,av:'diego00',  c:'🇨🇴',str:5},
  {n:'Zara Ahmed',     xp:1400,av:'zara99',   c:'🇵🇰',str:5},
  {n:'Lucas Bernard',  xp:1250,av:'lucas88',  c:'🇫🇷',str:4},
  {n:'You',            xp:0,   av:'user123',  c:'⭐', str:3,me:true},
];

export const MISSIONS=[
  {
    id:'portfolio',
    title:'Ship a portfolio homepage',
    stack:'HTML + CSS',
    time:'45 min',
    difficulty:'Beginner',
    prompt:'Help me build a portfolio homepage with an intro, project cards, and contact section.',
    steps:['Sketch the sections','Create semantic HTML','Style a responsive layout','Ask AI for a polish review']
  },
  {
    id:'habit',
    title:'Build a habit tracker',
    stack:'JavaScript',
    time:'70 min',
    difficulty:'Intermediate',
    prompt:'Guide me through making a small habit tracker with localStorage.',
    steps:['Model habits as data','Render a daily checklist','Persist state in localStorage','Add streak feedback']
  },
  {
    id:'debug',
    title:'Debug a broken function',
    stack:'Python',
    time:'25 min',
    difficulty:'Beginner',
    prompt:'Give me a debugging drill for a beginner Python function.',
    steps:['Read the failing output','Trace values by hand','Add print checks','Explain the fix']
  }
];
