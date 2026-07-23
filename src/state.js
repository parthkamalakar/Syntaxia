// Central app state. The ONLY module that touches localStorage['syn_prog'].
const KEY = 'syn_prog';

const DEFAULTS = {
  name: 'You',
  title: 'Script Initiate',
  done: {},
  xp: 0,
  str: 0,
  longestStr: 0,
  coins: 200,
  gems: 10,
  level: 1,
  purchasedThemes: ['default'],
  purchasedCursors: ['default'],
  equippedTheme: 'default',
  equippedCursor: 'default',
  unlockedAchievements: [],
  completedQuests: {}, // 'YYYY-MM-DD': [questIds]
  friends: [],
  messages: [],
  lastActive: null, // ISO 'YYYY-MM-DD' of last lesson completion
  avatar: { style: 'avataaars', seed: 'user', bg: '0b0c10', options: {} },
  settings: { customCursor: true },
};

export function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO + 'T00:00:00');
  const b = new Date(toISO + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

// Mutates and returns P. todayISO is 'YYYY-MM-DD'.
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
  if ((P.str || 0) > (P.longestStr || 0)) {
    P.longestStr = P.str;
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
    purchasedThemes: [...new Set([...DEFAULTS.purchasedThemes, ...(parsed.purchasedThemes || [])])],
    purchasedCursors: [...new Set([...DEFAULTS.purchasedCursors, ...(parsed.purchasedCursors || [])])],
    unlockedAchievements: [...new Set([...(parsed.unlockedAchievements || [])])],
    completedQuests: { ...(parsed.completedQuests || {}) },
    friends: [...(parsed.friends || [])],
    messages: [...(parsed.messages || [])],
    avatar: {
      ...DEFAULTS.avatar,
      ...(parsed.avatar || {}),
      options: { ...(parsed.avatar?.options || {}) },
    },
    settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
  };
  // Migrate the legacy hardcoded streak: without a lastActive date it was meaningless.
  if (!merged.lastActive) merged.str = 0;
  return merged;
}

export function saveP() {
  try {
    localStorage.setItem(KEY, JSON.stringify(P));
  } catch (e) {
    /* ignore quota / private mode errors */
  }
}

export function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const P = hydrate();
export default P;
