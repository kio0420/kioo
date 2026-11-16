import type { Answers, Lang, Mode } from '../engine';

export function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function safeSet(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
export function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

const LANG_KEY = 'kioo.lang';
export function loadLang(): Lang {
  const v = safeGet(LANG_KEY);
  return v === 'en' ? 'en' : 'zh';
}
export function saveLang(l: Lang): void { safeSet(LANG_KEY, l); }

export interface Progress { mode: Mode; seed: number; answers: Answers; index: number; }
const pkey = (m: Mode) => `kioo.quiz.${m}`;

export function loadProgress(mode: Mode): Progress | null {
  const raw = safeGet(pkey(mode));
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Progress;
    if (p && p.mode === mode && typeof p.seed === 'number' && typeof p.index === 'number'
      && p.answers && typeof p.answers === 'object') return p;
  } catch { /* ignore */ }
  return null;
}
export function saveProgress(p: Progress): void { safeSet(pkey(p.mode), JSON.stringify(p)); }
export function clearProgress(mode: Mode): void { safeRemove(pkey(mode)); }
