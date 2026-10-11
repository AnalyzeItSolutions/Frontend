/**
 * Native app downloads: OS detection, release lookup and path safety.
 * Installers live in a public storage container; the site only links to them (through
 * /downloads/files/…, so storage can move without breaking links or shipped apps' update URLs).
 */

export const DOWNLOAD_BASE = process.env.DOWNLOAD_BASE_URL || 'https://stanalyzeitdl.blob.core.windows.net/downloads';

export const OS_LIST = [
  { id: 'macos', label: 'macOS' },
  { id: 'windows', label: 'Windows' },
  { id: 'linux', label: 'Linux' },
];

export const ARCH_LABELS = { arm64: 'Apple silicon (M1 and newer)', x64: 'Intel' };

export const KIND_LABELS = {
  dmg: 'Disk image (.dmg)',
  exe: 'Installer (.exe)',
  msi: 'Installer (.msi)',
  appimage: 'AppImage (any distribution)',
  deb: 'Debian / Ubuntu (.deb)',
  rpm: 'Fedora / RHEL (.rpm)',
  binary: 'Command-line program',
};

/** Which installer to put first for each OS. */
const PRIMARY_KIND = { macos: 'dmg', windows: 'exe', linux: 'appimage' };

export function detectOs(userAgent = '', platform = '') {
  const s = `${userAgent} ${platform}`.toLowerCase();
  if (/iphone|ipad|ipod|android/.test(s)) return null; // phones and tablets cannot run these
  if (/win/.test(s) && !/darwin/.test(s)) return 'windows';
  if (/mac/.test(s)) return 'macos';
  if (/linux|x11|cros/.test(s)) return 'linux';
  return null;
}

/** Browsers hide the CPU on Macs, so Apple silicon is the default unless the browser says otherwise. */
export function detectArch(os, uaArchitecture = '') {
  if (os === 'macos') return /x86|intel/i.test(uaArchitecture) ? 'x64' : 'arm64';
  return 'x64';
}

/** Files for one product that match the chosen OS and CPU. */
export function filesFor(releases, product, os, arch) {
  const files = releases?.[product]?.files;
  if (!Array.isArray(files)) return [];
  const order = ['dmg', 'exe', 'appimage', 'msi', 'deb', 'rpm', 'binary'];
  return files
    .filter((f) => f.os === os && (os !== 'macos' || f.arch === arch) && !String(f.kind).endsWith('-update'))
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

export function primaryFile(releases, product, os, arch) {
  const list = filesFor(releases, product, os, arch);
  if (product === 'cli') return list[0] || null;
  return list.find((f) => f.kind === PRIMARY_KIND[os]) || list[0] || null;
}

export function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(bytes / 1e6))} MB`;
}

/** Only `<product>/<x.y.z>/<file>` is ever served; anything else is refused (no open redirect, no traversal). */
export function isSafeFilePath(parts) {
  if (!Array.isArray(parts) || parts.length !== 3) return false;
  const [product, version, file] = parts;
  return (
    (product === 'desktop' || product === 'cli') &&
    /^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(version) &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(file) &&
    !file.includes('..')
  );
}

export function blobUrl(parts) {
  return `${DOWNLOAD_BASE.replace(/\/$/, '')}/${parts.map(encodeURIComponent).join('/')}`;
}

/** Only these product manifests are proxied. */
export function isManifestProduct(p) {
  return p === 'desktop' || p === 'cli';
}

/** A manifest is usable only if it has a version and https download URLs. */
export function isValidManifest(m) {
  if (!m || typeof m !== 'object' || typeof m.version !== 'string' || !/^\d+\.\d+\.\d+/.test(m.version)) return false;
  const plats = m.platforms;
  if (!plats || typeof plats !== 'object') return false;
  return Object.values(plats).every((p) => p && typeof p.url === 'string' && p.url.startsWith('https://') && typeof p.signature === 'string' && p.signature.length > 20);
}
