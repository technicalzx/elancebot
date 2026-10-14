import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
const ownText='I build cloud infrastructure for independent creative studios. I provide a Terraform deployment package, documentation and a sample project. Contact me to discuss scope and delivery requirements.';
test('URL insights fetch authorized content, preserve provenance and isolate saved revisions',async()=>{
  let fetches=0;
  const mf=new Miniflare(convertV4MiniflareOptions({name:'insights-test',modules:true,scriptPath:'dist/worker.js',compatibilityDate:'2026-10-13',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{ENVIRONMENT:'preview',PUBLIC_ORIGIN:'https://local.test',URL_ALLOWED_HOSTS:'example.org'},outboundService:()=>{fetches++;return new Response('<!doctype html><html><head><title>Cloud infrastructure</title><script>SECRET_SCRIPT_MARKER</script></head><body><nav>NOISE_NAV_MARKER</nav><h1>Cloud infrastructure</h1><p>'+ownText+'</p><p hidden>HIDDEN_MARKER</p><style>STYLE_MARKER</style><script>BODY_SCRIPT_MARKER</script></body></html>',{headers:{'content-type':'text/html'}});}}));
  try {
    const db=await mf.getD1Database('DB');
    for(const name of (await readdir('migrations')).filter(n=>n.endsWith('.sql')).sort()) for(const sql of (await readFile('migrations/'+name,'utf8')).split(';').map(s=>s.trim()).filter(Boolean)) await db.prepare(sql).run();
    async function req(path,method='GET',body,cookie='',key='') { const res=await mf.dispatchFetch('https://local.test/api/v1'+path,{method,headers:{origin:'https://local.test',...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{}),...(key?{authorization:'Bearer '+key}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]}; }
    const password='isolated URL workflow passphrase';
    const a=await req('/auth/register','POST',{name:'URL QA',email:'url-a@example.test',password});const b=await req('/auth/register','POST',{name:'Other QA',email:'url-b@example.test',password});
    const input={url:'https://example.org/service',specialty:'Cloud infrastructure',keywords:'Terraform,Kubernetes',attested:true};
    assert.equal((await req('/insights','POST',input)).status,401);
    const key=await req('/api-keys','POST',{name:'read',scope:'read'},a.cookie);
    assert.equal((await req('/insights','POST',input,'',key.data.secret)).status,403);
    assert.equal((await req('/insights','POST',{...input,attested:false},a.cookie)).status,400);
    assert.equal((await req('/insights','POST',{...input,useAi:true,aiConsent:true},a.cookie)).status,503);
    const first=await req('/insights','POST',input,a.cookie);assert.equal(first.status,201,JSON.stringify(first.data));
    const r=first.data.analysis.result,id=first.data.project.id;
    assert.equal(r.sources[0].retrieval,'https-fetch');assert.ok(r.sources[0].text.includes(ownText));assert.doesNotMatch(r.sources[0].text,/MARKER/);assert.equal(fetches,1);
    assert.equal((await req('/projects/'+id,'GET',undefined,b.cookie)).status,404);
    assert.equal((await req('/insights','POST',{...input,projectId:id},b.cookie)).status,404);assert.equal(fetches,1);
    const before=fetches;
    const platform=await req('/insights','POST',{...input,url:'https://www.upwork.com/freelancers/sample'},a.cookie);assert.equal(platform.status,422);assert.equal(platform.data.error.code,'platform_connection_required');assert.equal(fetches,before);
    const revision=await req('/insights','POST',{...input,projectId:id,url:'https://www.fiverr.com/sample',sourceText:ownText+' Kubernetes scope is available.',competitorUrl:'https://www.fiverr.com/other',competitorText:ownText},a.cookie);
    assert.equal(revision.status,201);assert.equal(revision.data.analysis.result.sources.length,2);assert.equal(revision.data.analysis.result.sources[0].retrieval,'user-supplied-snapshot');assert.equal(fetches,before);
    assert.equal((await req('/projects/'+id,'GET',undefined,a.cookie)).data.analyses.length,2);
    assert.equal((await req('/insights','POST',{...input,url:'https://127.0.0.1'},a.cookie)).status,400);
    assert.equal((await req('/insights','POST',{...input,url:'https://unapproved.example.org'},a.cookie)).status,403);
    assert.equal((await req('/insights','POST',{...input,sourceText:'short'},a.cookie)).status,400);
    const exported=await req('/account/export','GET',undefined,a.cookie);assert.equal(exported.data.analyses.length,2);assert.ok(exported.data.analyses[0].result.sources.length);
    const savedInput=await db.prepare('SELECT input_json FROM projects WHERE id=?').bind(id).first('input_json');
    for(let i=0;i<48;i++) await db.prepare('INSERT INTO analyses(id,project_id,result_json,score) VALUES(?,?,?,?)').bind('quota-'+i,id,'{}',0).run();
    const quota=await req('/insights','POST',{...input,projectId:id,name:'Do not overwrite',sourceText:ownText},a.cookie);
    assert.equal(quota.status,409);assert.equal(fetches,before);
    assert.equal(await db.prepare('SELECT input_json FROM projects WHERE id=?').bind(id).first('input_json'),savedInput);
    const rateLimited=await req('/insights','POST',{...input,sourceText:ownText},a.cookie);
    // Failed source requests count toward the bounded hourly processing budget.
    assert.equal(rateLimited.status,201);
    for(let i=0;i<4;i++) await req('/insights','POST',{...input,sourceText:'short'},a.cookie);
    assert.equal((await req('/insights','POST',{...input,sourceText:ownText},a.cookie)).status,429);
    assert.equal((await req('/account','DELETE',{password,confirm:'DELETE'},a.cookie)).status,200);assert.equal(await db.prepare('SELECT count(*) AS n FROM analyses').first('n'),0);
  } finally {await mf.dispose();}
});
