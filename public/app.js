'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const date = value => new Date(typeof value === 'number' ? value * 1000 : value).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
let user = null, capabilities = {}, currentProject = null, currentAnalyses = [], routeVersion = 0, previousFocus;
async function api(path, method = 'GET', data) {
  const response = await fetch('/api/v1' + path, { method, credentials:'same-origin', headers: data === undefined ? {} : { 'Content-Type':'application/json' }, ...(data === undefined ? {} : { body:JSON.stringify(data) }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(result.error?.message || 'The request could not be completed.'); error.status = response.status; throw error; }
  return result;
}
function toast(message, error = false) {
  const item = document.createElement('div'); item.className = 'toast ' + (error ? 'error' : 'success'); item.textContent = message;
  $('#toast-region').append(item); setTimeout(() => item.remove(), 6500);
}
function download(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type:'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function go(path) { if (location.hash === '#app/' + path) route(); else location.hash = 'app/' + path; }
function header(title, subtitle, actions = '') { return `<div class="app-page-header"><div><p class="eyebrow">YOUR WORKSPACE</p><h1 tabindex="-1">${escape(title)}</h1><p>${escape(subtitle)}</p></div><div class="header-actions-app">${actions}</div></div>`; }
const newButton = '<a class="button button-primary" href="#app/new">+ New review</a>';
function field(name, label, value = '', options = {}) {
  const id = 'field-' + name;
  const attrs = `id="${id}" name="${name}" ${options.required ? 'required' : ''} ${options.max ? `maxlength="${options.max}"` : ''}`;
  return `<div class="form-field ${options.full ? 'full' : ''}"><label for="${id}">${escape(label)}</label>${options.area ? `<textarea ${attrs} rows="${options.rows || 4}">${escape(value)}</textarea>` : `<input ${attrs} type="${options.type || 'text'}" value="${escape(value)}" ${options.type === 'password' ? 'autocomplete="current-password"' : ''}>`}${options.help ? `<small class="field-helper">${escape(options.help)}</small>` : ''}</div>`;
}
function openAuth(mode) {
  previousFocus = document.activeElement;
  $('#auth-dialog').hidden = false;
  for (const el of [$('#site-header'), $('#main-content'), $('#site-footer')]) el.inert = true;
  document.body.classList.add('dialog-open');
  const title = mode === 'signup' ? 'Your next chapter starts here.' : mode === 'recover' ? 'Recover your workspace' : 'Welcome back.';
  $('#auth-content').innerHTML = `<h1 id="auth-title" class="auth-heading">${title}</h1><p class="auth-intro">${mode === 'signup' ? 'Create a private workspace. Save the recovery code shown after signup—email delivery is not enabled in this preview.' : mode === 'recover' ? 'Use your saved recovery code. This signs out all devices and revokes all API keys.' : 'Sign in to pick up where you left off.'}</p>
    <form class="auth-form" id="auth-form" data-mode="${mode}">
    ${mode === 'signup' ? field('name','Your name','',{ required:true,max:80 }) : ''}
    ${field('email','Email address','',{ type:'email',required:true,max:254 })}
    ${mode === 'recover' ? field('recoveryCode','Recovery code','',{ required:true,max:200 }) : ''}
    ${field('password',mode === 'recover' ? 'New password' : 'Password','',{ type:'password',required:true,max:128,help:'Use a unique passphrase of 15–128 characters.' })}
    ${mode === 'signup' ? '<p class="field-helper">Preview service: emails are unverified, no MFA, no guarantees of ranking or earnings. Avoid sensitive information. Read our <a href="/privacy.html" target="_blank" rel="noopener">privacy notice</a>.</p>' : ''}
    <p class="auth-error" role="alert" hidden></p><button class="button button-primary" type="submit">${mode === 'signup' ? 'Create workspace' : mode === 'recover' ? 'Reset password' : 'Sign in'}</button></form>
    <p class="auth-switch">${mode === 'login' ? 'New here? <button data-auth="signup">Create an account</button>' : 'Already registered? <button data-auth="login">Sign in</button>'}</p>
    ${mode === 'login' ? '<p class="auth-switch"><button data-auth="recover">Use a recovery code</button></p>' : ''}`;
  $('#field-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#auth-form input').focus();
}
function closeAuth() {
  $('#auth-dialog').hidden = true; $('#auth-content').replaceChildren();
  for (const el of [$('#site-header'), $('#main-content'), $('#site-footer')]) el.inert = false;
  document.body.classList.remove('dialog-open'); previousFocus?.focus();
}
function showRecovery(code) {
  $('#auth-content').innerHTML = `<h1 id="auth-title" class="auth-heading">Keep this somewhere safe.</h1><p class="auth-intro">This is your only account recovery method in the preview. It will not be shown again. Store it in your password manager.</p><div class="one-time-secret"><code>${escape(code)}</code></div><button class="button button-primary" id="save-recovery">Download recovery code</button><p class="auth-switch"><button id="finish-auth">I have saved it — continue</button></p>`;
  $('#save-recovery').onclick = () => download('elancebot-recovery.json', { email:user.email, recoveryCode:code });
  $('#finish-auth').onclick = () => { closeAuth(); go('dashboard'); };
  $('#save-recovery').focus();
}
function projectCard(p) {
  return `<article class="card project-card"><div class="project-card-meta"><span class="type-badge">${escape(p.kind)}</span><span>${date(p.updated_at)}</span></div><h2><a href="#app/project/${p.id}">${escape(p.name)}</a></h2><p>${escape(p.input.headline || p.input.url || 'Your next review starts here.')}</p><div class="project-card-bottom"><span>${p.review_count} review${p.review_count === 1 ? '' : 's'}</span><a class="score-chip" href="#app/project/${p.id}">${p.latest_score === null ? 'Review →' : p.latest_score + '/100 →'}</a></div></article>`;
}
function empty() { return `<div class="card empty-state"><span aria-hidden="true">✦</span><h2>A fresh space for better work.</h2><p>Bring a profile, service page, or gig draft. Your first review takes just a few minutes.</p>${newButton}</div>`; }
async function listPage(kind) {
  const { projects, counts } = await api('/dashboard');
  const intro = header(kind === 'projects' ? 'Saved projects' : `A clearer view, ${user.name.split(' ')[0]}.`, 'Small, well-informed improvements add up. Start with what you can show.', newButton);
  const metrics = `<div class="dashboard-metrics"><article class="card metric-card"><span>Saved projects</span><strong class="metric-value">${counts.projects}<small>/ 50</small></strong></article><article class="card metric-card"><span>Reviews completed</span><strong class="metric-value">${counts.reviews}</strong></article><article class="card metric-card"><span>Scoring model</span><strong class="metric-value">1.0<small>Transparent rules</small></strong></article><article class="card metric-card"><span>Your data</span><strong class="metric-value">Private<small>Export anytime</small></strong></article></div>`;
  return intro + (kind === 'projects' ? '<div class="projects-toolbar"><div class="search-wrap"><label for="project-search" class="sr-only">Search projects</label><input id="project-search" placeholder="Search your projects…"></div></div>' : metrics) + (projects.length ? `<div class="projects-grid" id="project-grid">${projects.map(projectCard).join('')}</div>` : empty()) + `<section class="card analysis-section workspace-note"><h2>What your score means</h2><p>A repeatable content checklist—not a Google, Fiverr, Upwork, or LinkedIn ranking. Compare revisions using the same inputs and scoring version.</p><a class="button button-secondary" href="#app/ownership">Website access</a> <a class="button button-secondary" href="#app/keys">Explore the API</a></section>`;
}
function inputFields(input = {}, prefix = '') {
  const value = key => Array.isArray(input[key]) ? input[key].join('\n') : input[key] || '';
  return field(prefix + 'headline','Headline or gig title',value('headline'),{ required:!prefix,max:240,full:true }) +
    field(prefix + 'overview','Overview / description',value('overview'),{ area:true,max:8000,full:true,rows:7,help:'Explain the audience, problem, deliverables, evidence, and next step. Only use claims you can substantiate.' }) +
    ['services','skills','keywords','portfolio','testimonials'].map(k => field(prefix+k,({services:'Services & deliverables',skills:'Skills / tags',keywords:'Target keywords',portfolio:'Work samples / case studies',testimonials:'Testimonials (with permission)'})[k],value(k),{ area:true,rows:3,max:3000,help:'One per line or separated by commas.' })).join('') +
    field(prefix + 'location','Market / location',value('location'),{ max:140 }) + field(prefix + 'profileUrl','Reference URL (not fetched)',value('profileUrl'),{ max:500,type:'url',full:true });
}
function formPage(project) {
  const p = project || { kind:'profile', input:{} }, input = p.input;
  return header(project ? 'Refine your draft' : 'What are you working on?', 'A few honest details are more useful than a perfect-sounding claim.') + `<div class="form-layout"><form class="card form-card" id="review-form" data-id="${p.id || ''}"><div class="form-grid">${field('name','Project name',p.name || '',{required:true,max:100,full:true})}<div class="form-field full"><label for="review-kind">Review type</label><select name="kind" id="review-kind" ${p.id ? 'disabled' : ''}>${['profile','gig','service','competitor','website'].map(k => `<option value="${k}" ${k === p.kind ? 'selected' : ''}>${({ profile:'Profile review',gig:'Gig review',service:'Service page review',competitor:'Competitor comparison',website:'Website metadata review' })[k]}</option>`).join('')}</select></div></div>
    <fieldset id="content-fields" ${p.kind === 'website' ? 'hidden disabled' : ''}><legend>Your content</legend><div class="form-grid">${inputFields(input)}</div></fieldset>
    <fieldset id="competitor-fields" ${p.kind !== 'competitor' ? 'hidden disabled' : ''}><legend>Competitor snapshot</legend><p>Paste only public or authorized information. We do not scrape, verify, or fetch competitor accounts. Supply comparable detail on both sides.</p><div class="form-grid">${inputFields(input.competitor, 'competitor_')}</div></fieldset>
    <fieldset id="website-fields" ${p.kind !== 'website' ? 'hidden disabled' : ''}><legend>Website metadata</legend><div class="form-grid">${field('url','HTTPS page URL',input.url || '',{ required:true,type:'url',max:2048,full:true,help:'Approved hosts: ' + (capabilities.allowedUrlHosts?.join(', ') || 'None configured. Ask the operator to approve your domain.') })}</div><div class="form-check"><input type="checkbox" id="attested" name="attested" required ${input.attested ? 'checked' : ''}><label for="attested">I own this website or have permission to review it. This does not verify legal ownership.</label></div><p>Only the returned HTML is inspected. No redirects, query parameters, scripts, login cookies, private addresses, or marketplace scraping.</p></fieldset>
    <p class="field-error" role="alert" hidden></p><div class="form-actions"><button class="button button-primary" type="submit">${p.id ? 'Save & review revision' : 'Save & run review'}</button><a class="button button-secondary" href="#app/projects">Cancel</a></div></form>
    <aside class="card side-panel"><p class="eyebrow">MAKE IT USEFUL</p><h2>Your evidence, made actionable.</h2><ul class="signal-list"><li><span>1</span>Use a clear specialty and audience.</li><li><span>2</span>Describe real deliverables and boundaries.</li><li><span>3</span>Support outcomes with honest proof.</li><li><span>4</span>Give the client an easy next step.</li></ul><p>No AI model or live ranking provider is connected. Every recommendation comes from open, versioned rules.</p></aside></div>`;
}
function resultHtml(analysis, previous) {
  const r = analysis.result;
  const diff = previous ? analysis.score - previous.score : null;
  return `<div class="results-layout"><div><section class="card score-hero"><div class="score-number"><strong>${r.score}</strong><span>/ 100</span></div><div class="score-hero-copy"><p class="eyebrow">CONTENT CHECKLIST</p><h2>${escape(r.band)}</h2><p>${diff === null ? 'Your first baseline. Improve the draft, then review again.' : `${diff >= 0 ? '+' : ''}${diff} points versus the preceding review. This is not a marketplace ranking.`}</p></div></section>
    <section class="card analysis-section"><h2>Where the score comes from</h2><div class="score-breakdown">${r.criteria.map(c => `<div><div class="breakdown-row"><span>${escape(c.label)}</span><meter min="0" max="${c.maxScore}" value="${c.score}" aria-label="${escape(c.label)}">${c.score}/${c.maxScore}</meter><b>${c.score}/${c.maxScore}</b></div><details><summary>View evidence</summary><ul>${c.evidence.map(e => `<li>${escape(e)}</li>`).join('')}</ul></details></div>`).join('')}</div></section>
    ${r.comparison ? `<section class="card analysis-section"><h2>Compare the supplied snapshots</h2><div class="table-scroll"><table><thead><tr><th>Criterion</th><th>Your draft</th><th>Competitor</th></tr></thead><tbody>${r.comparison.criteria.map(c => `<tr><th>${escape(c.label)}</th><td>${c.own}/${c.max}</td><td>${c.competitor}/${c.max}</td></tr>`).join('')}</tbody></table></div><p>${escape(r.comparison.note)}</p></section>` : ''}
    <section class="card analysis-section"><h2>Your next improvements</h2><p>Prioritized actions to review before publishing.</p><div class="recommendation-list">${r.recommendations.length ? r.recommendations.map((rec,i) => `<article class="recommendation-item"><span>${i+1}</span><div><strong>${escape(rec.title)}</strong><p>${escape(rec.action)}</p><small>${escape(rec.impact)} impact · ${escape(rec.effort)} effort</small></div></article>`).join('') : '<p>The checklist is covered. Check factual accuracy, accessibility, and audience fit with a human reviewer.</p>'}</div></section></div>
    <aside><section class="card result-meta-card"><h2>Traceable, not mysterious.</h2><dl><div class="meta-pair"><dt>Reviewed</dt><dd>${date(analysis.created_at)}</dd></div><div class="meta-pair"><dt>Rules version</dt><dd>${escape(r.auditVersion)}</dd></div><div class="meta-pair"><dt>Source</dt><dd>${escape(r.dataProvenance.source)}</dd></div></dl><p>${escape(r.dataProvenance.note)}</p><ul>${r.limitations.map(l => `<li>${escape(l)}</li>`).join('')}</ul>${r.metadata ? `<details><summary>Extracted metadata</summary><pre>${escape(JSON.stringify(r.metadata,null,2))}</pre></details>` : ''}</section></aside></div>`;
}
async function projectPage(id) {
  const data = await api('/projects/' + encodeURIComponent(id)); currentProject = data.project; currentAnalyses = data.analyses;
  return header(currentProject.name, 'A private record of the work, the evidence, and your improvements.', `<a class="button button-primary" href="#app/edit/${id}">Improve draft</a><button class="button button-secondary" data-action="export-project">Export JSON</button><button class="button button-danger" data-action="delete-project">Delete</button>`) +
    (data.analyses.length ? `<div class="projects-toolbar"><label for="revision-select">Review history</label><select id="revision-select">${data.analyses.map((a,i) => `<option value="${i}">Review ${data.analyses.length-i} · ${date(a.created_at)} · ${a.score}/100</option>`).join('')}</select></div><div id="result-container">${resultHtml(data.analyses[0],data.analyses[1])}</div>` : '<div class="card empty-state"><h2>Your draft is saved.</h2><p>No review has completed yet. Check the inputs and try again.</p><button class="button button-primary" data-action="run-review">Run review</button></div>');
}
function ownershipPage() {
  return header('Safe website access', 'A narrow, explicit permission boundary for public website checks.') + `<div class="settings-layout"><section class="card analysis-section"><h2>Approved hostnames</h2><ul>${(capabilities.allowedUrlHosts || []).map(h => `<li><code>${escape(h)}</code></li>`).join('') || '<li>No domains configured.</li>'}</ul><p>In this preview, you can audit the preview homepage after confirming permission. To review your domain, the operator must verify control and add the exact hostname to URL_ALLOWED_HOSTS in the deployment configuration. Subdomains are not automatically approved.</p><a class="button button-primary" href="#app/new">Start a website review</a></section><section class="card analysis-section"><h2>What is—and is not—verified</h2><p>Your attestation records permission, not legal ownership. Approved hosts are an operator-managed security control.</p><p>We fetch HTTPS HTML up to 512 KB, wait at most eight seconds, and do not follow redirects or run page scripts. Marketplace pages, IP addresses, query parameters and private hostnames are blocked.</p><p>For gigs and profiles, paste authorized content into a content review. Your reference URL is never fetched.</p></section></div>`;
}
async function keysPage() {
  const { keys } = await api('/api-keys');
  return header('Your tools. Your API.', 'Connect scripts to your own workspace with scoped, revocable keys.') + `<div class="settings-layout"><section class="card"><div class="card-header"><h2>API keys</h2></div><div id="secret-slot"></div><form class="key-create-row" id="key-form"><input aria-label="Key name" name="name" placeholder="e.g. My reporting script" required maxlength="80"><select name="scope" aria-label="Key permissions"><option value="read">Read only</option><option value="write">Read & write</option></select><button class="button button-primary" type="submit">Create key</button></form><div class="key-list" id="key-list">${keys.map(k => `<div class="key-row"><div><strong>${escape(k.name)}</strong><small>${escape(k.prefix)}… · ${k.scope} · expires ${date(k.expires_at)}</small></div><button class="delete-key" data-key="${k.id}">Revoke</button></div>`).join('') || '<p>No active API keys.</p>'}</div></section><section class="card analysis-section"><h2>Open API. Private data.</h2><p>Use Bearer authentication from server-side scripts. Read keys cannot make changes. Keys cannot manage other keys or account settings. All keys expire in 30 days.</p><a class="button button-secondary" href="/api/v1/openapi" target="_blank" rel="noopener">OpenAPI 3.1 specification ↗</a><pre>curl YOUR_ORIGIN/api/v1/projects \
  -H "Authorization: Bearer $ELANCEBOT_KEY"</pre><p>Never place API keys in frontend code, URLs, commits, or public screenshots.</p></section></div>`;
}
function settingsPage() {
  return header('Your account, in your control.', 'Export your workspace or remove it when you are done.') + `<div class="settings-layout"><section class="card analysis-section"><h2>${escape(user.name)}</h2><p>${escape(user.email)}</p><p class="status-badge pending">Email not verified · preview account</p><p>No email provider or MFA is connected. Keep your offline recovery code. Do not use this preview for sensitive client data.</p><button class="button button-secondary" data-action="export-account">Download all my data</button><p><a href="/privacy.html" target="_blank" rel="noopener">Privacy and retention notice ↗</a></p></section><form id="delete-account-form" class="card form-card"><h2>Delete account</h2><p>This permanently removes your account, projects, reviews and active keys from the live database. Export first. Provider backups may persist for their retention window.</p><div class="form-grid">${field('password','Current password','',{required:true,type:'password',full:true,max:128})}${field('confirm','Type DELETE to confirm','',{required:true,full:true,max:6})}</div><div class="form-actions"><button class="button button-danger" type="submit">Permanently delete account</button></div><p class="field-error" role="alert" hidden></p></form></div>`;
}
async function route() {
  const version = ++routeVersion, isApp = location.hash.startsWith('#app/');
  document.body.classList.remove('sidebar-open');
  $('#marketing-view').hidden = isApp; $('#site-header').hidden = isApp; $('#site-footer').hidden = isApp; $('#app-view').hidden = !isApp;
  if (!isApp) { document.title = 'Elancebot — clearer service-page reviews'; return; }
  if (!user) { openAuth('login'); return; }
  $('#sidebar-user-name').textContent = user.name; $('#sidebar-user-email').textContent = user.email; $('#sidebar-avatar').textContent = user.name[0].toUpperCase();
  const [page,id] = location.hash.slice(5).split('/');
  $('#app-crumb').textContent = ({dashboard:'Overview',new:'New review',projects:'Saved projects',project:'Review results',edit:'Improve draft',ownership:'URL ownership',keys:'API access',settings:'Account settings'})[page] || 'Workspace';
  $$('.app-nav a').forEach(a => { const active = a.dataset.appRoute === page; a.classList.toggle('active',active); if(active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  $('#app-page').innerHTML = '<div class="loading-state" role="status"><span class="spinner"></span>Loading your workspace…</div>';
  try {
    let html;
    if (page === 'dashboard' || page === 'projects') html = await listPage(page);
    else if (page === 'new') html = formPage();
    else if (page === 'edit') { const { project } = await api('/projects/' + encodeURIComponent(id)); html = formPage(project); }
    else if (page === 'project') html = await projectPage(id);
    else if (page === 'ownership') html = ownershipPage();
    else if (page === 'keys') html = await keysPage();
    else if (page === 'settings') html = settingsPage();
    else html = header('Page not found','Choose a page from the workspace navigation.');
    if (version !== routeVersion) return;
    $('#app-page').innerHTML = html; document.title = $('#app-crumb').textContent + ' — Elancebot';
    $('#connection-status').textContent = 'Private workspace'; $('#app-page h1')?.focus({preventScroll:true}); window.scrollTo(0,0);
  } catch (error) {
    if (version !== routeVersion) return;
    if (error.status === 401) { user = null; openAuth('login'); }
    $('#app-page').innerHTML = `<div class="card empty-state"><h1>We couldn’t load that page.</h1><p>${escape(error.message)}</p><button class="button button-primary" data-action="retry">Try again</button></div>`;
  }
}
document.addEventListener('submit', async event => {
  const form = event.target; if (!['auth-form','review-form','key-form','delete-account-form'].includes(form.id)) return;
  event.preventDefault(); const button = $('button[type="submit"]',form), oldLabel = button.textContent; button.disabled = true; button.textContent = 'Working…';
  const formError = $('.auth-error,.field-error',form); if (formError) formError.hidden = true;
  try {
    const values = Object.fromEntries(new FormData(form));
    if (form.id === 'auth-form') {
      const result = await api('/auth/' + ({signup:'register',login:'login',recover:'recover'})[form.dataset.mode], 'POST', values);
      user = result.user;
      if (result.recoveryCode) showRecovery(result.recoveryCode); else { closeAuth(); go('dashboard'); }
    } else if (form.id === 'review-form') {
      const kind = $('#review-kind').value, input = {};
      if (kind === 'website') { input.url = values.url; input.attested = values.attested === 'on'; }
      else {
        for (const key of ['headline','overview','services','skills','keywords','portfolio','testimonials','location','profileUrl']) input[key] = values[key] || '';
        if (kind === 'competitor') { input.competitor = {}; for (const key of Object.keys(input).filter(k => k !== 'competitor')) input.competitor[key] = values['competitor_' + key] || ''; }
      }
      const body = { name: values.name, kind, input };
      const result = await api('/projects' + (form.dataset.id ? '/' + form.dataset.id : ''), form.dataset.id ? 'PATCH' : 'POST', body);
      try { await api('/projects/' + result.project.id + '/analyses','POST'); toast('Review saved. Your next improvements are ready.'); }
      catch(error) { toast('Draft saved. ' + error.message,true); }
      go('project/' + result.project.id);
    } else if (form.id === 'key-form') {
      const result = await api('/api-keys','POST',values);
      await route();
      if ($('#secret-slot')) $('#secret-slot').innerHTML = `<div class="one-time-secret"><p>Copy this secret now. It will not be shown again. Expires ${date(result.key.expires_at)}.</p><code>${escape(result.secret)}</code></div>`;
    } else {
      await api('/account','DELETE',values); user = null; location.hash = ''; toast('Your live workspace data and account have been deleted.');
    }
  } catch(error) { if(formError?.isConnected) { formError.textContent = error.message; formError.hidden = false; } else toast(error.message,true); }
  finally { if(button.isConnected) { button.disabled = false; button.textContent = oldLabel; } }
});
document.addEventListener('click', async event => {
  const el = event.target.closest('button,a,[data-close-auth]'); if(!el) return;
  if (el.matches('[data-route]')) { event.preventDefault(); const dest = el.dataset.route; if(dest === 'home') { closeAuth(); location.hash = ''; } else if(user) go('dashboard'); else openAuth(dest); return; }
  if(el.dataset.auth) { openAuth(el.dataset.auth); return; }
  if(el.matches('[data-close-auth]')) { closeAuth(); if(!user && location.hash.startsWith('#app/')) location.hash = ''; return; }
  if(el.matches('.theme-toggle')) { const dark = document.documentElement.dataset.theme !== 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light'; try { localStorage.setItem('elancebot-theme', dark ? 'dark' : 'light'); } catch {} updateTheme(); return; }
  if(el.matches('.mobile-menu')) { document.body.classList.add('sidebar-open'); return; }
  if(el.matches('.sidebar-close,.app-backdrop')) { document.body.classList.remove('sidebar-open'); return; }
  if(el.matches('.sidebar-user')) { go('settings'); return; }
  try {
    if(el.id === 'signout-button') { await api('/auth/logout','POST'); user = null; currentProject = null; currentAnalyses = []; $('#app-page').replaceChildren(); location.hash = ''; toast('Signed out.'); }
    if(el.dataset.key) { await api('/api-keys/' + el.dataset.key,'DELETE'); toast('Key revoked.'); await route(); }
    const action = el.dataset.action;
    if(action === 'retry') route();
    if(action === 'export-project') download('elancebot-project.json',{project:currentProject,analyses:currentAnalyses});
    if(action === 'export-account') download('elancebot-workspace.json',await api('/account/export'));
    if(action === 'delete-project' && confirm('Permanently delete this project and its reviews? Export it first if you need a copy.')) { await api('/projects/' + currentProject.id,'DELETE'); go('projects'); toast('Project deleted.'); }
    if(action === 'run-review') { el.disabled = true; await api('/projects/' + currentProject.id + '/analyses','POST'); await route(); }
  } catch(error) { toast(error.message,true); if(el.isConnected) el.disabled = false; }
});
document.addEventListener('change', event => {
  if(event.target.id === 'review-kind') { const kind = event.target.value; for(const [id,visible] of [['content-fields',kind !== 'website'],['competitor-fields',kind === 'competitor'],['website-fields',kind === 'website']]) { $('#'+id).hidden = !visible; $('#'+id).disabled = !visible; } }
  if(event.target.id === 'revision-select') { const i = Number(event.target.value); $('#result-container').innerHTML = resultHtml(currentAnalyses[i],currentAnalyses[i+1]); }
});
document.addEventListener('input', event => {
  if(event.target.id === 'project-search') $$('.project-card').forEach(card => card.hidden = !card.textContent.toLowerCase().includes(event.target.value.toLowerCase()));
});
document.addEventListener('keydown', event => {
  if(event.key === 'Escape') { if(!$('#auth-dialog').hidden) { closeAuth(); if(!user) location.hash = ''; } document.body.classList.remove('sidebar-open'); }
  if(event.key === 'Tab' && !$('#auth-dialog').hidden) {
    const focusable = $$('button,a,input,select,textarea', $('#auth-dialog')).filter(el => !el.disabled && el.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if(event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if(!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
function updateTheme() { $$('.theme-toggle').forEach(button => { const dark = document.documentElement.dataset.theme === 'dark'; button.setAttribute('aria-pressed', String(dark)); button.setAttribute('aria-label', 'Switch to ' + (dark ? 'light' : 'dark') + ' theme'); }); }
async function init() {
  try { document.documentElement.dataset.theme = localStorage.getItem('elancebot-theme') || 'light'; } catch {} updateTheme();
  $('#year').textContent = new Date().getFullYear();
  const results = await Promise.allSettled([api('/auth/session'),api('/tools')]);
  if(results[0].status === 'fulfilled') user = results[0].value.user;
  if(results[1].status === 'fulfilled') capabilities = results[1].value;
  else toast('The service is unavailable. Please refresh in a moment.',true);
  window.addEventListener('hashchange',route); route();
}
init();
