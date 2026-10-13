// Creates only a disposable preview account; always deletes it in finally.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const origin = process.env.ELANCEBOT_TEST_ORIGIN;
if (!origin || !new URL(origin).hostname.startsWith('elancebot-preview.')) throw new Error('Set ELANCEBOT_TEST_ORIGIN to the named preview host, never production.');
const email = `qa-${randomUUID()}@example.test`, password = randomUUID() + randomUUID();
let cookie;
async function call(path, method='GET', body) {
  const response = await fetch(origin+'/api/v1'+path,{method,headers:{origin,...(cookie?{cookie}:{}),...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data = await response.json().catch(()=>({}));
  if(response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  assert.ok(response.ok, `${path}: ${response.status} ${JSON.stringify(data)}`); return data;
}
try {
  await call('/health');
  await call('/auth/register','POST',{email,password,name:'Disposable smoke test'});
  console.log('PASS live registration and secure session');
  await call('/auth/session');
  const {project} = await call('/projects','POST',{name:'Disposable service audit',kind:'competitor',input:{headline:'Accessible web development for growing independent businesses',overview:'I help teams build accessible websites. Contact me to discuss your next project.',services:'Website design, accessibility review',competitor:{headline:'Freelance designer',overview:'Website services'}}});
  const {analysis} = await call(`/projects/${project.id}/analyses`,'POST');
  assert.ok(analysis.result.comparison); console.log('PASS saved competitor audit');
  const checked = await call('/url/analyze','POST',{url:origin+'/',attested:true}); assert.ok(checked.result.metadata.title); console.log('PASS preview homepage metadata review');
  await call('/account/export'); console.log('PASS account export');
  await call('/auth/logout','POST');
  await call('/auth/login','POST',{email,password}); console.log('PASS live password login');
} finally {
  if(cookie) { await call('/account','DELETE',{password,confirm:'DELETE'}); console.log('PASS disposable account removed'); }
}
