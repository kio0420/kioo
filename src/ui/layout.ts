import { h, clear } from './dom';
import { getLang, initLang, setLang, t } from './i18n';

export interface PageOpts {
  nav?: 'home' | 'method' | 'credits' | 'quiz' | 'result';
  render: (main: HTMLElement) => void;
  title?: () => string;
}

export function mountPage(opts: PageOpts): void {
  initLang();
  const app = document.getElementById('app');
  if (!app) return;
  const main = h('main', { id: 'main', class: 'main', tabindex: '-1' });

  const draw = () => {
    clear(app);
    clear(main);
    document.title = opts.title ? `${opts.title()}｜${t('siteName')}` : t('siteName');
    const lang = getLang();
    const link = (href: string, key: string, id: string) =>
      h('a', { href, class: 'nav-link', 'aria-current': opts.nav === id ? 'page' : null }, t(key));
    const header = h('header', { class: 'site-header' },
      h('div', { class: 'wrap header-row' },
        h('a', { href: 'index.html', class: 'brand' },
          h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, '12'),
          h('span', { class: 'brand-text' },
            h('span', { class: 'brand-name' }, t('siteName')),
            h('span', { class: 'brand-sub' }, t('siteSub')))),
        h('nav', { class: 'nav', 'aria-label': 'Main' },
          link('index.html', 'navHome', 'home'),
          link('method.html', 'navMethod', 'method'),
          link('credits.html', 'navCredits', 'credits'),
          h('button', {
            type: 'button', class: 'lang-btn', lang: lang === 'zh' ? 'en' : 'zh',
            'aria-label': lang === 'zh' ? 'Switch to English' : '切換為中文',
            onclick: () => { setLang(lang === 'zh' ? 'en' : 'zh'); draw(); },
          }, t('langToggle')))));
    const footer = h('footer', { class: 'site-footer' },
      h('div', { class: 'wrap' },
        h('p', null, t('footLine')),
        h('p', { class: 'foot-links' },
          h('a', { href: 'method.html#limits' }, t('footDisclaimer')),
          ' · ',
          h('a', { href: 'credits.html' }, t('footCredits')),
          ' · MIT')));
    app.append(
      h('a', { href: '#main', class: 'skip' }, t('skip')),
      header, main, footer);
    opts.render(main);
  };
  draw();
}
