import { staticHtml } from './dom';

/** Original brand art (hand-written SVG). Colours come from CSS custom properties so they follow light/dark mode. */
const TICKS = 'M24 14V8M30.5 12.7L32 10.1M35.3 17.5L37.9 16M34 24H40M35.3 30.5L37.9 32M30.5 35.3L32 37.9M24 34V40M17.5 35.3L16 37.9M12.7 30.5L10.1 32M14 24H8M12.7 17.5L10.1 16M17.5 12.7L16 10.1';

export function logoSvg(cls = 'logo'): HTMLElement {
  return staticHtml('span', cls,
    `<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">` +
    `<rect x="2" y="2" width="44" height="44" rx="11" fill="var(--accent)" stroke="var(--ink)" stroke-width="2"/>` +
    `<path d="${TICKS}" fill="none" stroke="var(--on-accent)" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M24 24L31 15.6" stroke="var(--on-accent)" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="24" cy="24" r="3" fill="var(--paper)" stroke="var(--on-accent)" stroke-width="2"/></svg>`);
}

/** Compass-needle buddy. `label` is the accessible name (empty string = decorative). */
export function mascotSvg(label: string, cls = 'mascot'): HTMLElement {
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return staticHtml('span', cls,
    `<svg viewBox="0 0 120 120" ${a11y} focusable="false">` +
    `<rect x="40" y="100" width="16" height="12" rx="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>` +
    `<rect x="64" y="100" width="16" height="12" rx="5" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>` +
    `<path d="M20 70Q10 62 14 52M100 70Q110 62 106 52" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/>` +
    `<circle cx="60" cy="68" r="38" fill="var(--accent)" stroke="var(--ink)" stroke-width="2.5"/>` +
    `<path d="M60 4L69 30L60 25L51 30Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M32 44L35 47M88 44L85 47" stroke="var(--on-accent)" stroke-width="2.5" stroke-linecap="round"/>` +
    `<circle cx="47" cy="64" r="4.5" fill="var(--on-accent)"/><circle cx="73" cy="64" r="4.5" fill="var(--on-accent)"/>` +
    `<circle cx="38" cy="76" r="5" fill="var(--paper)" opacity=".7"/><circle cx="82" cy="76" r="5" fill="var(--paper)" opacity=".7"/>` +
    `<path d="M51 77Q60 86 69 77" fill="none" stroke="var(--on-accent)" stroke-width="2.5" stroke-linecap="round"/></svg>`);
}
