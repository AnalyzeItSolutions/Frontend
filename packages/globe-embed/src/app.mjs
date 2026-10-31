/**
 * A complete small globe screen: the layer list with live counts, the globe, and a card for the clicked pin.
 * Plain DOM so any product can mount it with one call. Everything that comes from a data feed is set with
 * `textContent`; links open only when they are http(s), through `openLink` (each product opens them its own way).
 */

import { EMBED_LAYERS, createGlobe } from './globe.mjs';

function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}

function badge(count, health, loading) {
  if (health?.status === 'error') return 'unavailable';
  if (health?.status === 'stale') return `${count || 0} stale`;
  if (!health && loading) return '…';
  return health ? String(count || 0) : '';
}

/**
 * @param {HTMLElement} root
 * @param {Parameters<typeof createGlobe>[1] & { openLink?: (url: string) => void, storageKey?: string }} opts
 */
export function mountGlobeApp(root, opts) {
  const key = opts.storageKey || 'analyzeit.globe.layers';
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    saved = null;
  }
  const initial = Array.isArray(saved) ? saved : opts.layers || ['earthquakes'];

  root.classList.add('aig');
  root.replaceChildren();
  const side = h('aside', 'aig-side');
  const title = h('p', 'aig-title', 'Layers');
  const list = h('ul', 'aig-list');
  side.append(title, list);
  const stage = h('div', 'aig-stage');
  const mapEl = h('div', 'aig-map');
  const card = h('div', 'aig-card');
  card.hidden = true;
  stage.append(mapEl, card);
  root.append(side, stage);

  const rows = new Map();
  for (const layer of EMBED_LAYERS) {
    const li = h('li', 'aig-row');
    const label = h('label', 'aig-label');
    label.title = layer.hint;
    const box = h('input');
    box.type = 'checkbox';
    box.checked = initial.includes(layer.id);
    const dot = h('span', 'aig-dot');
    dot.style.background = layer.color;
    const name = h('span', 'aig-name', layer.label);
    const count = h('span', 'aig-count', '');
    label.append(box, dot, name, count);
    li.append(label);
    list.append(li);
    rows.set(layer.id, { box, count });
    box.addEventListener('change', () => {
      globe.toggle(layer.id);
      try {
        localStorage.setItem(key, JSON.stringify(globe.getLayers()));
      } catch {
        /* storage may be off; the choice just is not remembered */
      }
    });
  }

  const openLink = (url) => {
    if (!/^https?:\/\//i.test(url)) return;
    if (opts.openLink) opts.openLink(url);
    else window.open(url, '_blank', 'noopener');
  };

  const showCard = (pin) => {
    card.replaceChildren();
    if (!pin) {
      card.hidden = true;
      return;
    }
    const layer = EMBED_LAYERS.find((l) => l.id === pin.layer);
    const close = h('button', 'aig-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => showCard(null));
    card.append(close, h('p', 'aig-kicker', layer?.label || pin.layer), h('p', 'aig-head', pin.label));
    const dl = h('dl', 'aig-facts');
    for (const [k, v] of Object.entries(pin.details)) dl.append(h('dt', null, k), h('dd', null, v));
    dl.append(h('dt', null, 'Coordinates'), h('dd', null, `${pin.lat.toFixed(3)}°, ${pin.lon.toFixed(3)}°`));
    card.append(dl);
    for (const url of pin.links.slice(0, 3)) {
      const a = h('button', 'aig-link', new URL(url).hostname.replace(/^www\./, ''));
      a.type = 'button';
      a.addEventListener('click', () => openLink(url));
      card.append(a);
    }
    if (layer) card.append(h('p', 'aig-hint', layer.hint));
    card.hidden = false;
  };

  const globe = createGlobe(mapEl, {
    ...opts,
    layers: initial,
    onSelect: (pin) => {
      showCard(pin);
      opts.onSelect?.(pin);
    },
    onUpdate: (state) => {
      for (const [id, row] of rows) row.count.textContent = row.box.checked ? badge(state.counts[id], state.health[id], state.loading) : '';
      opts.onUpdate?.(state);
    },
  });
  return globe;
}
