import test from 'node:test';
import assert from 'node:assert/strict';
import {runTool,toolCatalog} from '../src/lib/toolkit.mjs';
const value=(r,label)=>r.values.find(v=>v.label===label)?.value;
const defaults=id=>Object.fromEntries(toolCatalog.find(t=>t.id===id).fields.map(f=>[f.key,f.value]));
test('job matching cites exact evidence without treating substrings as qualifications',()=>{
 const input={role:'Engineer',requirements:'Java\nC++\nDeployment',evidence:'JavaScript is used here. C++ was used in a demo. Deployment was not my responsibility.'};
 const r=runTool('job-evidence-fit',input);
 assert.equal(value(r,'Phrases found in supplied text'),2);
 assert.equal(value(r,'Phrases not found'),'Java');
 assert.ok(r.evidence.every(e=>input.evidence.includes(e.excerpt)));
 assert.match(r.explanations.join(' '),/negated/);
 assert.equal(r.provenance.aiGenerated,false);
 assert.throws(()=>runTool('job-evidence-fit',{...input,requirements:'Java\njava'}),/duplicate/);
 assert.throws(()=>runTool('job-evidence-fit',{...input,requirements:'[.*]'}),/nonempty/);
});
test('Unicode and regular-expression metacharacters are matched literally',()=>{
 const r=runTool('job-evidence-fit',{role:'Déploiement',requirements:'C++\nآزمایش\nnode.js',evidence:'C++ and آزمایش are quoted. nodeXjs is not node.js.'});
 assert.equal(r.evidence.length,3);assert.equal(r.evidence[2].match,'node.js');
});
test('resume check reports section recognition and avoids ATS claims',()=>{
 const r=runTool('resume-evidence-review',defaults('resume-evidence-review'));
 assert.equal(value(r,'Recognized English section labels'),'Summary, Experience, Skills, Education');
 assert.match(r.limitations.join(' '),/does not.*ATS/);
 const noMatch=runTool('resume-evidence-review',{requirements:'Kubernetes',evidence:'Unrelated source.'});
 assert.equal(value(noMatch,'Phrases found in supplied text'),0);
 assert.equal(value(noMatch,'Phrases not found'),'Kubernetes');
});
test('package checker identifies disappearing scope and unexplained tier pricing',()=>{
 const p={name:'Base',price:100,currency:'USD',deliveryDays:3,revisions:1,deliverables:['Deployment']};
 const r=runTool('fiverr-package-review',{offer:'Hosting',buyerRequirements:'Authorized access',packages:JSON.stringify([p,{...p,name:'Plus',price:200}])});
 assert.match(value(r,'Consistency observations'),/higher price/);
 const removed=runTool('fiverr-package-review',{offer:'Hosting',buyerRequirements:'Authorized access',packages:JSON.stringify([p,{...p,name:'Plus',price:200,deliverables:['Documentation']}])});
 assert.match(value(removed,'Consistency observations'),/not explicitly included.*Deployment/);
 for(const invalid of [{...p,price:0},{...p,price:1.001},{...p,currency:'usd'},{...p,deliveryDays:0},{...p,revisions:-1},{...p,deliverables:['a','A']},{...p,script:'x'}]) assert.throws(()=>runTool('fiverr-package-review',{...defaults('fiverr-package-review'),packages:JSON.stringify([invalid])}));
 assert.throws(()=>runTool('fiverr-package-review',{...defaults('fiverr-package-review'),packages:JSON.stringify([p,{...p,name:'Other',currency:'EUR'}])}),/currency/);
});
test('client and content outlines preserve supplied facts and explicit placeholders',()=>{
 const client=runTool('client-brief-planner',defaults('client-brief-planner'));
 assert.match(value(client,'Proposal and scope outline — template'),/acceptance criterion and owner/);
 assert.match(value(client,'Discovery checklist'),/Who approves/);
 const input=defaults('content-outline');
 for(const format of ['post','article','email','case-study']) {
  const r=runTool('content-outline',{...input,format});
  assert.equal(value(r,'Source facts to review'),input.evidence);
  assert.match(value(r,'Outline — template'),/write and review/);
 }
 assert.throws(()=>runTool('content-outline',{...input,tone:'invent achievements'}));
 assert.throws(()=>runTool('client-brief-planner',{...defaults('client-brief-planner'),deliverables:'x'.repeat(161)}));
});
