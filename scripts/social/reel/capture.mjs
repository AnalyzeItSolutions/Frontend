// Captures reel frames through one headless Chrome (Chrome DevTools Protocol). Node 20 needs --experimental-websocket.
// Usage: node --experimental-websocket capture.mjs <outDir> <fps> <seconds>
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [outDir, fps, secs] = [process.argv[2], +process.argv[3], +process.argv[4]];
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=9333', '--user-data-dir=' + fs.mkdtempSync('/tmp/reel-chrome-'), '--window-size=1080,1920', 'about:blank'], { stdio: 'ignore' });
try {
  let targets;
  for (let i = 0; i < 50 && !targets; i++) {
    try { targets = await (await fetch('http://127.0.0.1:9333/json')).json(); } catch { await new Promise((r) => setTimeout(r, 300)); }
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'file://' + path.resolve(import.meta.dirname, 'index.html') });
  await new Promise((r) => setTimeout(r, 1500));
  fs.mkdirSync(outDir, { recursive: true });
  const n = fps * secs;
  for (let i = 0; i < n; i++) {
    await send('Runtime.evaluate', { expression: `render(${i / fps})` });
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(data, 'base64'));
  }
  ws.close();
} finally { chrome.kill(); }
