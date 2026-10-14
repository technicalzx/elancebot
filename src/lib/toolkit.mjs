import { fail } from './security.mjs';

const numeric = (key, label, min, max, value) => ({key,label,type:'number',min,max,value,required:true});
const select = (key,label,options,value) => ({key,label,type:'select',options,value,required:true});
const option = (value,label=value) => ({value,label});
const units = {m:['length',1],km:['length',1000],cm:['length',0.01],ft:['length',0.3048],in:['length',0.0254],kg:['mass',1],g:['mass',0.001],lb:['mass',0.45359237],C:['temperature',1],F:['temperature',1],K:['temperature',1]};
const unitOptions = Object.keys(units).map(k=>option(k));
export const toolCatalog = [
  ...[['profile','Profile review'],['gig','Gig review'],['service','Service review'],['competitor','Competitor snapshots'],['website','Website metadata']].map(([id,name])=>({id,name,category:id==='website'?'Audit & SEO':'Freelancing',subcategory:id==='competitor'?'Positioning':'Reviews',mode:'review',summary:id==='website'?'Inspect an approved, authorized HTTPS page.':'Review your supplied content with explainable criteria.',fields:[]})),
  {id:'freelance-pricing',name:'Freelance pricing calculator',category:'Calculators',subcategory:'Freelancing',mode:'calculator',summary:'Plan a sustainable gross quote from your own income, costs, capacity and fee assumptions.',fields:[numeric('annualIncome','Target annual pre-tax income',0,1e9,60000),numeric('annualCosts','Annual business costs',0,1e9,12000),numeric('hoursPerWeek','Billable hours per week',0.01,168,20),numeric('weeksPerYear','Working weeks per year',0.01,52,46),numeric('projectHours','Estimated project hours',0.01,100000,10),numeric('projectCosts','Additional project costs',0,1e9,100),numeric('feePercent','Your assumed platform/payment fee (%)',0,99,10)]},
  {id:'profit-margin',name:'Profit, margin & markup',category:'Calculators',subcategory:'Business',mode:'calculator',summary:'Keep profit margin and markup distinct using revenue and total cost.',fields:[numeric('revenue','Revenue (same currency)',0,1e12,1000),numeric('cost','Total cost (same currency)',0,1e12,600)]},
  {id:'salary-converter',name:'Salary period converter',category:'Calculators',subcategory:'Finance',mode:'calculator',summary:'Compare gross hourly, weekly, monthly and annual pay using your working schedule. No tax rates assumed.',fields:[numeric('amount','Gross pay amount',0,1e9,25),select('period','Pay period',['hour','week','month','year'].map(k=>option(k)), 'hour'),numeric('hoursPerWeek','Paid hours per week',0.01,168,40),numeric('weeksPerYear','Paid weeks per year',0.01,52,52)]},
  {id:'percentage',name:'Percentage calculator',category:'Calculators',subcategory:'Education',mode:'calculator',summary:'Calculate what percentage one quantity is of another; useful for marks and attendance.',fields:[numeric('part','Part / earned amount',-1e12,1e12,18),numeric('whole','Whole / possible amount',0.000001,1e12,24)]},
  {id:'weighted-gpa',name:'Weighted GPA calculator',category:'Calculators',subcategory:'Education',mode:'calculator',summary:'Use your institution’s grade points and course credits. No institution-specific grade conversion is assumed.',fields:[numeric('scale','Maximum grade-point scale',1,100,4),{key:'courses',label:'Courses: credits, grade points (one per line)',type:'textarea',maxLength:5000,required:true,value:'3,4\n4,3'}]},
  {id:'text-tools',name:'Text counter & case converter',category:'Converters',subcategory:'Text',mode:'utility',summary:'Count Unicode characters, estimate reading time, and change letter case. No AI or grammar claims.',fields:[{key:'text',label:'Your text',type:'textarea',maxLength:20000,required:true,value:''},select('letterCase','Letter case',[option('unchanged','Keep original'),option('upper','UPPERCASE'),option('lower','lowercase')],'unchanged'),numeric('wordsPerMinute','Assumed reading speed (words/minute)',50,1000,200)]},
  {id:'unit-converter',name:'Length, mass & temperature',category:'Converters',subcategory:'Units',mode:'utility',summary:'Convert compatible metric/imperial units with explicit units and precision.',fields:[numeric('value','Value',-1e12,1e12,1),select('from','From unit',unitOptions,'m'),select('to','To unit',unitOptions,'ft')]}
];
export const findTool = id => toolCatalog.find(t=>t.id===id);
const round = (v,places=2) => Number(v.toFixed(places));
function number(value,label,min,max) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim()))) fail(400,'invalid_input',`${label}: enter a number.`);
  const n=Number(value);
  if(!Number.isFinite(n) || n<min || n>max) fail(400,'invalid_input',`${label}: use a value from ${min} to ${max}.`);
  return n;
}
export function runTool(id,raw) {
  const tool=findTool(id);
  if(!tool || tool.mode==='review') fail(400,'unsupported_tool','Choose a calculator or utility from the tool directory.');
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) fail(400,'invalid_input','Tool inputs must be an object.');
  const input={};
  for(const f of tool.fields) {
    const value=raw[f.key];
    if(f.type==='number') input[f.key]=number(value,f.label,f.min,f.max);
    else if(f.type==='select') { if(!f.options.some(o=>o.value===value)) fail(400,'invalid_input',`${f.label}: choose a supported option.`); input[f.key]=value; }
    else { if(typeof value!=='string' || !value.trim() || value.length>f.maxLength) fail(400,'invalid_input',`${f.label}: enter text up to ${f.maxLength} characters.`); input[f.key]=value; }
  }
  const values=[],explanations=[],recommendations=[];
  const add=(label,value,unit='')=>values.push({label,value,unit});
  const limitations=['Calculated from your supplied inputs, not live market data. Check assumptions before relying on the result.'];
  if(id==='freelance-pricing') {
    const hours=input.hoursPerWeek*input.weeksPerYear, rate=(input.annualIncome+input.annualCosts)/hours;
    add('Annual billable hours',round(hours),'hours'); add('Hourly target before per-project fees',round(rate),'currency units/hour');
    add('Gross project quote',round((rate*input.projectHours+input.projectCosts)/(1-input.feePercent/100)),'currency units');
    explanations.push('Hourly target = (annual income + annual costs) ÷ annual billable hours.','Gross quote = (hourly target × project hours + project costs) ÷ (1 − assumed fee rate).');
    recommendations.push('Compare estimated hours with actual delivery time and adjust your next quote.','Use one currency throughout and review scope, revisions and non-billable work.');
    limitations.push('No taxes, exchange rates, demand or platform fee schedule are included. Income is pre-tax. This is planning arithmetic, not financial advice.');
  } else if(id==='profit-margin') {
    const profit=input.revenue-input.cost;
    add('Profit',round(profit),'currency units'); add('Margin',input.revenue===0?'Undefined: zero revenue':round(profit/input.revenue*100),'%');
    add('Markup',input.cost===0?'Undefined: zero cost':round(profit/input.cost*100),'%');
    explanations.push('Profit = revenue − cost. Margin uses revenue as the denominator; markup uses cost.'); recommendations.push('Include all relevant costs consistently; a negative result represents a loss.');
  } else if(id==='salary-converter') {
    const annual=input.amount*({hour:input.hoursPerWeek*input.weeksPerYear,week:input.weeksPerYear,month:12,year:1})[input.period];
    add('Annual gross pay',round(annual),'currency units/year');add('Average monthly gross pay',round(annual/12),'currency units/month');add('Gross pay per paid week',round(annual/input.weeksPerYear),'currency units/week');add('Gross hourly equivalent',round(annual/(input.weeksPerYear*input.hoursPerWeek)),'currency units/hour');
    explanations.push('Convert to annual pay using the selected period and paid schedule; divide by 12 for the monthly average.'); recommendations.push('Confirm paid leave, overtime and benefits separately.');limitations.push('Gross equivalents only. This is not a take-home, tax or legal payroll calculation.');
  } else if(id==='percentage') {
    add('Percentage',round(input.part/input.whole*100,4),'%');explanations.push('Percentage = part ÷ whole × 100. Values above 100% or below zero are permitted mathematically.');recommendations.push('Use the same units for both quantities. For grades or attendance, check the institution’s rules.');
  } else if(id==='weighted-gpa') {
    const rows=input.courses.trim().split(/\r?\n/).filter(l=>l.trim());
    if(rows.length>100) fail(400,'invalid_input','Use at most 100 courses.');
    let credits=0,points=0;
    for(const [i,row] of rows.entries()) { const cells=row.split(','); if(cells.length!==2) fail(400,'invalid_input',`Course ${i+1}: enter credits, grade points.`); const weight=number(cells[0],`Course ${i+1} credits`,0.01,1000),grade=number(cells[1],`Course ${i+1} grade`,0,input.scale); credits+=weight; points+=weight*grade; }
    add('Weighted GPA',round(points/credits,3),`out of ${input.scale}`);add('Total credits',round(credits,3),'credits');add('Weighted grade points',round(points,3));
    explanations.push('GPA = sum(course credits × grade points) ÷ total credits.'); recommendations.push('For cumulative GPA, include all eligible courses across terms.');limitations.push('Use institution-issued grade points. Pass/fail, repeated courses and rounding policies need institutional handling.');
  } else if(id==='text-tools') {
    const words=input.text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[];
    add('Words (approximate)',words.length);add('Unicode code points',[...input.text].length);add('Sentences (approximate)',input.text.split(/[.!?。！？]+/u).filter(s=>/[\p{L}\p{N}]/u.test(s)).length);add('Estimated reading time',round(words.length/input.wordsPerMinute,2),'minutes');
    add('Converted text',input.letterCase==='upper'?input.text.toUpperCase():input.letterCase==='lower'?input.text.toLowerCase():input.text);
    explanations.push(`Reading time uses your assumed ${input.wordsPerMinute} words/minute. Character count uses Unicode code points, not UTF-16 units or visual graphemes.`);recommendations.push('Review converted names and acronyms before publishing.');limitations.push('Word/sentence segmentation is approximate, particularly for languages without word spaces. No translation, grammar check or AI model is used.');
  } else if(id==='unit-converter') {
    const from=units[input.from],to=units[input.to]; if(from[0]!==to[0]) fail(400,'invalid_input','Choose units from the same dimension (length, mass or temperature).');
    let value;
    if(from[0]==='temperature') { const c=input.from==='F'?(input.value-32)*5/9:input.from==='K'?input.value-273.15:input.value; if(c< -273.150000001) fail(400,'invalid_input','Temperature cannot be below absolute zero.'); value=input.to==='F'?c*9/5+32:input.to==='K'?c+273.15:c; }
    else { if(input.value<0) fail(400,'invalid_input','Length and mass cannot be negative.'); value=input.value*from[1]/to[1]; }
    add('Converted value',round(value,8),input.to); explanations.push(`Converted ${input.value} ${input.from} to ${input.to} using defined conversion factors/temperature offsets; displayed to at most eight decimals.`);recommendations.push('Check the selected units and required precision for your use case.');
  }
  return {toolId:id,toolName:tool.name,version:'1.0.0',input,values,explanations,recommendations,limitations,provenance:{kind:'calculated-user-input',liveData:false,aiGenerated:false}};
}
