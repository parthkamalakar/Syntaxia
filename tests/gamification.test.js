import { describe, it, expect } from 'vitest';
import { LEAGUES, BADGES } from '../src/data/gamification.js';

// Replicate helper logic from app.js to test pure functions
function lvl(xp) { return Math.floor(xp / 100) + 1; }
function league(xp) { return LEAGUES.find(l => xp >= l.min && xp < l.max) || LEAGUES[0]; }

describe('Gamification Progression Logic', () => {
  it('should calculate level correctly from XP', () => {
    expect(lvl(0)).toBe(1);
    expect(lvl(99)).toBe(1);
    expect(lvl(100)).toBe(2);
    expect(lvl(150)).toBe(2);
    expect(lvl(1000)).toBe(11);
  });

  it('should assign correct league based on XP boundaries', () => {
    const rookieLeague = league(100);
    expect(rookieLeague.id).toBe('bronze');
    
    const silverLeague = league(600);
    expect(silverLeague.id).toBe('silver');
    
    const radiantLeague = league(50000);
    expect(radiantLeague.id).toBe('radiant');
  });

  it('should evaluate badge unlocking conditions', () => {
    const dummyState1 = {
      done: {},
      xp: 0,
      purchasedThemes: ['default'],
      purchasedCursors: ['default']
    };
    
    const dummyState2 = {
      done: { 'py1': true, 'py2': true, 'py3': true },
      xp: 600,
      purchasedThemes: ['default', 'cyberpunk'],
      purchasedCursors: ['default', 'neon']
    };

    // First Code Badge
    const firstCodeBadge = BADGES.find(b => b.id === 'first_code');
    expect(firstCodeBadge.check(dummyState1)).toBe(false);
    expect(firstCodeBadge.check(dummyState2)).toBe(true);

    // Python Master Badge
    const pyMasterBadge = BADGES.find(b => b.id === 'py_master');
    expect(pyMasterBadge.check(dummyState1)).toBe(false);
    expect(pyMasterBadge.check(dummyState2)).toBe(true);

    // Collector Badge
    const collectorBadge = BADGES.find(b => b.id === 'collector');
    expect(collectorBadge.check(dummyState1)).toBe(false);
    expect(collectorBadge.check(dummyState2)).toBe(true);
  });
});
