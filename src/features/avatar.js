// DiceBear avatar URL builder + option sets.
// Param names/values verified against DiceBear 7.x (avataaars part params,
// lowercase). Part options only visibly affect the 'avataaars' style; other
// styles ignore them, which is fine.

export const AVATAR_STYLES = [
  { id: 'avataaars', label: '🧑 Person', parts: true },
  { id: 'bottts', label: '🤖 Robot', parts: false },
  { id: 'fun-emoji', label: '😀 Emoji', parts: false },
  { id: 'thumbs', label: '👍 Thumb', parts: false },
  { id: 'pixel-art', label: '🎮 Pixel', parts: false },
  { id: 'identicon', label: '🔷 Geo', parts: false },
];

export const BG_COLORS = [
  '0b0c10', '5B6BF8', 'b7ff5a', 'F59E0B', 'EF4444',
  '22C55E', '8B5CF6', '06B6D4', 'ffffff', 'EC4899',
];

// [value, label]; '' = use the seed default.
export const AVATAR_MOUTH = [
  ['', 'Default'], ['smile', 'Smile'], ['sad', 'Sad'], ['tongue', 'Tongue'],
  ['eating', 'Eating'], ['grimace', 'Grimace'], ['disbelief', 'Shocked'],
];
export const AVATAR_EYES = [
  ['', 'Default'], ['happy', 'Happy'], ['wink', 'Wink'], ['surprised', 'Surprised'],
  ['cry', 'Cry'], ['squint', 'Squint'],
];
export const AVATAR_EYEBROWS = [['', 'Default'], ['angry', 'Angry']];
export const AVATAR_TOP = [['', 'None'], ['hat', 'Hat'], ['hijab', 'Hijab']];

export function avatarURL(cfg) {
  const c = { style: 'avataaars', seed: 'user', bg: '0b0c10', options: {}, ...(cfg || {}) };
  const p = new URLSearchParams();
  p.set('seed', c.seed);
  p.set('backgroundColor', c.bg);
  for (const [k, v] of Object.entries(c.options || {})) {
    if (v) p.set(k, v);
  }
  return `https://api.dicebear.com/7.x/${c.style}/svg?${p.toString()}`;
}

export function randomSeed() {
  return 's' + Math.random().toString(36).slice(2, 9);
}

export function randomAvatarConfig() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const val = (a) => { const x = pick(a.filter((o) => o[0])); return x ? x[0] : ''; };
  return {
    style: 'avataaars',
    seed: randomSeed(),
    bg: pick(BG_COLORS),
    options: {
      mouth: val(AVATAR_MOUTH),
      eyes: val(AVATAR_EYES),
      top: Math.random() < 0.3 ? 'hat' : '',
    },
  };
}
