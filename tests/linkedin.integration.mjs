import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
test('LinkedIn source boundary, private revisions, scopes, export and deletion',async()=>{
 let fetches=0;const mf=new Miniflare(convertV4MiniflareOptions({name:'linkedin-test',modules:true,scriptPath:'dist/worker.js',compatibilityDate:'2026-10-13',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{ENVIRONMENT:'preview',PUBLIC_ORIGIN:'https://local.test',URL_ALLOWED_HOSTS:''},outboundService:()=>{fetches++;return new Response('blocked',{status:403});}}));
 try{const db=await mf.getD1Database('DB');for(const name of (await readdir('migrations')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await readFile('migrations/'+name,'utf8')).split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
 async function req(path,method='GET',body,cookie='',key=''){const res=await mf.dispatchFetch('https://local.test/api/v1'+path,{method,headers:{origin:'https://local.test',...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{}),...(key?{authorization:'Bearer '+key}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
 const password='isolated linkedin test passphrase',a=await req('/auth/register','POST',{name:'A',email:'li-a@example.test',password}),b=await req('/auth/register','POST',{name:'B',email:'li-b@example.test',password});
 const input={url:'https://www.linkedin.com/in/synthetic-example',goal:'jobs',keywords:'Terraform',attested:true,sourceText:'Headline: Terraform engineer\nAbout: Infrastructure for small teams\nExperience: Delivered a synthetic demo.'};
 assert.equal((await req('/linkedin/analyze','POST',input)).status,401);
 assert.equal((await req('/linkedin/analyze','POST',{...input,attested:false},a.cookie)).status,400);
 const key=(await req('/api-keys','POST',{name:'read',scope:'read'},a.cookie)).data.secret;
 assert.equal((await req('/linkedin/analyze','POST',input,'',key)).status,403);
 assert.equal((await req('/linkedin/analyze','POST',{...input,sourceText:''},a.cookie)).status,422);assert.equal((await req('/projects','GET',undefined,a.cookie)).data.projects.length,0);
 const saved=await req('/linkedin/analyze','POST',input,a.cookie);assert.equal(saved.status,201,JSON.stringify(saved.data));const id=saved.data.project.id;
 assert.equal(saved.data.analysis.result.structuredProfile.fields.headline,'Terraform engineer');assert.equal(fetches,0);
 assert.equal((await req('/linkedin/analyze','POST',{...input,projectId:id},b.cookie)).status,404);
 assert.equal((await req('/projects/'+id,'GET',undefined,b.cookie)).status,404);
 assert.equal((await req('/linkedin/analyze','POST',{...input,projectId:id,goal:'clients'},a.cookie)).status,201);
 assert.equal((await req('/projects/'+id,'GET',undefined,a.cookie)).data.analyses.length,2);
 const exported=(await req('/account/export','GET',undefined,a.cookie)).data;assert.equal(exported.analyses.length,2);assert.equal(exported.projects[0].input.workflow,'linkedin');
 assert.equal((await req('/account','DELETE',{password,confirm:'DELETE'},a.cookie)).status,200);assert.equal(await db.prepare('SELECT count(*) AS n FROM analyses').first('n'),0);
 }finally{await mf.dispose();}
});
