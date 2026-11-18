// Therm-De sign-in: accounts are approved by the administrator before the application code is sent.
// The application code is not part of the public site; it is served only to approved, signed-in users.
const FN = 'https://pkbktfdbtsctoyprtoxq.supabase.co/functions/v1/thermde';
const DEV = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !new URLSearchParams(location.search).has('auth');
const store = { get(k) { try { return localStorage.getItem('thermde.' + k); } catch (e) { return null; } }, set(k, v) { try { if (v === null) localStorage.removeItem('thermde.' + k); else localStorage.setItem('thermde.' + k, v); } catch (e) { /* private mode */ } } };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(path, body, token = store.get('token')) {
  const r = await fetch(FN + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  let d = {}; try { d = await r.json(); } catch (e) { /* empty */ }
  if (!r.ok) { const e = new Error(d.error || `Request failed (${r.status})`); e.status = r.status; throw e; }
  return d;
}

const css = `
#gate{position:fixed;inset:0;z-index:9999;background:#f4f6f9;display:flex;align-items:center;justify-content:center;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1d2733;overflow:auto;padding:16px}
#gate .card{background:#fff;border:1px solid #dfe4ea;border-radius:12px;box-shadow:0 6px 30px rgba(20,40,70,.08);width:100%;max-width:420px;padding:28px}
#gate h1{font-size:22px;margin:0 0 2px;display:flex;align-items:center;gap:10px}#gate .logo{background:linear-gradient(135deg,#c0392b,#2c5aa0);color:#fff;border-radius:7px;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;font-weight:700}
#gate .sub{color:#5f6b7a;margin:0 0 18px;font-size:13.5px}#gate .tabs{display:flex;gap:6px;margin-bottom:16px}#gate .tabs button{flex:1;padding:8px;border:1px solid #cfd6df;background:#f7f9fb;border-radius:7px;cursor:pointer;font:inherit}
#gate .tabs button.on{background:#2c5aa0;color:#fff;border-color:#2c5aa0}#gate label{display:block;font-size:13px;color:#46515f;margin:10px 0 4px}
#gate input,#gate textarea{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #cfd6df;border-radius:7px;font:inherit}#gate textarea{min-height:60px;resize:vertical}
#gate .go{width:100%;margin-top:16px;padding:11px;border:0;border-radius:8px;background:#2c5aa0;color:#fff;font:600 15px system-ui;cursor:pointer}#gate .go:disabled{opacity:.6}
#gate .msg{margin-top:12px;padding:9px 11px;border-radius:7px;font-size:13.5px}#gate .err{background:#fdecea;color:#8a1c12}#gate .ok{background:#e8f5e9;color:#1b5e20}
#gate .link{background:none;border:0;color:#2c5aa0;cursor:pointer;padding:0;font:inherit;text-decoration:underline}
#acct{position:relative;display:inline-flex;gap:6px;align-items:center}#acct .badge{background:#c0392b;color:#fff;border-radius:9px;padding:0 6px;font-size:11px;margin-left:4px}
#adm{position:fixed;inset:0;z-index:9998;background:rgba(15,25,40,.45);display:flex;align-items:flex-start;justify-content:center;padding:40px 12px;overflow:auto;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#adm .card{background:#fff;border-radius:12px;max-width:980px;width:100%;padding:22px 24px;box-shadow:0 10px 40px rgba(0,0,0,.25)}#adm h2{margin:0 0 4px;font-size:19px}
#adm table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13.5px}#adm td,#adm th{border-bottom:1px solid #e6eaef;padding:8px 6px;text-align:left;vertical-align:top}
#adm .st{font-weight:600;text-transform:capitalize}#adm .pending{color:#b26a00}#adm .approved{color:#1b7a2f}#adm .rejected{color:#a12a1a}
#adm button{padding:5px 9px;margin:2px;border:1px solid #cfd6df;border-radius:6px;background:#f7f9fb;cursor:pointer;font:inherit;font-size:12.5px}#adm button.p{background:#1b7a2f;color:#fff;border-color:#1b7a2f}#adm button.d{color:#a12a1a}
#adm .muted{color:#5f6b7a;font-size:12.5px}`;

function shell() { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); const g = document.createElement('div'); g.id = 'gate'; document.body.appendChild(g); return g; }
let gate = null;
const head = `<h1><span class="logo">T</span>Therm-De</h1><p class="sub">Thermal and mechanical design, analysis and simulation</p>`;

function showLogin(tab = 'in', note = '') {
  gate.style.display = 'flex';
  gate.innerHTML = `<div class="card">${head}<div class="tabs"><button data-t="in" class="${tab === 'in' ? 'on' : ''}">Sign in</button><button data-t="up" class="${tab === 'up' ? 'on' : ''}">Register</button></div>
  ${tab === 'in' ? `<form id="fIn"><label>E-mail</label><input name="email" type="email" autocomplete="username" required><label>Password</label><input name="password" type="password" autocomplete="current-password" required><button class="go">Sign in</button></form>`
    : `<form id="fUp"><label>Full name</label><input name="name" required maxlength="120"><label>Institution / company</label><input name="affiliation" maxlength="200"><label>What will you use Therm-De for?</label><textarea name="purpose" maxlength="500"></textarea>
       <label>E-mail</label><input name="email" type="email" autocomplete="username" required><label>Password (at least 8 characters)</label><input name="password" type="password" minlength="8" autocomplete="new-password" required><label>Repeat the password</label><input name="password2" type="password" minlength="8" autocomplete="new-password" required>
       <button class="go">Register</button><p class="muted" style="font-size:12.5px;color:#5f6b7a;margin:10px 0 0">Access is granted by the administrator after review. You can sign in to check the status of your request.</p></form>`}
  ${note ? `<div class="msg ${note.startsWith('✓') ? 'ok' : 'err'}">${esc(note)}</div>` : ''}<div id="gMsg"></div></div>`;
  gate.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => showLogin(b.dataset.t)));
  const say = (m, ok = false) => { gate.querySelector('#gMsg').innerHTML = `<div class="msg ${ok ? 'ok' : 'err'}">${esc(m)}</div>`; };
  const fIn = gate.querySelector('#fIn'), fUp = gate.querySelector('#fUp');
  if (fIn) fIn.onsubmit = async (e) => { e.preventDefault(); const b = fIn.querySelector('button'); b.disabled = true; b.textContent = 'Signing in…';
    try { const d = await api('/login', { email: fIn.email.value, password: fIn.password.value }, null); store.set('token', d.token); store.set('user', JSON.stringify({ name: d.name, email: d.email, admin: d.admin }));
      if (d.status === 'approved') await openApp(); else showPending(); }
    catch (err) { say(err.message); b.disabled = false; b.textContent = 'Sign in'; } };
  if (fUp) fUp.onsubmit = async (e) => { e.preventDefault(); if (fUp.password.value !== fUp.password2.value) return say('The two passwords differ.');
    const b = fUp.querySelector('button'); b.disabled = true; b.textContent = 'Sending…';
    try { await api('/register', { name: fUp.name.value, affiliation: fUp.affiliation.value, purpose: fUp.purpose.value, email: fUp.email.value, password: fUp.password.value }, null);
      showLogin('in', '✓ Registration received. You will be able to sign in once the administrator approves it.'); }
    catch (err) { say(err.message); b.disabled = false; b.textContent = 'Register'; } };
}
function showPending() {
  const u = JSON.parse(store.get('user') || '{}'); gate.style.display = 'flex';
  gate.innerHTML = `<div class="card">${head}<div class="msg ok" style="background:#fff8e1;color:#7a4f00">Your registration (${esc(u.email || '')}) is waiting for approval by the administrator.</div>
    <button class="go" id="gChk">Check again</button><p style="text-align:center;margin:14px 0 0"><button class="link" id="gOut">Sign out</button></p></div>`;
  gate.querySelector('#gChk').onclick = () => start(); gate.querySelector('#gOut').onclick = signOut;
}
function signOut() { store.set('token', null); store.set('user', null); location.reload(); }

async function openApp() {
  gate.innerHTML = `<div class="card">${head}<p>Loading Therm-De…</p></div>`;
  try { await import(`${FN}/app/${encodeURIComponent(store.get('token'))}/js/main.js`); }
  catch (e) { store.set('token', null); return showLogin('in', 'Could not load the application. Please sign in again.'); }
  gate.style.display = 'none'; accountMenu();
}
async function start() {
  if (!gate) gate = shell();
  if (!store.get('token')) return showLogin();
  try { const s = await api('/me'); if (s.token) store.set('token', s.token); store.set('user', JSON.stringify({ name: s.name, email: s.email, admin: s.admin }));
    if (s.status === 'approved') return openApp(); if (s.status === 'pending') return showPending();
    store.set('token', null); return showLogin('in', 'Access to Therm-De was not approved for this account.'); }
  catch (e) { store.set('token', null); return showLogin('in', e.status === 401 ? 'Your session ended. Please sign in again.' : 'The sign-in service could not be reached. Check the connection and reload.'); }
}

// ---------------------------------------------------------------- account menu and administrator panel
function accountMenu() {
  const u = JSON.parse(store.get('user') || '{}'), tb = document.querySelector('header .tb') || document.body;
  const box = document.createElement('span'); box.id = 'acct';
  box.innerHTML = `<span class="sep"></span>${u.admin ? '<button id="aUsers" title="Approve or manage registrations">Users<span class="badge" id="aBadge" hidden></span></button>' : ''}<button id="aPw" title="Change your password">Password</button><button id="aOut" title="${esc(u.email || '')}">Sign out</button>`;
  tb.appendChild(box);
  box.querySelector('#aOut').onclick = signOut; box.querySelector('#aPw').onclick = changePassword;
  if (u.admin) { box.querySelector('#aUsers').onclick = adminPanel; refreshBadge(); setInterval(refreshBadge, 120000); }
}
async function refreshBadge() { try { const l = await api('/admin/users'), n = l.filter((x) => x.status === 'pending').length, b = document.getElementById('aBadge'); if (b) { b.hidden = !n; b.textContent = n; } } catch (e) { /* ignore */ } }
function modal(html) { let m = document.getElementById('adm'); if (!m) { m = document.createElement('div'); m.id = 'adm'; document.body.appendChild(m); m.onclick = (e) => { if (e.target === m) m.remove(); }; } m.innerHTML = `<div class="card">${html}</div>`; return m; }
async function adminPanel() {
  const m = modal('<h2>Users</h2><p class="muted">Loading…</p>'); let list;
  try { list = await api('/admin/users'); } catch (e) { m.querySelector('.card').innerHTML = `<h2>Users</h2><p>${esc(e.message)}</p>`; return; }
  const d = (t) => (t ? new Date(t).toLocaleString() : '–'), pend = list.filter((x) => x.status === 'pending').length;
  m.innerHTML = `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h2>Users</h2><button id="xClose">Close</button></div>
    <p class="muted">${pend} waiting for approval · ${list.length} in total. New registrations appear here; nobody can open Therm-De until you approve them. Rejected users cannot sign in; “Revoke” takes effect the next time they open the app.</p>
    <table><tr><th>Name / e-mail</th><th>Institution · purpose</th><th>Status</th><th>Registered · last sign-in</th><th></th></tr>
    ${list.map((u) => `<tr><td><b>${esc(u.name || '–')}</b><br>${esc(u.email)}${u.admin ? ' <span class="muted">(administrator)</span>' : ''}</td><td>${esc(u.affiliation || '–')}<br><span class="muted">${esc(u.purpose || '')}</span></td>
      <td class="st ${u.status}">${u.status}</td><td class="muted">${d(u.created)}<br>${d(u.lastLogin)}</td>
      <td>${u.admin ? '' : `${u.status !== 'approved' ? `<button class="p" data-a="approved" data-id="${u.id}">Approve</button>` : `<button data-a="pending" data-id="${u.id}">Revoke</button>`}${u.status !== 'rejected' ? `<button data-a="rejected" data-id="${u.id}">Reject</button>` : ''}<button data-a="reset" data-id="${u.id}" title="Make a temporary password to give to the user">Reset password</button><button class="d" data-a="delete" data-id="${u.id}">Delete</button>`}</td></tr>`).join('')}</table></div>`;
  m.querySelector('#xClose').onclick = () => m.remove();
  m.querySelectorAll('[data-a]').forEach((b) => (b.onclick = async () => {
    const id = b.dataset.id, a = b.dataset.a, who = list.find((x) => x.id === id);
    try {
      if (a === 'delete') { if (!confirm(`Delete the account of ${who.email}? This cannot be undone.`)) return; await api('/admin/delete', { id }); }
      else if (a === 'reset') { if (!confirm(`Make a new temporary password for ${who.email}?`)) return; const r = await api('/admin/reset', { id }); prompt(`Temporary password for ${who.email} – give it to the user; they can change it under “Password” after signing in:`, r.temp); }
      else await api('/admin/set', { id, status: a });
      adminPanel(); refreshBadge();
    } catch (e) { alert(e.message); }
  }));
}
function changePassword() {
  const m = modal(`<h2>Change password</h2><form id="pwF" style="max-width:360px"><p><label>Current password<br><input name="old" type="password" required style="width:100%;padding:8px"></label></p>
    <p><label>New password (at least 8 characters)<br><input name="nw" type="password" minlength="8" required style="width:100%;padding:8px"></label></p><p><label>Repeat the new password<br><input name="nw2" type="password" minlength="8" required style="width:100%;padding:8px"></label></p>
    <button class="p">Save</button> <button type="button" id="pwX">Cancel</button><p id="pwM" class="muted"></p></form>`);
  const f = m.querySelector('#pwF'); m.querySelector('#pwX').onclick = () => m.remove();
  f.onsubmit = async (e) => { e.preventDefault(); const msg = m.querySelector('#pwM'); if (f.nw.value !== f.nw2.value) { msg.textContent = 'The two new passwords differ.'; return; }
    try { await api('/password', { old: f.old.value, new: f.nw.value }); msg.textContent = '✓ Password changed.'; setTimeout(() => m.remove(), 1200); } catch (err) { msg.textContent = err.message; } };
}

if (DEV) import('./js/main.js'); else start();
