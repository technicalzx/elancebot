import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {professionalTools} from '../src/lib/professional.mjs';
test('professional workflows execute, persist exact evidence, isolate owners and cascade deletion',async()=>{
 let outbound=0;
 const mf=new Miniflare(convertV4MiniflareOptions({name:'professional-test',modules:true,scriptPath:'dist/worker.js',compatibilityDate:'2026-10-13',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{ENVIRONMENT:'preview',PUBLIC_ORIGIN:'https://local.test',URL_ALLOWED_HOSTS:''},outboundService:()=>{outbound++;return new Response('unexpected',{status:500});}}));
 try {
  const db=await mf.getD1Database('DB');
  for(const name of (await readdir('migrations')).filter(n=>n.endsWith('.sql')).sort()) for(const sql of (await readFile('migrations/'+name,'utf8')).split(';').map(x=>x.trim()).filter(Boolean))await db.prepare(sql).run();
  async function req(path,method='GET',body,cookie='') {
   const r=await mf.dispatchFetch('https://local.test/api/v1'+path,{method,headers:{origin:'https://local.test',cookie,...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
  }
  const password='professional isolated integration passphrase';
  const a=await req('/auth/register','POST',{name:'A',email:'workflow-a@example.test',password});
  const b=await req('/auth/register','POST',{name:'B',email:'workflow-b@example.test',password});
  assert.equal(a.status,200);assert.equal(b.status,200);
  const ids=[];
  for(const tool of professionalTools) {
   const input=Object.fromEntries(tool.fields.map(f=>[f.key,f.value]));
   const saved=await req('/tool-runs','POST',{toolId:tool.id,input,save:true},a.cookie);
   assert.equal(saved.status,201,JSON.stringify(saved.data));ids.push(saved.data.saved.id);
   const reopened=await req('/tool-runs/'+saved.data.saved.id,'GET',undefined,a.cookie);
   assert.equal(reopened.status,200);assert.deepEqual(reopened.data.run.result,saved.data.result);
   assert.equal((await req('/tool-runs/'+saved.data.saved.id,'GET',undefined,b.cookie)).status,404);
   assert.equal((await req('/tool-runs/'+saved.data.saved.id,'DELETE',undefined,b.cookie)).status,404);
  }
  const bad=await req('/tool-runs','POST',{toolId:'job-evidence-fit',input:{role:'Demo',requirements:'same\nSAME',evidence:'same'},save:true},a.cookie);
  assert.equal(bad.status,400);
  assert.equal((await req('/account/export','GET',undefined,a.cookie)).data.toolRuns.length,5);
  assert.equal((await req('/account/export','GET',undefined,b.cookie)).data.toolRuns.length,0);
  const history=(await req('/tool-runs','GET',undefined,a.cookie)).data.runs;
  assert.equal(history.length,5);assert.equal(outbound,0);
  assert.equal((await req('/account','DELETE',{confirm:'DELETE',password},a.cookie)).status,200);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM tool_runs').first('n'),0);
 } finally {await mf.dispose();}
});
