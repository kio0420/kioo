import {
  ANSWER_OPTIONS, buildQuiz, encodeResult, randomSeed, scoreAxesFor, type Mode, type Quiz,
} from '../../engine';
import { axes, qText, questions } from '../data';
import { mascotSvg } from '../art';
import { h, clear } from '../dom';
import { getLang, t } from '../i18n';
import { mountPage } from '../layout';
import { clearProgress, loadProgress, saveProgress, type Progress } from '../storage';

const MODES: Mode[] = ['full', 'quick', 'mini'];
const cap = (m: Mode) => m.charAt(0).toUpperCase() + m.slice(1);

function startState(mode: Mode): Progress {
  const saved = loadProgress(mode);
  if (saved) {
    const qz = buildQuiz(questions, mode, { seed: saved.seed });
    if (saved.index >= 0 && saved.index < qz.items.length) return saved;
  }
  return { mode, seed: randomSeed(), answers: {}, index: 0 };
}

export function render(): void {
  const param = new URLSearchParams(location.search).get('mode');
  const mode = MODES.find((m) => m === param);
  let state: Progress | null = null;
  let quiz: Quiz | null = null;
  let body: HTMLElement | null = null;
  let keyHandler: ((e: KeyboardEvent) => void) | null = null;

  const init = () => {
    state = startState(mode!);
    quiz = buildQuiz(questions, mode!, { seed: state.seed });
  };

  const finish = () => {
    const s = state!;
    const scores = scoreAxesFor(quiz!.items, s.answers, axes);
    clearProgress(s.mode);
    location.href = `result.html?${encodeResult({ scores, mode: s.mode })}`;
  };

  const answer = (v: number) => {
    const s = state!, items = quiz!.items;
    s.answers[items[s.index].id] = v;
    if (s.index >= items.length - 1) { finish(); return; }
    s.index += 1;
    saveProgress(s);
    draw();
  };
  const back = () => {
    const s = state!;
    if (s.index > 0) { s.index -= 1; saveProgress(s); draw(); }
  };

  const draw = () => {
    if (!body) return;
    clear(body);
    const s = state!, items = quiz!.items, total = items.length;
    const q = items[s.index];
    const n = s.index + 1;
    const cur = s.answers[q.id];
    body.append(
      h('div', { class: 'progress-meta' },
        h('span', { class: 'qcount', 'aria-live': 'polite' },
          getLang() === 'zh' ? `${n} / ${total}` : `${t('qOf')} ${n} ${t('qProgress')} ${total}`),
        h('span', { class: 'qmode' }, t('mode' + cap(s.mode)))),
      h('div', {
        class: 'progress', role: 'progressbar', 'aria-label': t('progressLabel'),
        'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(n - 1),
        'aria-valuetext': `${n - 1} / ${total}`,
      }, h('div', { class: 'progress-fill', style: `width:${((n - 1) / total) * 100}%` })),
      h('h2', { class: 'statement', id: 'stmt', tabindex: '-1' }, qText(q)),
      h('div', { class: 'answers', role: 'group', 'aria-labelledby': 'stmt' },
        ANSWER_OPTIONS.map((o, i) => h('button', {
          type: 'button', class: 'answer lvl-' + Math.round(Math.abs(o.value) * 2) + (cur === o.value ? ' selected' : ''),
          'aria-pressed': cur === o.value ? 'true' : 'false',
          'data-value': String(o.value),
          onclick: () => answer(o.value),
        }, h('kbd', { 'aria-hidden': 'true' }, String(i + 1)), getLang() === 'zh' ? o.zh : o.en))),
      h('div', { class: 'quiz-actions' },
        h('button', { type: 'button', class: 'btn', disabled: s.index === 0, onclick: back }, '← ' + t('prev')),
        h('button', {
          type: 'button', class: 'btn btn-quiet',
          onclick: () => {
            if (!confirm(t('restartConfirm'))) return;
            clearProgress(s.mode);
            init();
            draw();
          },
        }, t('restart'))),
      h('p', { class: 'hint' }, t('keyHint')));
    (document.getElementById('stmt') as HTMLElement | null)?.focus({ preventScroll: true });
  };

  mountPage({
    nav: 'quiz',
    title: () => (mode ? t('mode' + cap(mode)) : t('siteName')),
    render(main) {
      if (keyHandler) document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
      const wrap = h('div', { class: 'wrap narrow' });
      main.append(wrap);
      if (!mode) {
        wrap.append(h('div', { class: 'error-state' }, mascotSvg('', 'mascot mascot-sm'),
          h('p', { class: 'notice' }, t('badMode'))),
          h('p', null, h('a', { class: 'btn', href: 'index.html' }, t('backHome'))));
        return;
      }
      if (!state) init();
      body = h('div', { class: 'quiz-body' });
      wrap.append(body);
      draw();
      keyHandler = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key >= '1' && e.key <= '7') answer(ANSWER_OPTIONS[Number(e.key) - 1].value);
        else if (e.key === 'ArrowLeft') back();
      };
      document.addEventListener('keydown', keyHandler);
    },
  });
}
