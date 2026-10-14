import test from 'node:test';
import assert from 'node:assert/strict';
import { runTool, toolCatalog } from '../src/lib/toolkit.mjs';
const value=(r,label)=>r.values.find(v=>v.label===label).value;
const defaults=id=>Object.fromEntries(toolCatalog.find(t=>t.id===id).fields.map(f=>[f.key,f.value]));
test('catalog contains unique working tools with executable, deterministic defaults',()=>{
  assert.equal(new Set(toolCatalog.map(t=>t.id)).size,toolCatalog.length);
  for(const t of toolCatalog.filter(t=>t.mode!=='review')) { const input={...defaults(t.id),...(t.id==='text-tools'?{text:'A useful draft.'}:{})}; const r=runTool(t.id,input); assert.deepEqual(r,runTool(t.id,input)); assert.ok(r.values.length && r.explanations.length && r.recommendations.length); assert.equal(r.provenance.aiGenerated,false); }
});
test('pricing gross-up preserves the desired net amount without inventing fees',()=>{
  const r=runTool('freelance-pricing',{annualIncome:40000,annualCosts:10000,hoursPerWeek:25,weeksPerYear:40,projectHours:10,projectCosts:100,feePercent:20});
  assert.equal(value(r,'Annual billable hours'),1000); assert.equal(value(r,'Hourly target before per-project fees'),50);assert.equal(value(r,'Gross project quote'),750);
  assert.throws(()=>runTool('freelance-pricing',{...defaults('freelance-pricing'),feePercent:100}),/fee/);
});
test('margin differs from markup; zero denominators and losses are explicit',()=>{
  const r=runTool('profit-margin',{revenue:1000,cost:600});assert.equal(value(r,'Profit'),400);assert.equal(value(r,'Margin'),40);assert.equal(value(r,'Markup'),66.67);
  assert.match(value(runTool('profit-margin',{revenue:0,cost:0}),'Margin'),/Undefined/);assert.equal(value(runTool('profit-margin',{revenue:80,cost:100}),'Margin'),-25);
});
test('salary equivalents use the user-defined paid schedule',()=>{
  const r=runTool('salary-converter',{amount:25,period:'hour',hoursPerWeek:40,weeksPerYear:52});assert.equal(value(r,'Annual gross pay'),52000);assert.equal(value(r,'Average monthly gross pay'),4333.33);
  assert.equal(value(runTool('salary-converter',{amount:52000,period:'year',hoursPerWeek:40,weeksPerYear:52}),'Gross hourly equivalent'),25);
});
test('percentages and weighted GPA have known answers and invalid inputs are rejected',()=>{
  assert.equal(value(runTool('percentage',{part:18,whole:24}),'Percentage'),75);
  // (3*4 + 4*3) / 7 = 24/7, rounded to three places.
  assert.equal(value(runTool('weighted-gpa',{scale:4,courses:'3,4\n4,3'}),'Weighted GPA'),3.429);
  assert.throws(()=>runTool('weighted-gpa',{scale:4,courses:'0,4'}),/credits/);assert.throws(()=>runTool('weighted-gpa',{scale:4,courses:'3,5'}),/grade/);
  for(const whole of [0,'',null,[],{},'0x10','NaN',Infinity]) assert.throws(()=>runTool('percentage',{part:10,whole}));
  assert.throws(()=>runTool('__proto__',{})); assert.throws(()=>runTool('percentage',[]));
});
test('text utilities count Unicode code points and describe approximate segmentation',()=>{
  const r=runTool('text-tools',{text:'Hi 🌍. Two words!',letterCase:'upper',wordsPerMinute:200});assert.equal(value(r,'Words (approximate)'),3);assert.equal(value(r,'Unicode code points'),16);assert.equal(value(r,'Converted text'),'HI 🌍. TWO WORDS!');
  assert.throws(()=>runTool('text-tools',{...defaults('text-tools'),text:'x'.repeat(20001)}));
});
test('unit conversions reject mixed dimensions and impossible temperatures',()=>{
  assert.equal(value(runTool('unit-converter',{value:1,from:'ft',to:'m'}),'Converted value'),0.3048);
  assert.equal(value(runTool('unit-converter',{value:32,from:'F',to:'C'}),'Converted value'),0);
  assert.equal(value(runTool('unit-converter',{value:0,from:'K',to:'C'}),'Converted value'),-273.15);
  assert.throws(()=>runTool('unit-converter',{value:1,from:'m',to:'kg'}),/dimension/);assert.throws(()=>runTool('unit-converter',{value:-1,from:'K',to:'F'}),/absolute zero/);
});
