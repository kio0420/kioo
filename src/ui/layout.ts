import { h, clear } from './dom';
import { logoSvg } from './art';
import { getLang, initLang, setLang, t } from './i18n';

export interface PageOpts {
  nav?: 'home' | 'method' | 'credits' | 'quiz' | 'result';
  render: (main: HTMLElement) => void;
  title?: () => string;
}

let closeMenu: () => boolean = () => false;
let escBound = false;

export function mountPage(opts: PageOpts): void {
  initLang();
  const app = document.getElementById('app');
  if (!app) return;
  if (!escBound) {
    escBound = true;
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  }
  const main = h('main', { id: 'main', class: 'main', tabindex: '-1' });

  const draw = () => {
    clear(app);
    clear(main);
    document.title = opts.title ? `${opts.title()}｜${t('siteName')}` : t('siteName');
    const lang = getLang();
    const link = (href: string, key: string, id: string) =>
      h('a', { href, class: 'nav-link', 'aria-current': opts.nav === id ? 'page' : null }, t(key));
    const navLinks = h('nav', { class: 'nav', id: 'site-nav', 'aria-label': 'Main' },
      link('index.html', 'navHome', 'home'),
      link('method.html', 'navMethod', 'method'),
      link('credits.html', 'navCredits', 'credits'));
    const menuBtn = h('button', {
      type: 'button', class: 'menu-btn', 'aria-expanded': 'false', 'aria-controls': 'site-nav',
      'aria-label': lang === 'zh' ? '選單' : 'Menu',
    }, h('span', { class: 'menu-bars', 'aria-hidden': 'true' }));
    const header = h('header', { class: 'site-header' },
      h('div', { class: 'wrap header-row' },
        h('a', { href: 'index.html', class: 'brand brand-' + lang },
          logoSvg('brand-mark'),
          h('span', { class: 'brand-text' },
            h('span', { class: 'brand-name' }, t('siteName')),
            h('span', { class: 'brand-short' }, t('siteShort')),
            h('span', { class: 'brand-sub' }, t('siteSub')))),
        navLinks,
        h('div', { class: 'lang-capsule', role: 'group', 'aria-label': 'Language / 語言' },
          (['zh', 'en'] as const).map((l) => h('button', {
            type: 'button', class: 'lang-seg' + (lang === l ? ' active' : ''),
            lang: l === 'zh' ? 'zh-TW' : 'en', 'aria-pressed': lang === l ? 'true' : 'false',
            onclick: () => { if (lang !== l) { setLang(l); draw(); } },
          }, l === 'zh' ? '中' : 'EN'))),
        menuBtn));
    const setMenu = (open: boolean) => {
      header.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    navLinks.addEventListener('click', (e) => { if ((e.target as Element).closest('a')) setMenu(false); });
    closeMenu = () => {
      if (menuBtn.getAttribute('aria-expanded') !== 'true') return false;
      setMenu(false); menuBtn.focus(); return true;
    };
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
