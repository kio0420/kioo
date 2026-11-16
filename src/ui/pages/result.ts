import {
  MODE_CONFIG, decodeResult, definingViews, getLabel, matchFigures, matchIdeologies,
  resultSentence, typeName, type Axis, type Mode, type Scores,
} from '../../engine';
import {
  axes, CATEGORIES, figName, figureDisclaimer, figures, ideoDesc, ideoName, ideologies, poleName,
} from '../data';
import { mascotSvg } from '../art';
import { h } from '../dom';
import { getLang, pick, t } from '../i18n';
import { mountPage } from '../layout';

const cap = (m: Mode) => m.charAt(0).toUpperCase() + m.slice(1);
const pct = (n: number) => `${Math.round(n)}%`;

function axisRow(a: Axis, s: number, defining: boolean): HTMLElement {
  const lang = getLang();
  const p1 = Math.round(s), p2 = 100 - p1;
  const n1 = poleName(a.first), n2 = poleName(a.second);
  const lbl = getLabel(a, s, lang);
  const seg = (cls: string, w: number) =>
    h('span', { class: `seg ${cls}`, style: `width:${w}%` },
      w >= 14 ? h('span', { class: 'seg-label' }, `${w}%`) : null);
  return h('li', { class: 'axis-row' + (defining ? ' defining' : '') },
    h('div', { class: 'axis-ends' },
      h('span', { class: 'end e1' }, h('b', null, n1), ` ${p1}%`),
      h('span', { class: 'end e2' }, `${p2}% `, h('b', null, n2))),
    h('div', {
      class: 'bar', role: 'img',
      'aria-label': `${n1} ${p1}%，${n2} ${p2}%${lbl ? '，' + lbl : ''}`,
    }, seg('s1', p1), seg('s2', p2)),
    h('div', { class: 'axis-label' },
      defining ? h('span', { class: 'star', title: t('definingTag'), 'aria-label': t('definingTag') }, '★ ') : null,
      lbl));
}

function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(() => true, () => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}
function fallbackCopy(text: string): boolean {
  const ta = h('textarea', { readonly: true, style: 'position:fixed;opacity:0;top:0' }) as HTMLTextAreaElement;
  ta.value = text;
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

const safeUrl = (u?: string) => (u && /^https?:\/\//i.test(u) ? u : null);

export function render(): void {
  const res = decodeResult(location.search);
  mountPage({
    nav: 'result',
    title: () => t('resultTitle'),
    render(main) {
      const wrap = h('div', { class: 'wrap' });
      main.append(wrap);
      if (!res) {
        wrap.append(h('div', { class: 'error-state' }, mascotSvg('', 'mascot mascot-sm'),
          h('div', { class: 'notice', role: 'alert' }, t('resultError'))),
          h('p', null, h('a', { class: 'btn btn-primary', href: 'index.html' }, t('backHome'))));
        return;
      }
      const lang = getLang();
      const scores: Scores = res.scores;
      const dv = definingViews(scores, axes);
      const defSet = new Set(dv.map((v) => v.axis.id));

      wrap.append(h('section', { class: 'result-hero' },
        h('div', { class: 'hero-row' },
          mascotSvg('', 'mascot mascot-sm'),
          h('div', { class: 'bubble' },
            h('p', { class: 'eyebrow' }, t('typeLabel')),
            h('h1', { class: 'type-name', id: 'type-name' }, typeName(scores, axes, lang)))),
        h('p', { class: 'sentence', id: 'sentence' }, resultSentence(scores, axes, lang).text)));

      if (res.mode !== 'full') {
        const n = MODE_CONFIG[res.mode].levels?.length ?? 24;
        wrap.append(h('p', { class: 'notice', role: 'note' },
          t('modeNote', { m: t('mode' + cap(res.mode) + 'N'), n }), ' ',
          h('a', { href: 'method.html#limits' }, t('methodLink'))));
      }

      const axSec = h('section', { 'aria-labelledby': 'ax-h' },
        h('h2', { id: 'ax-h' }, t('axesResult')), h('p', { class: 'muted' }, t('definingNote')));
      for (const c of CATEGORIES) {
        axSec.append(h('h3', { class: 'cat' }, t('cat_' + c)),
          h('ul', { class: 'axis-bars' }, axes.filter((a) => a.category === c)
            .map((a) => axisRow(a, scores[a.id] ?? 50, defSet.has(a.id)))));
      }
      wrap.append(axSec);

      const ideo = matchIdeologies(scores, ideologies, 3);
      wrap.append(h('section', { 'aria-labelledby': 'id-h' },
        h('h2', { id: 'id-h' }, t('topIdeologies')),
        h('ol', { class: 'match-list', id: 'ideo-list' }, ideo.map(({ ideology, similarity }) => {
          const link = safeUrl(ideology.link);
          const desc = ideoDesc(ideology);
          return h('li', { class: 'card match' },
            h('details', null,
              h('summary', null,
                h('span', { class: 'match-name' }, ideoName(ideology)),
                h('span', { class: 'sim' }, `${t('similarity')} ${pct(similarity)}`)),
              h('p', null, desc),
              link ? h('p', null, h('a', { href: link, target: '_blank', rel: 'noopener noreferrer' }, t('wiki'))) : null));
        }))));

      const figs = matchFigures(scores, figures, 3, axes);
      const dis = figureDisclaimer();
      wrap.append(h('section', { 'aria-labelledby': 'fg-h' },
        h('h2', { id: 'fg-h' }, t('topFigures')),
        h('ol', { class: 'match-list', id: 'fig-list' }, figs.map(({ figure, similarity }) =>
          h('li', { class: 'card match' },
            h('div', { class: 'match-row' },
              h('span', { class: 'match-name' }, figName(figure),
                figure.country ? h('span', { class: 'muted small' }, ` · ${figure.country}`) : null),
              h('span', { class: 'sim' }, `${t('similarity')} ${pct(similarity)}`))))),
        h('p', { class: 'notice small', role: 'note' },
          h('strong', null, t('figNote')), ' ', pick(dis.zh, dis.en))));

      const urlInput = h('input', {
        type: 'text', readonly: true, class: 'url', value: location.href, 'aria-label': t('share'),
      }) as HTMLInputElement;
      const status = h('span', { class: 'copy-status', role: 'status' });
      wrap.append(h('section', { class: 'share', 'aria-labelledby': 'sh-h' },
        h('h2', { id: 'sh-h' }, t('share')),
        h('p', { class: 'muted' }, t('shareHint')),
        h('div', { class: 'share-row' }, urlInput,
          h('button', {
            type: 'button', class: 'btn btn-primary',
            onclick: () => {
              void copyText(location.href).then((ok) => {
                status.textContent = ok ? t('copied') : t('copyFail');
                if (!ok) urlInput.select();
              });
            },
          }, t('copy'))),
        status,
        h('p', { class: 'actions' },
          h('a', { class: 'btn', href: 'index.html' }, t('retake')), ' ',
          h('a', { class: 'btn btn-quiet', href: 'method.html' }, t('methodLink')))));
    },
  });
}
