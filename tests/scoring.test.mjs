import test from 'node:test';
import assert from 'node:assert/strict';
import { auditProfile, auditUrlMetadata } from '../src/lib/scoring.mjs';
test('profile scoring is deterministic, bounded, transparent and not live ranking data', () => {
  for (const input of [null, [], {}, { headline:'I build accessible websites for independent small businesses', overview:'I help clients build thoughtful websites. Contact me to discuss a project.', services:'design,development', skills:['HTML','CSS','accessibility'], keywords:'websites, accessibility', portfolio:'Delivered 12 projects' }]) {
    const result = auditProfile(input);
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.equal(result.criteria.reduce((s,c) => s+c.score,0),result.score);
    assert.deepEqual(result,auditProfile(input)); assert.equal(result.dataProvenance.liveData,false);
  }
});
test('empty profile offers actionable recommendations', () => { const r = auditProfile({}); assert.equal(r.score,0); assert.ok(r.recommendations.length >= 5); });
test('missing robots directive means no detected noindex, not a penalty', () => {
  const a = auditUrlMetadata({}), b = auditUrlMetadata({robots:'index, follow'}), c = auditUrlMetadata({robots:'noindex, follow'});
  assert.equal(a.score,b.score); assert.equal(a.score-c.score,20);
});
test('word count includes content beyond 4000 characters', () => { assert.equal(auditProfile({overview:'word '.repeat(1300)}).inputSummary.overviewWords,1300); });
