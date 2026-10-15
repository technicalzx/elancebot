import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
test('private experiment lifecycle, conflict detection, scopes, quotas and cascades',async()=>{
  const mf=new Miniflare(convertV4MiniflareOptions({name:'experiments-test',modules:true,scriptPath:'dist/worker.js',compatibilityDate:'2026-10-13',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{ENVIRONMENT:'preview',PUBLIC_ORIGIN:'https://local.test',URL_ALLOWED_HOSTS:''}}));
  try {
    const db=await mf.getD1Database('DB');
    for(const name of (await readdir('migrations')).filter(n=>n.endsWith('.sql')).sort())for(const sql of (await readFile('migrations/'+name,'utf8')).split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
    async function req(path,method='GET',body,cookie='',key='') {
      const res=await mf.dispatchFetch('https://local.test/api/v1'+path,{method,headers:{origin:'https://local.test',...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{}),...(key?{authorization:'Bearer '+key}:{})},...(body?{body:JSON.stringify(body)}:{})});
      return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
    }
    const password='isolated experiment test passphrase';
    const a=await req('/auth/register','POST',{name:'A',email:'experiment-a@example.test',password}),b=await req('/auth/register','POST',{name:'B',email:'experiment-b@example.test',password});
    const plan={offer:'<img src=x> synthetic offer',evidence:'Unclear scope',change:'List deliverables',metric:'inquiry-rate',periodDays:7,source:'Synthetic export'};
    assert.equal((await req('/experiments')).status,401);
    const project=(await req('/projects','POST',{name:'Experiment project',kind:'service',input:{}},a.cookie)).data.project;
    assert.equal((await req('/experiments','POST',{...plan,projectId:project.id},b.cookie)).status,404);
    const created=await req('/experiments','POST',{...plan,projectId:project.id},a.cookie);assert.equal(created.status,201,JSON.stringify(created.data));
    const id=created.data.experiment.id,path='/experiments/'+id;
    for(const method of ['GET','PATCH','DELETE'])assert.equal((await req(path,method,method==='PATCH'?{}:undefined,b.cookie)).status,404);
    assert.equal((await req('/experiments','GET',undefined,b.cookie)).data.experiments.length,0);
    const key=(await req('/api-keys','POST',{name:'read',scope:'read'},a.cookie)).data.secret;
    assert.equal((await req(path,'GET',undefined,'',key)).status,200);
    assert.equal((await req(path,'PATCH',{},'',key)).status,403);
    assert.equal((await req(path,'DELETE',undefined,'',key)).status,403);
    const baseline={start:'2026-01-01',end:'2026-01-07',outcomes:10,denominator:100,source:'Synthetic export'};
    const body={version:1,baseline,followUp:{...baseline,start:'2026-01-08',end:'2026-01-14',outcomes:15}};
    assert.equal((await req(path,'PATCH',{version:1,baseline},a.cookie)).status,400);
    const updated=await req(path,'PATCH',body,a.cookie);assert.equal(updated.status,200);assert.equal(updated.data.experiment.comparison.percentagePointChange,5);
    assert.equal((await req(path,'PATCH',body,a.cookie)).status,409);
    assert.equal((await req(path,'GET',undefined,a.cookie)).data.experiment.version,2);
    assert.equal((await req('/account/export','GET',undefined,a.cookie)).data.experiments[0].plan.offer,plan.offer);
    assert.equal((await req('/projects/'+project.id,'DELETE',undefined,a.cookie)).status,200);
    assert.equal((await req(path,'GET',undefined,a.cookie)).status,404);
    const standalone=await req('/experiments','POST',plan,a.cookie);assert.equal(standalone.status,201);
    assert.equal((await req('/experiments/'+standalone.data.experiment.id,'DELETE',undefined,a.cookie)).status,200);
    for(let i=0;i<50;i++)await db.prepare('INSERT INTO experiments(id,user_id,plan_json) VALUES(?,?,?)').bind('quota-'+i,a.data.user.id,JSON.stringify(plan)).run();
    assert.equal((await req('/experiments','POST',plan,a.cookie)).status,409);
    assert.equal((await req('/account','DELETE',{password,confirm:'DELETE'},a.cookie)).status,200);
    assert.equal(await db.prepare('SELECT count(*) AS n FROM experiments').first('n'),0);
  } finally {await mf.dispose();}
});
