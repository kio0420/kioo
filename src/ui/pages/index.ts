import type { Mode } from '../../engine';
import { axes, CATEGORIES, poleName } from '../data';
import { h } from '../dom';
import { t } from '../i18n';
import { mountPage } from '../layout';
import { loadProgress } from '../storage';

const MODES: { mode: Mode; n: number; mins: string }[] = [
  { mode: 'full', n: 288, mins: '40–60' },
  { mode: 'quick', n: 60, mins: '10' },
  { mode: 'mini', n: 36, mins: '6' },
];
const cap = (m: Mode) => m.charAt(0).toUpperCase() + m.slice(1);

export function render(): void {
  mountPage({
    nav: 'home',
    render(main) {
      const wrap = h('div', { class: 'wrap' });
      main.append(wrap);
      wrap.append(h('section', { class: 'hero' },
        h('h1', null, t('heroTitle')),
        h('p', { class: 'lead' }, t('heroLead'))));

      const resumes = MODES.map((m) => ({ m, p: loadProgress(m.mode) }))
        .filter((x) => x.p && Object.keys(x.p.answers).length > 0);
      if (resumes.length) {
        wrap.append(h('section', { class: 'card resume', 'aria-label': t('resumeTitle') },
          resumes.map(({ m, p }) => h('p', null,
            h('a', { class: 'btn btn-primary', href: `quiz.html?mode=${m.mode}` },
              `${t('resumeBtn')}（${t('mode' + cap(m.mode))}）`),
            ` ${t('resumeInfo')} ${Object.keys(p!.answers).length}/${m.n}`))));
      }

      wrap.append(h('section', { id: 'modes', 'aria-labelledby': 'modes-h' },
        h('h2', { id: 'modes-h' }, t('modesTitle')),
        h('div', { class: 'mode-grid' }, MODES.map((m) =>
          h('a', { class: 'card mode-card', href: `quiz.html?mode=${m.mode}` },
            h('h3', null, t('mode' + cap(m.mode))),
            h('p', { class: 'mode-n' }, `${m.n} ${t('questions')}`),
            h('p', { class: 'mode-t' }, `${t('approx')} ${m.mins} ${t('minutes')}`),
            h('p', null, t('mode' + cap(m.mode) + 'Desc')),
            h('span', { class: 'btn btn-primary', 'aria-hidden': 'true' }, t('start')))))));

      wrap.append(h('section', { class: 'notice', id: 'limit', role: 'note' },
        h('h2', null, t('limitTitle')),
        h('p', null, t('limitBody')),
        h('p', null, h('a', { href: 'method.html#limits' }, t('limitMore')))));

      const sec = h('section', { 'aria-labelledby': 'axes-h' },
        h('h2', { id: 'axes-h' }, t('axesTitle')), h('p', null, t('axesLead')));
      for (const c of CATEGORIES) {
        sec.append(h('h3', { class: 'cat' }, t('cat_' + c)),
          h('ul', { class: 'axis-list' }, axes.filter((a) => a.category === c).map((a) =>
            h('li', null,
              h('span', { class: 'pole p1' }, poleName(a.first)),
              h('span', { class: 'vs', 'aria-hidden': 'true' }, '⟷'),
              h('span', { class: 'pole p2' }, poleName(a.second))))));
      }
      wrap.append(sec);
    },
  });
}
