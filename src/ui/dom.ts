export type Child = Node | string | number | null | undefined | false;

export function h(
  tag: string,
  props?: Record<string, unknown> | null,
  ...children: (Child | Child[])[]
): HTMLElement {
  const e = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') e.className = String(v);
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v as EventListener);
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, String(v));
    }
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    e.append(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  return e;
}

/** Static, author-controlled HTML only (never user/data text). */
export function staticHtml(tag: string, cls: string, html: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  e.innerHTML = html;
  return e;
}

export const clear = (e: Element) => { while (e.firstChild) e.removeChild(e.firstChild); };
