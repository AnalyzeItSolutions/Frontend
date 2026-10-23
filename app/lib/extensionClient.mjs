// Copy of AnalyzeItTech/Extension app-client/analyzeit-extension.js; keep the two in sync.
// Drop-in client for the AnalyzeIt web app (and anything else on an AnalyzeIt origin) to talk to the browser extension.
// Framework-free ES module. Same message contract the stub app in test/stub/app.html uses.
//
//   const ext = createExtensionClient();
//   ext.onChange((s) => setConnected(s.connected));         // s = { connected, version, platforms, paused }
//   const r = await ext.fill({ draftId, platform, text, text_sha256 });   // call ONLY after the person approved this exact text
//   r.ok / r.reason                                        // accepted by the extension (the person still has to click Fill on the site)
//   ext.onResult((res) => ...)                             // { draftId, ok, state:'filled' } or { draftId, ok:false, reason }
//   ext.runPlan({ id, title, mode, steps, plan_sha256 })    // an approved browser plan; the person confirms again in the extension's own window
//   ext.onPlan((m) => ...)                                 // m.type: 'plan-progress' {planId,index,status} | 'plan-result' {planId,ok,reason,cancelled,results}
//   when res.ok, call POST /v1/drafts/{id}/sent only after the person says they pressed Post.
//   ext.linkAccount({ token, api })                         // after the person clicked "Let my assistants use this browser": token from POST /v1/browser-relay/link
//   ext.unlinkAccount()                                     // s.relay = { linked, online } tells which applies

export function createExtensionClient(win = window) {
  let state = { connected: false, version: null, platforms: {}, paused: false, autoRead: false, relay: { linked: false } };
  const changeFns = new Set();
  const resultFns = new Set();
  const planFns = new Set();
  const waiting = new Map();

  win.addEventListener('message', (ev) => {
    if (ev.source !== win || ev.origin !== win.location.origin) return;
    const d = ev.data;
    if (!d || d.source !== 'analyzeit-extension') return;
    if (d.type === 'hello') {
      state = { connected: true, version: d.version, platforms: d.platforms || {}, paused: !!d.paused, autoRead: !!d.autoRead, relay: d.relay || { linked: false } };
      changeFns.forEach((f) => f(state));
    } else if (d.type === 'account-link') {
      if (d.relay) { state = { ...state, relay: d.relay }; changeFns.forEach((f) => f(state)); }
      const w = waiting.get('account');
      if (w) { waiting.delete('account'); clearTimeout(w.t); w.resolve({ ok: !!d.ok, reason: d.reason }); }
    } else if (d.type === 'accepted') {
      const w = waiting.get(d.draftId);
      if (w) { waiting.delete(d.draftId); clearTimeout(w.t); w.resolve({ ok: !!d.ok, reason: d.reason, needsPermission: d.needsPermission }); }
    } else if (d.type === 'result') {
      resultFns.forEach((f) => f(d));
    } else if (d.type === 'plan-accepted') {
      const w = waiting.get('plan:' + d.planId);
      if (w) { waiting.delete('plan:' + d.planId); clearTimeout(w.t); w.resolve({ ok: !!d.ok, reason: d.reason }); }
    } else if (d.type === 'plan-progress' || d.type === 'plan-result') {
      planFns.forEach((f) => f(d));
    }
  });

  const ping = () => win.postMessage({ source: 'analyzeit-app', type: 'ping' }, win.location.origin);
  ping();
  setTimeout(ping, 1500); // the extension's page script may load after this one

  const account = (msg) => {
    if (!state.connected) return Promise.resolve({ ok: false, reason: 'The AnalyzeIt extension is not installed or not enabled in this browser.' });
    return new Promise((resolve) => {
      const t = setTimeout(() => { waiting.delete('account'); resolve({ ok: false, reason: 'The extension did not answer.' }); }, 8000);
      waiting.set('account', { resolve, t });
      win.postMessage({ source: 'analyzeit-app', ...msg }, win.location.origin);
    });
  };

  return {
    get state() { return state; },
    ping,
    onChange(f) { changeFns.add(f); f(state); return () => changeFns.delete(f); },
    onResult(f) { resultFns.add(f); return () => resultFns.delete(f); },
    onPlan(f) { planFns.add(f); return () => planFns.delete(f); },
    runPlan({ id, title, mode, steps, plan_sha256 }) {
      if (!state.connected) return Promise.resolve({ ok: false, reason: 'The AnalyzeIt extension is not installed or not enabled in this browser.' });
      return new Promise((resolve) => {
        const t = setTimeout(() => { waiting.delete('plan:' + id); resolve({ ok: false, reason: 'The extension did not answer.' }); }, 8000);
        waiting.set('plan:' + id, { resolve, t });
        win.postMessage({ source: 'analyzeit-app', type: 'plan', plan: { id, title, mode, steps }, sha256: plan_sha256 }, win.location.origin);
      });
    },
    linkAccount({ token, api }) { return account({ type: 'link-account', token, api }); },
    unlinkAccount() { return account({ type: 'unlink-account' }); },
    fill({ draftId, platform, text, text_sha256 }) {
      if (!state.connected) return Promise.resolve({ ok: false, reason: 'The AnalyzeIt extension is not installed or not enabled in this browser.' });
      return new Promise((resolve) => {
        const t = setTimeout(() => { waiting.delete(draftId); resolve({ ok: false, reason: 'The extension did not answer.' }); }, 8000);
        waiting.set(draftId, { resolve, t });
        win.postMessage({ source: 'analyzeit-app', type: 'fill', draftId, platform, text, sha256: text_sha256 }, win.location.origin);
      });
    },
  };
}
