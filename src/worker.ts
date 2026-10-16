import { auditProfile } from './lib/scoring.mjs';
import { checkOrigin, checkPassword, digest, fail, hashPassword, HttpError, readJson, token, validatePassword } from './lib/security.mjs';
import { analyzeWebsite, readWebsite } from './lib/website';
import { analyzeOffer, insightContext, referenceUrl, sourcePlatform, sourceText } from './lib/insights.mjs';
import { generateImprovements, type InsightSource } from './lib/improvements';
import { openapi } from './openapi';
import { assets } from './generated-assets.mjs';
import { findTool, runTool, toolCatalog } from './lib/toolkit.mjs';
import { experimentPlan, experimentObservations, experimentComparison } from './lib/experiments.mjs';
import { linkedinInput, analyzeLinkedin } from './lib/linkedin.mjs';

type Row = Record<string, any>;
type Identity = { id: string; email: string; name: string; scope: 'session' | 'read' | 'write' };
type InsightEnv = Env & {AI?:Ai;AI_ENABLED?:string};
const aiAvailable = (env:InsightEnv) => env.AI_ENABLED === 'true' && Boolean(env.AI);
const json = (body: unknown, status = 200, headers: HeadersInit = {}) => Response.json(body, { status, headers });
const now = () => Math.floor(Date.now() / 1000);
const statement = (env: Env, sql: string, ...params: unknown[]) => env.DB.prepare(sql).bind(...params);
const first = (env: Env, sql: string, ...params: unknown[]) => statement(env, sql, ...params).first<Row>();
const all = async (env: Env, sql: string, ...params: unknown[]) => (await statement(env, sql, ...params).all<Row>()).results;
function text(value: unknown, max = 240) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function email(value: unknown) {
  const result = text(value, 255).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400, 'invalid_email', 'Enter a valid email address.');
  return result;
}
function cookie(request: Request, value: string, age = 604800) {
  const secure = new URL(request.url).protocol === 'https:';
  return `${secure ? '__Host-' : ''}elancebot=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? '; Secure' : ''}`;
}
function sessionToken(request: Request) {
  const name = new URL(request.url).protocol === 'https:' ? '__Host-elancebot' : 'elancebot';
  return request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1) || '';
}
async function rate(env: Env, key: string, limit: number, seconds = 900) {
  const bucket = await digest(key + ':' + Math.floor(now() / seconds));
  const row = await first(env, `INSERT INTO rate_limits(bucket,hits,expires_at) VALUES(?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits`, bucket, now() + seconds);
  if (Number(row?.hits) > limit) fail(429, 'rate_limited', `Too many requests. Try again after ${seconds} seconds.`);
}
async function identify(request: Request, env: Env): Promise<Identity> {
  const bearer = request.headers.get('authorization');
  let row: Row | null;
  if (bearer) {
    if (!/^Bearer eb_[a-f0-9]{64}$/.test(bearer)) fail(401, 'unauthorized', 'Invalid API key.');
    row = await first(env, `SELECT u.id,u.name,u.email,k.scope FROM api_keys k JOIN users u ON u.id=k.user_id WHERE k.token_hash=? AND k.expires_at>?`, await digest(bearer.slice(7)), now());
  } else {
    const session = sessionToken(request);
    if (!session) fail(401, 'unauthorized', 'Sign in to continue.');
    row = await first(env, `SELECT u.id,u.name,u.email,'session' AS scope FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`, await digest(session), now());
  }
  if (!row!) fail(401, 'unauthorized', 'Your session or API key has expired. Sign in again.');
  const user = row! as Identity;
  if (user.scope === 'read' && !['GET','HEAD'].includes(request.method)) fail(403, 'scope_required', 'This action needs a write-scoped API key.');
  await rate(env, 'api:' + user.id, 180, 60);
  return user;
}
function sessionOnly(user: Identity) { if (user.scope !== 'session') fail(403, 'session_required', 'Use an interactive signed-in session for account and key settings.'); }
async function startSession(request: Request, env: Env, user: Row, recoveryCode?: string) {
  const value = token();
  await statement(env, 'INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)', await digest(value), user.id, now() + 604800).run();
  return json({ user: { id: user.id, name: user.name, email: user.email, emailVerified: false }, ...(recoveryCode ? { recoveryCode } : {}) }, 200, { 'Set-Cookie': cookie(request, value) });
}
async function ownedProject(env: Env, id: string, user: Identity) {
  const project = await first(env, 'SELECT * FROM projects WHERE id=? AND user_id=?', id, user.id);
  if (!project) fail(404, 'not_found', 'Project not found.');
  return project!;
}
function projectOut(row: Row) { const { input_json, user_id, ...rest } = row; return { ...rest, input: JSON.parse(input_json) }; }
function analysisOut(row: Row) { const { result_json, ...rest } = row; return { ...rest, result: JSON.parse(result_json) }; }
function experimentOut(row: Row) {
  const {user_id,plan_json,observations_json,...rest}=row;
  const observations=JSON.parse(observations_json);
  return {...rest,plan:JSON.parse(plan_json),observations,comparison:experimentComparison(observations)};
}
function inputData(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'invalid_input', 'Project input must be an object.');
  const encoded = JSON.stringify(value);
  if (encoded.length > 24_000) fail(413, 'too_large', 'Project input must be under 24,000 characters.');
  return encoded;
}
async function saveAnalysis(env: Env, project: Row, result: Row) {
  const id = crypto.randomUUID();
  const inserted = await first(env, `INSERT INTO analyses(id,project_id,result_json,score) SELECT ?,?,?,?
    WHERE (SELECT count(*) FROM analyses WHERE project_id=?)<50 RETURNING *`, id, project.id, JSON.stringify(result), result.score, project.id);
  if (!inserted) fail(409, 'quota', 'A project supports 50 revisions. Export and create a new project to continue.');
  await statement(env, "UPDATE projects SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", project.id).run();
  return analysisOut(inserted!);
}
async function saveInsight(env:Env, user:Identity, project:Row|null, name:string, kind:string, encoded:string, result:Row) {
  const projectId=project?.id || crypto.randomUUID(), analysisId=crypto.randomUUID();
  const insertAnalysis=statement(env,`INSERT INTO analyses(id,project_id,result_json,score)
    SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM projects WHERE id=? AND user_id=?)
    AND (SELECT count(*) FROM analyses WHERE project_id=?)<50 RETURNING *`,analysisId,projectId,JSON.stringify(result),result.score,projectId,user.id,projectId);
  // D1 batch is transactional. A rejected quota cannot update the draft or leave
  // an orphan project; the update is conditional on this exact review existing.
  const writes=project ? [insertAnalysis,statement(env,`UPDATE projects SET input_json=?,name=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
    WHERE id=? AND user_id=? AND EXISTS(SELECT 1 FROM analyses WHERE id=?) RETURNING *`,encoded,name,projectId,user.id,analysisId)] : [statement(env,`INSERT INTO projects(id,user_id,name,kind,input_json)
    SELECT ?,?,?,?,? WHERE (SELECT count(*) FROM projects WHERE user_id=?)<50 RETURNING *`,projectId,user.id,name,kind,encoded,user.id),insertAnalysis];
  const saved=await env.DB.batch<Row>(writes);
  const savedProject=saved[project?1:0].results[0],savedAnalysis=saved[project?0:1].results[0];
  if(!savedProject || !savedAnalysis) fail(409,'quota',project?'A project supports 50 revisions. Export and create a new project to continue.':'You can save up to 50 projects. Export and remove an old project first.');
  return {project:projectOut(savedProject),analysis:analysisOut(savedAnalysis)};
}
function ownWebsite(value: string, env: Env) {
  let ownPage: Response | undefined;
  // Workers cannot recursively fetch their own route. Inspect the same rendered
  // public HTML locally and label that provenance explicitly instead.
  try {
    const target = new URL(value);
    if (target.origin === env.PUBLIC_ORIGIN && ['/', '/index.html'].includes(target.pathname))
      ownPage = new Response(assets['/index.html'].content.replaceAll('https://elancebot.com',env.PUBLIC_ORIGIN), { headers:{'content-type':'text/html',...(env.ENVIRONMENT === 'preview' ? {'x-robots-tag':'noindex, nofollow'} : {})} });
  } catch { /* safeUrl supplies the validation error */ }
  return ownPage;
}
async function website(value: string, env: Env) {
  return analyzeWebsite(value, env.URL_ALLOWED_HOSTS, ownWebsite(value,env));
}
async function insightSource(value:unknown, supplied:unknown, role:string, env:Env):Promise<InsightSource> {
  const url=referenceUrl(value).href,platform=sourcePlatform(url);
  if(supplied !== undefined && supplied !== '' && typeof supplied!=='string') fail(400,'invalid_input','Imported source content must be text.');
  if(typeof supplied==='string' && supplied.trim()) return {role,url,platform,text:sourceText(supplied),retrieval:'user-supplied-snapshot',capturedAt:new Date().toISOString()};
  if(platform!=='Website') fail(422,'platform_connection_required',`${platform} URL recognized. Automatic page access is not connected or approved. Add an authorized text/export snapshot for this URL; it will be labeled as supplied, not live-fetched.`);
  const page=await readWebsite(url,env.URL_ALLOWED_HOSTS,ownWebsite(url,env));
  return {role,url,platform,text:sourceText(page.content.slice(0,8000)),retrieval:page.retrieval,capturedAt:page.fetchedAt,metadata:page.metadata};
}
async function api(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url), path = url.pathname.slice('/api/v1'.length), method = request.method;
  if (!url.pathname.startsWith('/api/v1/')) fail(404, 'not_found', 'API version not found.');
  checkOrigin(request);
  if (method === 'GET' && path === '/health') return json({ status: 'ok', version: '0.5.0', environment: env.ENVIRONMENT });
  if (method === 'GET' && path === '/openapi') return json(openapi(url.origin));
  if (method === 'GET' && path === '/tools') return json({ tools: ['profile','gig','service','competitor','website'], catalog: toolCatalog, scoringVersion: '1.0.0', allowedUrlHosts: env.URL_ALLOWED_HOSTS.split(',').filter(Boolean), liveRankings: false, aiGenerated: false, urlInsights:{enabled:true,aiEnabled:aiAvailable(env),platformAutoFetch:false}, accountRecovery: 'offline-recovery-code', emailVerified: false });
  if (path.startsWith('/auth/') && method === 'POST') {
    const ip = request.headers.get('cf-connecting-ip') || 'local';
    await rate(env, 'auth-ip:' + ip, 20);
    ctx.waitUntil(env.DB.batch([
      statement(env, 'DELETE FROM rate_limits WHERE expires_at<?', now()),
      statement(env, 'DELETE FROM sessions WHERE expires_at<?', now()),
      statement(env, 'DELETE FROM api_keys WHERE expires_at<?', now())
    ]).catch(() => console.error('auth_cleanup_failed')));
    if (path === '/auth/logout') {
      await statement(env, 'DELETE FROM sessions WHERE token_hash=?', await digest(sessionToken(request))).run();
      return json({ ok: true }, 200, { 'Set-Cookie': cookie(request, '', 0) });
    }
    const body = await readJson(request), address = email(body.email);
    await rate(env, 'auth-email:' + address, 10);
    if (path === '/auth/register') {
      const name = text(body.name, 80);
      if (!name) fail(400, 'name_required', 'Enter your name.');
      const passwordHash = await hashPassword(body.password), recoveryCode = token('recover_');
      const user = { id: crypto.randomUUID(), email: address, name };
      const inserted = await first(env, `INSERT INTO users(id,email,name,password_hash,recovery_hash) VALUES(?,?,?,?,?) ON CONFLICT(email) DO NOTHING RETURNING id`, user.id, address, name, passwordHash, await digest(recoveryCode));
      if (!inserted) fail(409, 'registration_unavailable', 'Unable to register with these details. Try signing in or use your recovery code.');
      return startSession(request, env, user, recoveryCode);
    }
    if (path === '/auth/login') {
      const user = await first(env, 'SELECT * FROM users WHERE email=?', address);
      if (!await checkPassword(body.password, user?.password_hash) || !user) fail(401, 'invalid_credentials', 'Email or password is incorrect.');
      return startSession(request, env, user!);
    }
    if (path === '/auth/recover') {
      validatePassword(body.password);
      const recoveryHash = await digest(text(body.recoveryCode, 200));
      const passwordHash = await hashPassword(body.password), recoveryCode = token('recover_');
      // Atomic consume prevents replay of the recovery code.
      const user = await first(env, 'UPDATE users SET password_hash=?,recovery_hash=? WHERE email=? AND recovery_hash=? RETURNING id,email,name', passwordHash, await digest(recoveryCode), address, recoveryHash);
      if (!user) fail(401, 'recovery_failed', 'The email or recovery code is incorrect.');
      await env.DB.batch([statement(env, 'DELETE FROM sessions WHERE user_id=?', user.id), statement(env, 'DELETE FROM api_keys WHERE user_id=?', user.id)]);
      return startSession(request, env, user, recoveryCode);
    }
    fail(404, 'not_found', 'Endpoint not found.');
  }
  const user = await identify(request, env);
  if(path==='/linkedin/analyze' && method==='POST') {
    const body=await readJson(request);
    if(body.attested!==true)fail(400,'attestation_required','Confirm you are authorized to analyze this profile content.');
    const project=body.projectId?await ownedProject(env,text(body.projectId,100),user):null;
    if(project && JSON.parse(project.input_json).workflow!=='linkedin')fail(409,'workflow_mismatch','Use a dedicated LinkedIn project for this revision.');
    await rate(env,'linkedin:'+user.id,20,3600);
    const input=linkedinInput(body),result=analyzeLinkedin(input);
    return json(await saveInsight(env,user,project,'LinkedIn: '+(input.profile.headline||input.goal).slice(0,80),'profile',inputData(input),result),201);
  }
  if(path==='/experiments') {
    if(method==='GET') return json({experiments:(await all(env,'SELECT * FROM experiments WHERE user_id=? ORDER BY updated_at DESC,id DESC',user.id)).map(experimentOut)});
    if(method==='POST') {
      const body=await readJson(request),plan=experimentPlan(body);
      let projectId=null;
      if(body.projectId!==undefined && body.projectId!==null && body.projectId!=='') {
        if(typeof body.projectId!=='string') fail(400,'invalid_experiment','Project ID must be text.');
        projectId=(await ownedProject(env,body.projectId,user)).id;
      }
      await rate(env,'experiments:'+user.id,30,3600);
      const row=await first(env,`INSERT INTO experiments(id,user_id,project_id,plan_json) SELECT ?,?,?,?
        WHERE (SELECT count(*) FROM experiments WHERE user_id=?)<50 RETURNING *`,crypto.randomUUID(),user.id,projectId,JSON.stringify(plan),user.id);
      if(!row) fail(409,'quota','You can save 50 experiments. Export and remove an old experiment first.');
      return json({experiment:experimentOut(row!)},201);
    }
  }
  const experimentMatch=path.match(/^\/experiments\/([\w-]+)$/);
  if(experimentMatch) {
    const id=experimentMatch[1],row=await first(env,'SELECT * FROM experiments WHERE id=? AND user_id=?',id,user.id);
    if(!row) fail(404,'not_found','Experiment not found.');
    if(method==='GET') return json({experiment:experimentOut(row!)});
    if(method==='DELETE') {await statement(env,'DELETE FROM experiments WHERE id=? AND user_id=?',id,user.id).run();return json({ok:true});}
    if(method==='PATCH') {
      const body=await readJson(request);
      if(!Number.isSafeInteger(body.version) || body.version<1 || !Object.hasOwn(body,'baseline') || !Object.hasOwn(body,'followUp')) fail(400,'invalid_observation','Provide version, baseline and followUp (null clears a period).');
      const observations=experimentObservations(body,JSON.parse(row!.plan_json));
      const updated=await first(env,`UPDATE experiments SET observations_json=?,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND user_id=? AND version=? RETURNING *`,JSON.stringify(observations),id,user.id,body.version);
      if(!updated) fail(409,'version_conflict','This experiment changed. Reopen it before saving; your inputs have not been applied.');
      return json({experiment:experimentOut(updated!)});
    }
  }
  if(path==='/insights' && method==='POST') {
    const body=await readJson(request),context=insightContext(body);
    if(body.attested!==true) fail(400,'attestation_required','Confirm you are authorized to analyze both sources.');
    if(body.useAi!==undefined && typeof body.useAi!=='boolean') fail(400,'invalid_input','useAi must be a boolean.');
    if(body.competitorText && !body.competitorUrl) fail(400,'competitor_url_required','Provide the URL associated with the competitor snapshot.');
    const projectId=text(body.projectId,100);
    const project=projectId?await ownedProject(env,projectId,user):null;
    const count=project ? await first(env,'SELECT count(*) AS n FROM analyses WHERE project_id=?',project.id) : await first(env,'SELECT count(*) AS n FROM projects WHERE user_id=?',user.id);
    if(Number(count?.n)>=50) fail(409,'quota',project?'This project has 50 reviews. Export and start another project.':'You have 50 projects. Export and remove an old project first.');
    if(body.useAi && (!aiAvailable(env) || body.aiConsent!==true)) fail(503,'ai_not_available','AI needs an enabled provider and your explicit source-processing consent. You can run the evidence review without AI.');
    await rate(env,'insights:'+user.id,10,3600);
    const own=await insightSource(body.url,body.sourceText,'own',env);
    const competitor=body.competitorUrl?await insightSource(body.competitorUrl,body.competitorText,'competitor',env):undefined;
    const result:Row=analyzeOffer(own,competitor,context);
    if(body.useAi) {
      await rate(env,'ai-user:'+user.id,3,86400);
      await rate(env,'ai-application',10,86400);
      try { result.ai=await generateImprovements((env as InsightEnv).AI!,own,competitor,context); }
      catch(error) { result.aiError=error instanceof HttpError?error.message:'AI could not complete a valid response. The evidence review was saved; no AI rewrite was substituted.'; }
    }
    const input={workflow:'url-insights',url:own.url,sourceText:own.text,competitorUrl:competitor?.url||'',competitorText:competitor?.text||'',...context,keywords:context.keywords.join(', '),headline:own.metadata && typeof own.metadata==='object' && 'h1' in own.metadata ? own.metadata.h1 : context.specialty,attested:true};
    const encoded=inputData(input),name=text(body.name,100)||`${own.platform}: ${context.specialty}`.slice(0,100);
    const kind=own.platform==='Fiverr'?'gig':['Upwork','LinkedIn'].includes(own.platform)?'profile':'service';
    return json(await saveInsight(env,user,project,name,kind,encoded,result),201);
  }
  if (method === 'GET' && path === '/auth/session') return json({ user: { id: user.id, name: user.name, email: user.email, emailVerified: false } });
  if (path === '/account/export' && method === 'GET') {
    sessionOnly(user);
    const projects = await all(env, 'SELECT * FROM projects WHERE user_id=?', user.id);
    const analyses = await all(env, 'SELECT a.* FROM analyses a JOIN projects p ON p.id=a.project_id WHERE p.user_id=?', user.id);
    const toolRuns = await all(env, 'SELECT id,tool_id,title,result_json,created_at FROM tool_runs WHERE user_id=?', user.id);
    const toolState = await all(env, 'SELECT tool_id,favorite,last_used_at FROM tool_state WHERE user_id=?', user.id);
    const experiments=(await all(env,'SELECT * FROM experiments WHERE user_id=?',user.id)).map(experimentOut);
    return json({ exportedAt: new Date().toISOString(), user: { id: user.id, name: user.name, email: user.email }, projects: projects.map(projectOut), analyses: analyses.map(analysisOut), toolRuns: toolRuns.map(analysisOut), toolState,experiments });
  }
  if (path === '/account' && method === 'DELETE') {
    sessionOnly(user); const body = await readJson(request);
    await rate(env, 'delete-account:' + user.id, 5);
    const stored = await first(env, 'SELECT password_hash FROM users WHERE id=?', user.id);
    if (body.confirm !== 'DELETE' || !await checkPassword(body.password, stored?.password_hash)) fail(400, 'confirmation_failed', 'Enter DELETE and your current password to remove the account.');
    await statement(env, 'DELETE FROM users WHERE id=?', user.id).run();
    return json({ ok: true }, 200, { 'Set-Cookie': cookie(request, '', 0) });
  }
  if (path === '/api-keys') {
    sessionOnly(user);
    if (method === 'GET') return json({ keys: await all(env, 'SELECT id,name,prefix,scope,expires_at,created_at FROM api_keys WHERE user_id=? AND expires_at>? ORDER BY created_at DESC', user.id, now()) });
    if (method === 'POST') {
      const body = await readJson(request), name = text(body.name, 80), scope = body.scope;
      if (!name || !['read','write'].includes(scope)) fail(400, 'invalid_key', 'Provide a key name and read or write scope.');
      const secret = token('eb_'), id = crypto.randomUUID(), expires = now() + 30 * 86400;
      const inserted = await first(env, `INSERT INTO api_keys(id,user_id,name,token_hash,prefix,scope,expires_at) SELECT ?,?,?,?,?,?,?
        WHERE (SELECT count(*) FROM api_keys WHERE user_id=? AND expires_at>?)<10 RETURNING id`, id,user.id,name,await digest(secret),secret.slice(0,11),scope,expires,user.id,now());
      if (!inserted) fail(409, 'quota', 'Revoke a key first. You can have ten active keys.');
      return json({ key: { id, name, scope, expires_at: expires }, secret }, 201);
    }
  }
  const keyMatch = path.match(/^\/api-keys\/([\w-]+)$/);
  if (keyMatch && method === 'DELETE') { sessionOnly(user); await statement(env, 'DELETE FROM api_keys WHERE id=? AND user_id=?', keyMatch[1], user.id).run(); return json({ ok: true }); }
  if (path === '/tool-state' && method === 'GET') return json({ state: await all(env, 'SELECT tool_id,favorite,last_used_at FROM tool_state WHERE user_id=?', user.id) });
  const stateMatch = path.match(/^\/tool-state\/([\w-]+)$/);
  if (stateMatch && method === 'PATCH') {
    if (!findTool(stateMatch[1])) fail(404,'not_found','Tool not found.');
    const body = await readJson(request);
    if ((body.favorite !== undefined && typeof body.favorite !== 'boolean') || (body.used !== undefined && body.used !== true) || (body.favorite === undefined && body.used !== true)) fail(400,'invalid_input','Provide a boolean favorite or used: true.');
    const favorite = body.favorite === undefined ? null : Number(body.favorite);
    await statement(env, `INSERT INTO tool_state(user_id,tool_id,favorite,last_used_at) VALUES(?,?,COALESCE(?,0),CASE WHEN ?=1 THEN strftime('%Y-%m-%dT%H:%M:%fZ','now') ELSE NULL END)
      ON CONFLICT(user_id,tool_id) DO UPDATE SET favorite=COALESCE(?,tool_state.favorite),last_used_at=COALESCE(excluded.last_used_at,tool_state.last_used_at)`, user.id,stateMatch[1],favorite,Number(body.used === true),favorite).run();
    return json({ ok:true });
  }
  if (path === '/tool-runs') {
    if (method === 'GET') return json({ runs: await all(env,'SELECT id,tool_id,title,created_at FROM tool_runs WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 100',user.id) });
    if (method === 'POST') {
      const body = await readJson(request);
      if (body.save !== undefined && typeof body.save !== 'boolean') fail(400,'invalid_input','save must be a boolean.');
      await rate(env,'tool-run:'+user.id,60,3600);
      const result = runTool(body.toolId,body.input);
      await statement(env, `INSERT INTO tool_state(user_id,tool_id,last_used_at) VALUES(?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(user_id,tool_id) DO UPDATE SET last_used_at=excluded.last_used_at`,user.id,result.toolId).run();
      if (body.save === true) {
        const saved = await first(env, `INSERT INTO tool_runs(id,user_id,tool_id,title,result_json) SELECT ?,?,?,?,? WHERE (SELECT count(*) FROM tool_runs WHERE user_id=?)<100 RETURNING id,created_at`,crypto.randomUUID(),user.id,result.toolId,result.toolName,JSON.stringify(result),user.id);
        if (!saved) fail(409,'quota','You can save 100 tool results. Export and remove an old result first.');
        return json({ result, saved },201);
      }
      return json({ result, saved:null });
    }
  }
  const runMatch = path.match(/^\/tool-runs\/([\w-]+)$/);
  if (runMatch && ['GET','DELETE'].includes(method)) {
    const row = await first(env,'SELECT id,tool_id,title,result_json,created_at FROM tool_runs WHERE id=? AND user_id=?',runMatch[1],user.id);
    if (!row) fail(404,'not_found','Tool result not found.');
    if (method === 'DELETE') { await statement(env,'DELETE FROM tool_runs WHERE id=? AND user_id=?',runMatch[1],user.id).run(); return json({ok:true}); }
    return json({ run:analysisOut(row!) });
  }
  if (method === 'GET' && ['/projects','/dashboard','/search'].includes(path)) {
    const query = text(url.searchParams.get('q'), 100);
    const projects = await all(env, `SELECT p.*, (SELECT score FROM analyses WHERE project_id=p.id ORDER BY created_at DESC,id DESC LIMIT 1) AS latest_score,
      (SELECT count(*) FROM analyses WHERE project_id=p.id) AS review_count FROM projects p WHERE user_id=? AND instr(lower(name),lower(?))>0 ORDER BY updated_at DESC`, user.id, query);
    const extra = path === '/search' ? { tools:toolCatalog.filter(t=>(t.name+' '+t.category+' '+t.subcategory+' '+t.summary).toLowerCase().includes(query.toLowerCase())), toolRuns:await all(env,'SELECT id,tool_id,title,created_at FROM tool_runs WHERE user_id=? AND instr(lower(title),lower(?))>0 ORDER BY created_at DESC LIMIT 100',user.id,query) } : {};
    return json({ projects: projects.map(projectOut), ...extra, counts: { projects: projects.length, reviews: projects.reduce((sum, p) => sum + Number(p.review_count), 0) } });
  }
  if (path === '/projects' && method === 'POST') {
    const body = await readJson(request), name = text(body.name, 100), kind = text(body.kind, 20);
    if (!name || !['profile','gig','service','competitor','website'].includes(kind)) fail(400, 'invalid_project', 'Provide a name and supported project kind.');
    const input = inputData(body.input || {}), id = crypto.randomUUID();
    const project = await first(env, `INSERT INTO projects(id,user_id,name,kind,input_json) SELECT ?,?,?,?,?
      WHERE (SELECT count(*) FROM projects WHERE user_id=?)<50 RETURNING *`, id,user.id,name,kind,input,user.id);
    if (!project) fail(409, 'quota', 'You can save up to 50 projects. Export or remove an old project first.');
    return json({ project: projectOut(project!) }, 201);
  }
  const match = path.match(/^\/projects\/([\w-]+)(\/analyses)?$/);
  if (match) {
    const project = await ownedProject(env, match[1], user);
    if (!match[2]) {
      if (method === 'GET') return json({ project: projectOut(project), analyses: (await all(env, 'SELECT * FROM analyses WHERE project_id=? ORDER BY created_at DESC,id DESC', project.id)).map(analysisOut) });
      if (method === 'PATCH') {
        const body = await readJson(request), name = body.name === undefined ? project.name : text(body.name, 100);
        if (!name) fail(400, 'name_required', 'Project name cannot be empty.');
        await statement(env, "UPDATE projects SET name=?,input_json=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND user_id=?", name, body.input === undefined ? project.input_json : inputData(body.input), project.id, user.id).run();
        return json({ project: projectOut(await ownedProject(env, project.id, user)) });
      }
      if (method === 'DELETE') { await statement(env, 'DELETE FROM projects WHERE id=? AND user_id=?', project.id,user.id).run(); return json({ ok: true }); }
    } else {
      if (method === 'GET') return json({ analyses: (await all(env, 'SELECT * FROM analyses WHERE project_id=? ORDER BY created_at DESC,id DESC', project.id)).map(analysisOut) });
      if (method === 'POST') {
        await rate(env, 'analysis:' + user.id, 60, 3600);
        const input = JSON.parse(project.input_json);
        let result: Row;
        if (project.kind === 'website') {
          if (input.attested !== true) fail(400, 'attestation_required', 'Confirm that you own or have permission to review this website.');
          result = await website(input.url, env);
        } else {
          result = auditProfile({ ...input, auditType: project.kind });
          if (project.kind === 'competitor') {
            if (!input.competitor || typeof input.competitor !== 'object') fail(400, 'competitor_required', 'Supply competitor content to compare.');
            const competitor = auditProfile(input.competitor);
            result.comparison = { ownScore: result.score, competitorScore: competitor.score, difference: result.score - competitor.score, criteria: result.criteria.map((c: Row, i: number) => ({ label: c.label, own: c.score, competitor: competitor.criteria[i].score, max: c.maxScore })), note: 'Both sides are user-supplied snapshots, not verified market rankings. Compare equivalent detail.' };
          }
        }
        return json({ analysis: await saveAnalysis(env, project, result) }, 201);
      }
    }
  }
  if (path === '/url/analyze' && method === 'POST') {
    await rate(env, 'url:' + user.id, 10, 3600);
    const body = await readJson(request);
    if (body.attested !== true) fail(400, 'attestation_required', 'Confirm website ownership or permission.');
    const result = await website(body.url, env);
    if (body.projectId) { const project = await ownedProject(env, body.projectId, user); return json({ analysis: await saveAnalysis(env, project, result) }, 201); }
    return json({ result });
  }
  fail(404, 'not_found', 'Endpoint not found.');
}

function headers(response: Response, request: Request, env: Env) {
  const result = new Response(response.body, response);
  result.headers.set('X-Content-Type-Options', 'nosniff');
  result.headers.set('Referrer-Policy', 'no-referrer');
  result.headers.set('X-Frame-Options', 'DENY');
  result.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  result.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'");
  if (request.url.startsWith('https:')) result.headers.set('Strict-Transport-Security', 'max-age=31536000');
  if (env.ENVIRONMENT !== 'production' || new URL(request.url).pathname.startsWith('/api/')) result.headers.set('X-Robots-Tag', 'noindex, nofollow');
  if (new URL(request.url).pathname.startsWith('/api/')) result.headers.set('Cache-Control', 'no-store');
  return result;
}
export default {
  async fetch(request, env, ctx) {
    let response: Response;
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) response = await api(request, env, ctx);
      else if (!['GET','HEAD'].includes(request.method)) response = new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
      else if (url.pathname === '/robots.txt') response = new Response(env.ENVIRONMENT === 'production' ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${env.PUBLIC_ORIGIN}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
      else if (url.pathname === '/sitemap.xml') response = new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${env.PUBLIC_ORIGIN}/</loc></url><url><loc>${env.PUBLIC_ORIGIN}/toolkit.html</loc></url><url><loc>${env.PUBLIC_ORIGIN}/experiments.html</loc></url><url><loc>${env.PUBLIC_ORIGIN}/linkedin.html</loc></url></urlset>`, { headers: { 'Content-Type': 'application/xml' } });
      else {
        const asset = assets[url.pathname === '/' ? '/index.html' : url.pathname];
        if (asset) {
          let body = asset.content;
          if (asset.type.startsWith('text/html')) body = body.replaceAll('https://elancebot.com', env.PUBLIC_ORIGIN);
          response = new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': asset.type, 'Cache-Control': asset.type.startsWith('text/html') ? 'no-cache' : 'public, max-age=300' } });
        } else response = new Response('Page not found', { status: 404 });
      }
    } catch (error) {
      const known = error instanceof HttpError;
      const requestId = crypto.randomUUID();
      if (!known) console.error(JSON.stringify({ event: 'request_failed', requestId, path: url.pathname, type: error instanceof Error ? error.name : 'unknown' }));
      response = json({ error: { code: known ? error.code : 'internal_error', message: known ? error.message : 'Something went wrong. Please retry.', requestId } }, known ? error.status : 500, known && error.status === 429 ? { 'Retry-After': '900' } : {});
    }
    return headers(response, request, env);
  }
} satisfies ExportedHandler<Env>;
