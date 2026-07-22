import { describe, it, expect } from 'vitest';
import { shouldEnableCustomCursor } from '../src/features/cursor.js';

describe('shouldEnableCustomCursor', () => {
  it('enabled when setting on, no reduced motion, not touch', () => {
    expect(shouldEnableCustomCursor(true, false, false)).toBe(true);
  });
  it('disabled when setting off', () => {
    expect(shouldEnableCustomCursor(false, false, false)).toBe(false);
  });
  it('disabled under prefers-reduced-motion', () => {
    expect(shouldEnableCustomCursor(true, true, false)).toBe(false);
  });
  it('disabled on touch / coarse pointers', () => {
    expect(shouldEnableCustomCursor(true, false, true)).toBe(false);
  });
});
