// Creates only a disposable preview account; always deletes it in finally.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const origin = process.env.ELANCEBOT_TEST_ORIGIN;
if (!origin || !new URL(origin).hostname.startsWith('elancebot-preview.')) throw new Error('Set ELANCEBOT_TEST_ORIGIN to the named preview host, never production.');
const email = `qa-${randomUUID()}@example.test`, password = randomUUID() + randomUUID();
let cookie;
async function call(path, method='GET', body, expectedStatus) {
  const response = await fetch(origin+'/api/v1'+path,{method,headers:{origin,...(cookie?{cookie}:{}),...(body===undefined?{}:{'content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data = await response.json().catch(()=>({}));
  if(response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
  if(expectedStatus) assert.equal(response.status,expectedStatus,`${path}: ${JSON.stringify(data)}`);
  else assert.ok(response.ok, `${path}: ${response.status} ${JSON.stringify(data)}`); return data;
}
try {
  assert.equal((await call('/health')).version,'0.5.0');
  assert.equal((await call('/tools')).catalog.length,12);
  await call('/auth/register','POST',{email,password,name:'Disposable smoke test'});
  console.log('PASS live registration and secure session');
  await call('/auth/session');
  const {project} = await call('/projects','POST',{name:'Disposable service audit',kind:'competitor',input:{headline:'Accessible web development for growing independent businesses',overview:'I help teams build accessible websites. Contact me to discuss your next project.',services:'Website design, accessibility review',competitor:{headline:'Freelance designer',overview:'Website services'}}});
  const {analysis} = await call(`/projects/${project.id}/analyses`,'POST');
  assert.ok(analysis.result.comparison); console.log('PASS saved competitor audit');
  const checked = await call('/url/analyze','POST',{url:origin+'/',attested:true}); assert.ok(checked.result.metadata.title); console.log('PASS preview homepage metadata review');
  const insights=await call('/insights','POST',{url:origin+'/',specialty:'Freelance offer reviews',keywords:'profile,service',attested:true});
  assert.equal(insights.analysis.result.analysisType,'url-insights');
  assert.equal(insights.analysis.result.sources[0].retrieval,'local-rendered-html');
  assert.ok(insights.analysis.result.sources[0].text.length>=100);
  assert.equal((await call('/projects/'+insights.project.id)).analyses.length,1);
  const unavailable=await call('/insights','POST',{url:'https://www.upwork.com/freelancers/example',specialty:'Freelance services',attested:true},422);
  assert.equal(unavailable.error.code,'platform_connection_required');
  console.log('PASS URL evidence review, saved reopen and honest unavailable-connector response');
  const liInput={url:'https://www.linkedin.com/in/synthetic-smoke',goal:'clients',attested:true,keywords:'Terraform',sourceText:'Headline: Terraform infrastructure specialist\nAbout: I help teams deploy infrastructure.\nExperience: Delivered a synthetic demo.'};
  const li=await call('/linkedin/analyze','POST',liInput);
  assert.equal(li.analysis.result.structuredProfile.fields.headline,'Terraform infrastructure specialist');
  assert.equal((await call('/projects/'+li.project.id)).analyses.length,1);
  await call('/linkedin/analyze','POST',{...liInput,sourceText:''},422);
  console.log('PASS dedicated LinkedIn JSON mapping, saved review and URL-only boundary');
  const calculated = await call('/tool-runs','POST',{toolId:'percentage',input:{part:45,whole:60},save:true});
  assert.equal(calculated.result.values[0].value,75);
  await call('/tool-state/percentage','PATCH',{favorite:true});
  assert.ok((await call('/tool-state')).state.some(row=>row.tool_id==='percentage' && row.favorite===1 && row.last_used_at));
  assert.equal((await call(`/tool-runs/${calculated.saved.id}`)).run.result.values[0].value,75);
  assert.equal((await call('/search?q=percentage')).toolRuns.length,1);
  console.log('PASS live calculator, favorites, recent tools, saved history and search');
  const experiment=await call('/experiments','POST',{offer:'Synthetic outcome test',evidence:'Missing scope',change:'Add deliverables',metric:'inquiry-rate',periodDays:7,source:'Synthetic export',projectId:project.id});
  const baseline={start:'2026-01-01',end:'2026-01-07',outcomes:10,denominator:100,source:'Synthetic export'};
  const observation={version:1,baseline,followUp:{...baseline,start:'2026-01-08',end:'2026-01-14',outcomes:15}};
  const observed=await call('/experiments/'+experiment.experiment.id,'PATCH',observation);
  assert.equal(observed.experiment.comparison.percentagePointChange,5);
  await call('/experiments/'+experiment.experiment.id,'PATCH',observation,409);
  assert.equal((await call('/experiments/'+experiment.experiment.id)).experiment.version,2);
  console.log('PASS live experiment save, outcome comparison, reopen and stale-write rejection');
  const exported = await call('/account/export');
  assert.equal(exported.toolRuns.length,1); assert.equal(exported.toolState.length,1);
  assert.equal(exported.experiments.length,1);
  console.log('PASS account export includes tool data');
  await call('/auth/logout','POST');
  await call('/auth/login','POST',{email,password}); console.log('PASS live password login');
} finally {
  if(cookie) { await call('/account','DELETE',{password,confirm:'DELETE'}); console.log('PASS disposable account removed'); }
}
