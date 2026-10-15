/** Which browser the person uses, which store page that means, and what to do while there is no listing. Config: public/extension/stores.json. */
import config from '../../public/extension/stores.json' with { type: 'json' };

export const STORES_CONFIG = config;
export const BROWSER_IDS = Object.keys(config.browsers);
export const PREF_KEY = 'analyzeit_ext_browser';

/** From the user agent (and Brave's own flag, which it does not put in the user agent). Null when unknown or on a phone. */
export function detectBrowser(userAgent = '', isBrave = false) {
  const ua = String(userAgent);
  if (/iphone|ipad|ipod|android/i.test(ua)) return null;
  if (isBrave) return 'brave';
  if (/\bEdg\//.test(ua)) return 'edge';
  if (/\bFirefox\//.test(ua)) return 'firefox';
  if (/\bChrome\//.test(ua) || /\bChromium\//.test(ua)) return 'chrome';
  if (/\bSafari\//.test(ua) && /\bVersion\//.test(ua)) return 'safari';
  return null;
}

export function resolveBrowser(id, cfg = config) {
  const b = cfg.browsers[id];
  if (!b) return null;
  const store = cfg.stores[b.store];
  const url = store?.url || null;
  return { id, label: b.label, store: store?.label || b.store, url, listed: Boolean(url), packageFile: cfg.packages[b.package] || null, packageKind: b.package };
}

export function readPreference(storage) {
  try { const v = storage?.getItem(PREF_KEY); return v && config.browsers[v] ? v : null; } catch { return null; }
}

export function savePreference(storage, id) {
  try { if (config.browsers[id]) storage?.setItem(PREF_KEY, id); } catch { /* private mode: the choice just is not remembered */ }
}

/** The saved choice, else the detected browser, else null. */
export function chooseBrowser(storage, userAgent, isBrave) {
  return readPreference(storage) || detectBrowser(userAgent, isBrave);
}

export function installSteps(kind, label) {
  if (kind === 'chromium') return [
    'Download the package below and unzip it.',
    `Open ${label === 'Edge' ? 'edge://extensions' : label === 'Brave' ? 'brave://extensions' : 'chrome://extensions'} and turn on Developer mode.`,
    'Choose Load unpacked and pick the unzipped folder.',
    'Open the Drafts page: it should now say Connected.',
  ];
  if (kind === 'firefox') return [
    'Download the package below (it is not signed yet).',
    'Open about:debugging#/runtime/this-firefox and choose Load Temporary Add-on, then pick the zip.',
    'Firefox removes temporary add-ons when it restarts, so this is for trying it out until the listing is live.',
  ];
  return [
    'Safari needs a signed app. The Xcode project below builds it on a Mac with Xcode.',
    'Open it in Xcode, choose your development team for both targets, and Run.',
    'Enable it in Safari > Settings > Extensions.',
  ];
}
