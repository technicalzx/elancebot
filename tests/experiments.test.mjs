import test from 'node:test';
import assert from 'node:assert/strict';
import {experimentPlan,experimentObservations,experimentComparison} from '../src/lib/experiments.mjs';
const input={offer:'Cloud setup',evidence:'Scope is unclear',change:'List deliverables',metric:'inquiry-rate',periodDays:7,source:'My analytics'};
const baseline={start:'2026-01-01',end:'2026-01-07',outcomes:10,denominator:100,source:'My analytics'};
const followUp={...baseline,start:'2026-01-08',end:'2026-01-14',outcomes:15};
test('experiments preserve evidence and distinguish percentage points from relative change',()=>{
  const plan=experimentPlan(input),observations=experimentObservations({baseline,followUp},plan,'2026-02-01');
  const result=experimentComparison(observations);
  assert.equal(result.percentagePointChange,5);assert.equal(result.relativeChangePercent,50);
  assert.equal(observations.baseline.provenance,'user-supplied-unverified');
  assert.equal(experimentComparison({baseline:{...baseline,outcomes:0,denominator:0},followUp}).percentagePointChange,null);
  assert.equal(experimentComparison({baseline:{...baseline,outcomes:0},followUp}).relativeChangePercent,null);
});
test('invalid, incomplete, overlapping and future measurements are rejected',()=>{
  const plan=experimentPlan(input);
  for(const patch of [{outcomes:-1},{outcomes:101},{denominator:'100'},{outcomes:1.5},{end:'2026-01-08'},{start:'2026-02-30'},{source:''}])
    assert.throws(()=>experimentObservations({baseline:{...baseline,...patch}},plan,'2026-02-01'));
  assert.throws(()=>experimentObservations({baseline,followUp:{...followUp,start:'2026-01-07',end:'2026-01-13'}},plan));
  assert.throws(()=>experimentObservations({followUp},plan));
  assert.throws(()=>experimentObservations({baseline},plan,'2026-01-07'));
  for(const patch of [{metric:'rank'},{periodDays:0},{periodDays:7.5},{offer:' '},{source:'x'.repeat(301)}])assert.throws(()=>experimentPlan({...input,...patch}));
});
