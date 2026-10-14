import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeOffer,insightContext,referenceUrl,sourcePlatform,sourceText,validateImprovements} from '../src/lib/insights.mjs';
import {generateImprovements,IMPROVEMENT_MODEL} from '../src/lib/improvements.ts';
const own={role:'own',url:'https://www.fiverr.com/sample-seller',platform:'Fiverr',text:'I build cloud infrastructure for creative businesses. My Terraform sample project shows the deployment process. Message me to discuss the scope.',retrieval:'user-supplied-snapshot',capturedAt:'2026-10-14T00:00:00Z'};
const competitor={...own,role:'competitor',url:'https://www.fiverr.com/sample-competitor',text:'I design Kubernetes infrastructure and Terraform packages. My portfolio includes a case study. Request a quote for a documented delivery process.'};
test('source URLs identify real host suffixes and reject unsafe references',()=>{
  assert.equal(sourcePlatform(own.url),'Fiverr');assert.equal(sourcePlatform('https://www.upwork.com/freelancers/sample'),'Upwork');assert.equal(sourcePlatform('https://www.linkedin.com/in/sample'),'LinkedIn');
  assert.equal(sourcePlatform('https://fiverr.com.example.org/seller'),'Website');
  for(const u of ['javascript:alert(1)','http://example.org','https://user:pass@example.org','https://127.0.0.1','https://x.internal','https://example.org?a=1','https://example.org/#x']) assert.throws(()=>referenceUrl(u));
  assert.throws(()=>sourceText('Too short'));assert.throws(()=>sourceText('x'.repeat(8001)));assert.equal(sourceText(own.text),own.text);
});
test('offer insights use exact evidence and distinguish phrase gaps from rankings',()=>{
  const context=insightContext({specialty:'Cloud infrastructure',audience:'Creative studios',keywords:'Terraform, Kubernetes, form'});
  const r=analyzeOffer(own,competitor,context);
  assert.deepEqual(r.keywordGaps,['Kubernetes']);assert.equal(r.keywords[2].ownCount,0);assert.equal(r.keywords[0].ownCount,1);
  assert.ok(r.observations.filter(o=>o.evidence).every(o=>own.text.includes(o.evidence)));
  assert.equal(r.observations.find(o=>o.id==='commercial').observed,false);assert.equal(r.ai,null);assert.match(r.scoreLabel,/not a ranking/);
  assert.deepEqual(r,analyzeOffer(own,competitor,context));assert.equal(analyzeOffer(own,undefined,context).sources.length,1);
  assert.throws(()=>insightContext({specialty:'Cloud',keywords:Array.from({length:11},(_,i)=>'k'+i).join(',')}));
  const packageOnly=analyzeOffer({...own,text:'The package includes a sample. Send your brief and requirements.'},undefined,context);
  assert.equal(packageOnly.observations.find(o=>o.id==='commercial').observed,false);
  assert.equal(packageOnly.observations.find(o=>o.id==='process').observed,false);
  assert.equal(analyzeOffer({...own,text:'The package includes a sample. Packages start at USD 500.'},undefined,context).observations.find(o=>o.id==='commercial').evidence,'Packages start at USD 500.');
});
test('AI output is rejected for invented citations, absent competitor or invalid shapes',()=>{
  const good={headline:'Cloud infrastructure',description:'I build cloud infrastructure for creative businesses.',recommendations:[{source:'own',quote:'I build cloud infrastructure',action:'Lead with the specific deliverable and audience.'}]};
  assert.equal(validateImprovements(JSON.stringify(good),own,competitor).headline,good.headline);
  assert.throws(()=>validateImprovements({...good,recommendations:[{...good.recommendations[0],quote:'I earned millions'}]},own,competitor));
  assert.throws(()=>validateImprovements({...good,recommendations:[{source:'competitor',quote:competitor.text,action:'Compare this'}]},own));
  for(const value of ['not json',{},null,{...good,recommendations:[null]},{...good,description:'x'.repeat(3001)}]) assert.throws(()=>validateImprovements(value,own,competitor));
});
test('AI adapter is bounded, separates instructions/data and has no execution tools',async()=>{
  let captured;
  const ai={async run(model,input,options) {captured={model,input,options};return {response:{headline:'Cloud infrastructure',description:own.text,recommendations:[{source:'own',quote:'I build cloud infrastructure',action:'Describe the concrete delivery scope.'}]}};}};
  const result=await generateImprovements(ai,own,competitor,{specialty:'Cloud',audience:'Studios',keywords:['Terraform']});
  assert.equal(result.model,IMPROVEMENT_MODEL);assert.equal(captured.input.max_tokens,1400);assert.ok(captured.options.signal instanceof AbortSignal);assert.equal(captured.input.tools,undefined);
  assert.match(captured.input.messages[0].content,/untrusted DATA/);assert.equal(JSON.parse(captured.input.messages[1].content).own.text,own.text);
  await assert.rejects(generateImprovements({run:async()=>({response:'invalid'})},own,undefined,{}));
});
