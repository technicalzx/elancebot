import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

test('real Worker + D1 lifecycle, ownership, scopes, recovery, CSRF and deletion', async () => {
  const mf = new Miniflare(convertV4MiniflareOptions({ name:'elancebot-test', modules:true, scriptPath:'dist/worker.js', compatibilityDate:'2026-10-13', compatibilityFlags:['nodejs_compat'], d1Databases:['DB'], bindings:{ENVIRONMENT:'preview',PUBLIC_ORIGIN:'https://local.test',URL_ALLOWED_HOSTS:'example.org,local.test'}, outboundService: async request => {
    const path = new URL(request.url).pathname;
    if(path === '/redirect') return new Response(null,{status:302,headers:{location:'https://127.0.0.1'}});
    if(path === '/large') return new Response('a'.repeat(512001),{headers:{'content-type':'text/html'}});
    if(path === '/json') return Response.json({});
    return new Response('<!doctype html><html lang="en"><head><title>Accessible website for creative studios</title><meta name="description" content="A sample description with sufficient context for a transparent metadata review of a creative studio website."><meta name="robots" content="none"><meta name="viewport" content="width=device-width"><link rel="canonical" href="https://example.org/"></head><body><h1>Creative studio</h1></body></html>',{headers:{'content-type':'text/html'}});
  } }));
  try {
    const db = await mf.getD1Database('DB');
    for(const sql of (await readFile('migrations/0001_initial.sql','utf8')).split(';').map(v=>v.trim()).filter(Boolean)) await db.prepare(sql).run();
    async function request(path, { method='GET', body, cookie='', key='', origin='https://local.test' } = {}) {
      const response = await mf.dispatchFetch('https://local.test' + path,{method,headers:{ ...(body === undefined ? {} : {'content-type':'application/json'}), ...(cookie ? {cookie} : {}), ...(key ? {authorization:'Bearer '+key} : {}), origin }, ...(body === undefined ? {} : {body:JSON.stringify(body)})});
      const result = await response.json().catch(()=>({})); return {response,result,status:response.status,cookie:response.headers.get('set-cookie')?.split(';')[0]};
    }
    const password = 'integration-only disposable passphrase';
    const a = await request('/api/v1/auth/register',{method:'POST',body:{name:'Alice',email:'alice@example.test',password}});
    assert.equal(a.status,200,JSON.stringify(a.result)); assert.match(a.response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict;.*Secure/); assert.ok(a.result.recoveryCode);
    const b = await request('/api/v1/auth/register',{method:'POST',body:{name:'Bob',email:'bob@example.test',password}}); assert.equal(b.status,200);
    const session = { cookie:a.cookie };
    assert.equal((await request('/api/v1/projects')).status,401);
    assert.equal((await request('/api/v1/projects',{...session,method:'POST',origin:'https://evil.test',body:{}})).status,403);
    const project = await request('/api/v1/projects',{...session,method:'POST',body:{name:'Test profile',kind:'profile',input:{headline:'I build accessible websites for small business owners',overview:'I help people build better sites. Contact me.',services:'design, development'}}});
    assert.equal(project.status,201,JSON.stringify(project.result)); const id = project.result.project.id;
    for(const method of ['GET','PATCH','DELETE']) assert.equal((await request('/api/v1/projects/'+id,{cookie:b.cookie,method, ...(method==='PATCH' ? {body:{name:'stolen'}} : {})})).status,404);
    assert.equal((await request('/api/v1/projects/'+id+'/analyses',{cookie:b.cookie,method:'POST'})).status,404);
    const analysis = await request('/api/v1/projects/'+id+'/analyses',{...session,method:'POST'}); assert.equal(analysis.status,201,JSON.stringify(analysis.result)); assert.ok(analysis.result.analysis.result.criteria.length);
    await request('/api/v1/projects/'+id,{...session,method:'PATCH',body:{input:{headline:'Improved headline',overview:'An improved description.'}}});
    assert.equal((await request('/api/v1/projects/'+id+'/analyses',{...session,method:'POST'})).status,201);
    const saved = await request('/api/v1/projects/'+id,session); assert.equal(saved.result.analyses.length,2);
    const createdKey = await request('/api/v1/api-keys',{...session,method:'POST',body:{name:'test read',scope:'read'}});
    assert.equal(createdKey.status,201); const key = createdKey.result.secret;
    assert.equal((await request('/api/v1/projects',{key})).status,200);
    assert.equal((await request('/api/v1/projects',{key,method:'POST',body:{}})).status,403);
    assert.equal((await request('/api/v1/api-keys',{key})).status,403);
    const writeKey = await request('/api/v1/api-keys',{...session,method:'POST',body:{name:'test write',scope:'write'}});
    assert.equal((await request('/api/v1/projects/'+id+'/analyses',{key:writeKey.result.secret,method:'POST'})).status,201);
    assert.equal((await request('/api/v1/url/analyze',{...session,method:'POST',body:{url:'https://127.0.0.1',attested:true}})).status,400);
    assert.equal((await request('/api/v1/url/analyze',{...session,method:'POST',body:{url:'https://unapproved.example',attested:true}})).status,403);
    const urlReview = await request('/api/v1/url/analyze',{...session,method:'POST',body:{url:'https://example.org/',attested:true}});
    assert.equal(urlReview.status,200,JSON.stringify(urlReview.result)); assert.equal(urlReview.result.result.metadata.h1,'Creative studio'); assert.equal(urlReview.result.result.retrieval,'https-fetch');
    assert.equal(urlReview.result.result.criteria.find(c=>c.id==='crawl-directives').score,0);
    for(const [path,status] of [['redirect',422],['large',413],['json',422]]) assert.equal((await request('/api/v1/url/analyze',{...session,method:'POST',body:{url:'https://example.org/'+path,attested:true}})).status,status);
    const selfReview = await request('/api/v1/url/analyze',{...session,method:'POST',body:{url:'https://local.test/',attested:true}}); assert.equal(selfReview.result.result.retrieval,'local-rendered-html');
    assert.equal((await request('/api/v1/api-keys/'+writeKey.result.key.id,{...session,method:'DELETE'})).status,200);
    assert.equal((await request('/api/v1/projects',{key:writeKey.result.secret})).status,401);
    const exported = await request('/api/v1/account/export',session); assert.equal(exported.status,200); assert.equal(exported.result.projects.length,1); assert.ok(!JSON.stringify(exported.result).includes('password_hash'));
    const recovery = await request('/api/v1/auth/recover',{method:'POST',body:{email:'alice@example.test',password:password+'new',recoveryCode:a.result.recoveryCode}});
    assert.equal(recovery.status,200,JSON.stringify(recovery.result)); assert.equal((await request('/api/v1/projects',session)).status,401); assert.equal((await request('/api/v1/projects',{key})).status,401);
    assert.equal((await request('/api/v1/auth/recover',{method:'POST',body:{email:'alice@example.test',password,recoveryCode:a.result.recoveryCode}})).status,401);
    assert.equal((await request('/api/v1/account',{method:'DELETE',cookie:recovery.cookie,body:{password:password+'new',confirm:'DELETE'}})).status,200);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM projects').first('n'),0);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM analyses').first('n'),0);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM api_keys').first('n'),0);
    assert.equal((await request('/api/v1/auth/session',{cookie:recovery.cookie})).status,401);
    const home = await mf.dispatchFetch('https://local.test/'); assert.equal(home.status,200); assert.match(home.headers.get('content-security-policy'),/frame-ancestors 'none'/); assert.equal(home.headers.get('x-robots-tag'),'noindex, nofollow');
    assert.equal(home.headers.get('cache-control'),'no-cache'); assert.match(await home.text(),/styles\.css\?v=[a-f0-9]{12}/);
    const missing = await mf.dispatchFetch('https://local.test/unknown'); assert.equal(missing.status,404);
    const open = await request('/api/v1/openapi'); assert.equal(open.result.openapi,'3.1.0'); assert.ok(open.result.paths['/projects/{id}']);
  } finally { await mf.dispose(); }
});
