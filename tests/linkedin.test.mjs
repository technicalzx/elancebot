import test from 'node:test';
import assert from 'node:assert/strict';
import {linkedinInput,analyzeLinkedin} from '../src/lib/linkedin.mjs';
const base={url:'https://www.linkedin.com/in/example',goal:'clients',keywords:'Terraform,writing',sourceText:'Headline: Terraform specialist\nAbout: I help teams. Contact me.\nExperience: Delivered a deployment.\nSkills: Terraform'};
test('LinkedIn mapping preserves section evidence, missingness and goal-specific guidance',()=>{
  const input=linkedinInput(base),result=analyzeLinkedin(input);assert.equal(result.structuredProfile.fields.headline,'Terraform specialist');assert.equal(result.structuredProfile.provenance.verified,false);assert.equal(result.dataProvenance.liveData,false);assert.deepEqual(result.structuredProfile.missingSections,['featured','education']);assert.equal(result.score,67);assert.deepEqual(result.keywords[0].sections,['headline','skills']);assert.deepEqual(result.keywords[1].sections,[]);
  assert.equal(analyzeLinkedin(linkedinInput({...base,goal:'jobs'})).recommendations[0].id,'experience');
  assert.equal(linkedinInput({...base,sourceText:JSON.stringify({headline:'<b>literal</b>',about:'About'})}).profile.headline,'<b>literal</b>');
  assert.deepEqual(linkedinInput({...base,sourceText:JSON.stringify(result.structuredProfile)}).profile,input.profile);
});
test('LinkedIn rejects URL bypasses, invented extraction, unknown JSON and ambiguous text',()=>{
  for(const url of ['http://www.linkedin.com/in/test','https://linkedin.com.evil.test/in/test','https://www.linkedin.com/company/test','https://www.linkedin.com/in/test?x=1','https://u:p@linkedin.com/in/test'])assert.throws(()=>linkedinInput({...base,url}));
  assert.throws(()=>linkedinInput({...base,sourceText:''}),e=>e.code==='linkedin_connection_required'&&e.status===422);
  for(const sourceText of ['Random profile text','{}','{"cookies":"secret"}','{bad}', 'Headline: '+ 'x'.repeat(501)])assert.throws(()=>linkedinInput({...base,sourceText}));
});
