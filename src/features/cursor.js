// Custom cursor with OS-cursor hide. Guards: reduced-motion, touch, and a Settings toggle.
import P from '../state.js';

export function shouldEnableCustomCursor(setting, prefersReducedMotion, isTouch) {
  if (!setting) return false;
  if (prefersReducedMotion) return false;
  if (isTouch) return false;
  return true;
}

let dot = null;
let ring = null;
let rafId = null;
let mx = 0, my = 0, cx = 0, cy = 0;
let listening = false;

function loop() {
  cx += (mx - cx) * 0.2;
  cy += (my - cy) * 0.2;
  if (dot) dot.style.transform = `translate(${cx}px, ${cy}px)`;
  if (ring) ring.style.transform = `translate(${cx}px, ${cy}px)`;
  rafId = requestAnimationFrame(loop);
}

function onMove(e) {
  mx = e.clientX;
  my = e.clientY;
}

// Idempotent: call on load and whenever the setting changes.
export function initCursor() {
  if (typeof window === 'undefined') return false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const enabled = shouldEnableCustomCursor(P.settings.customCursor, reduce, touch);

  if (enabled && !dot) {
    dot = document.createElement('div');
    dot.className = 'syn-cursor-dot';
    ring = document.createElement('div');
    ring.className = 'syn-cursor-ring';
    document.body.append(dot, ring);
    document.documentElement.classList.add('syn-cursor-on');
    mx = window.innerWidth * 0.5;
    my = window.innerHeight * 0.5;
    cx = mx;
    cy = my;
    if (!listening) {
      window.addEventListener('mousemove', onMove);
      listening = true;
    }
    loop();
  } else if (!enabled && dot) {
    if (rafId) cancelAnimationFrame(rafId);
    dot.remove();
    ring.remove();
    dot = ring = null;
    document.documentElement.classList.remove('syn-cursor-on');
  }
  return enabled;
}
