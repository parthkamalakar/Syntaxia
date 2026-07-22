import { describe, it, expect } from 'vitest';
import { avatarURL } from '../src/features/avatar.js';

describe('avatarURL', () => {
  it('builds a dicebear url with seed and background', () => {
    const u = avatarURL({ seed: 'abc', bg: 'ffffff' });
    expect(u.startsWith('https://api.dicebear.com/7.x/avataaars/svg?')).toBe(true);
    expect(u).toContain('seed=abc');
    expect(u).toContain('backgroundColor=ffffff');
  });
  it('uses the chosen style', () => {
    expect(avatarURL({ seed: 'x', style: 'bottts' })).toContain('/7.x/bottts/svg?');
  });
  it('includes part options when set', () => {
    expect(avatarURL({ seed: 'x', options: { mouth: 'smile' } })).toContain('mouth=smile');
  });
  it('omits empty options', () => {
    expect(avatarURL({ seed: 'x', options: { mouth: '' } })).not.toContain('mouth=');
  });
  it('applies defaults when given no config', () => {
    const u = avatarURL();
    expect(u).toContain('seed=user');
    expect(u).toContain('backgroundColor=0b0c10');
  });
});
