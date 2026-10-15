'use strict';
let experimentPlan=null;
let planInput=null, savedExperiment=null;
const metricDefinitions={
  'inquiry-rate':{outcome:'qualified inquiries',denominator:'profile/page visits'},
  'click-rate':{outcome:'clicks',denominator:'impressions'},
  'order-rate':{outcome:'orders',denominator:'qualified inquiries'}
};
document.getElementById('experiment-planner').addEventListener('submit',event=>{
  event.preventDefault();
  const values=Object.fromEntries(new FormData(event.currentTarget));
  const days=Number(values.window),metric=metricDefinitions[values.metric];
  const error=document.getElementById('planner-error');error.textContent='';
  if(!Number.isInteger(days)||days<7||days>90||!metric||['offer','evidence','change','source'].some(k=>!values[k].trim())) {error.textContent='Complete the required fields and choose a whole measurement period of 7–90 days.';return;}
  planInput={...values,periodDays:days};savedExperiment=null;
  document.getElementById('save-plan').hidden=false;
  document.getElementById('save-status').textContent='Local plan only — not saved yet.';
  document.getElementById('observation-section').hidden=true;
  experimentPlan={schemaVersion:'experiment-plan-1.0',createdAt:new Date().toISOString(),offer:values.offer.trim(),evidence:values.evidence.trim(),change:values.change.trim(),metric,periodDays:days,source:values.source.trim(),confounders:values.confounders.trim(),status:'planned',baseline:null,followUp:null,steps:[`Record ${metric.outcome} and ${metric.denominator} for a complete ${days}-day baseline.`, 'Save the original offer and its review. Make only the stated change and record the publication date.',`After a comparable ${days}-day follow-up, record the same counts from the same authorized source.`, 'Document other changes and missing data. Compare rates only when denominators are positive; do not interpret a before/after difference as proof of causation.'],limitations:['User-authored plan; no external data has been retrieved or verified.','No observed outcomes, statistical significance, marketplace rank or earnings forecast is generated.']};
  document.getElementById('plan-text').textContent=[experimentPlan.offer,'Evidence: '+experimentPlan.evidence,'Change: '+experimentPlan.change,'Primary outcome: '+metric.outcome+' / '+metric.denominator,'Source: '+experimentPlan.source,...experimentPlan.steps.map((s,i)=>`${i+1}. ${s}`),'Possible confounders: '+(experimentPlan.confounders||'Not recorded — review before starting.')].join('\n\n');
  document.getElementById('plan-result').hidden=false;document.getElementById('plan-heading').focus();
});
async function experimentApi(path,method='GET',body) {
  const response=await fetch('/api/v1'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error?.message||'Unable to complete the request.');
  return data;
}
async function refreshExperiments() {
  const status=document.getElementById('account-status'),list=document.getElementById('saved-experiments');
  list.replaceChildren();
  try {
    const {user}=await experimentApi('/auth/session');
    status.textContent=`Signed in as ${user.name}. Up to 50 private experiments.`;
    const {experiments}=await experimentApi('/experiments');
    for(const item of experiments) {
      const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.className='button button-secondary';
      button.textContent=`${item.plan.offer} — ${item.comparison.status.replaceAll('-',' ')}`;
      button.addEventListener('click',()=>openExperiment(item.id).catch(e=>status.textContent=e.message));li.append(button);list.append(li);
    }
    if(!experiments.length)list.textContent='No saved experiments yet. Build your first plan below.';
    const {projects}=await experimentApi('/projects'),select=document.getElementById('project'),previous=select.value;
    select.replaceChildren(new Option('Standalone experiment',''));
    for(const project of projects)select.add(new Option(project.name,project.id));
    if(projects.some(p=>p.id===previous))select.value=previous;
  } catch(error) {status.textContent=error.message+' Local planning and downloads are still available.';}
}
function showSaved(item) {
  savedExperiment=item;experimentPlan=item;
  const p=item.plan,m=metricDefinitions[p.metric];
  document.getElementById('plan-text').textContent=[p.offer,'Evidence: '+p.evidence,'Change: '+p.change,`Measure: ${m.outcome} / ${m.denominator}`,`Period: ${p.periodDays} days each`,'Authorized source: '+p.source,'Other influences: '+(p.confounders||'Not recorded'), 'Provenance: manually supplied, unverified'].join('\n\n');
  document.getElementById('plan-result').hidden=false;
  document.getElementById('save-plan').hidden=true;
  document.getElementById('save-status').textContent=`Saved privately · version ${item.version}`;
  document.getElementById('observation-section').hidden=false;
  const fields=document.getElementById('observation-fields');fields.replaceChildren();
  for(const period of ['baseline','followUp']) {
    const group=document.createElement('fieldset');group.className='form-field';
    const legend=document.createElement('legend');legend.textContent=period==='baseline'?'Baseline':'Follow-up';group.append(legend);
    for(const [key,label,type] of [['start','Start date','date'],['end','End date (inclusive)','date'],['outcomes',metricDefinitions[item.plan.metric].outcome,'number'],['denominator',metricDefinitions[item.plan.metric].denominator,'number'],['source','Source / export reference','text'],['notes','Publication date and other influences','text']]) {
      const wrap=document.createElement('div');wrap.className='form-field';
      const input=document.createElement('input');input.id=`${period}-${key}`;input.name=input.id;input.type=type;
      if(type==='number'){input.min='0';input.max='1000000000';input.step='1';}
      if(type==='text')input.maxLength=key==='notes'?2000:300;
      input.value=item.observations[period]?.[key]??'';
      const title=document.createElement('label');title.htmlFor=input.id;title.textContent=label;wrap.append(title,input);group.append(wrap);
    }
    fields.append(group);
  }
  const c=item.comparison,percent=n=>n===null?'Unavailable':n.toFixed(2)+'%';
  document.getElementById('comparison-text').textContent=[`Baseline: ${percent(c.baselinePercent)}`,`Follow-up: ${percent(c.followUpPercent)}`,`Change: ${c.percentagePointChange===null?'Unavailable':c.percentagePointChange.toFixed(2)+' percentage points'}`,`Relative change: ${percent(c.relativeChangePercent)}`,...c.warnings].join('\n\n');
  document.getElementById('plan-heading').focus();
}
async function openExperiment(id) {showSaved((await experimentApi('/experiments/'+id)).experiment);}
document.getElementById('refresh-experiments').addEventListener('click',refreshExperiments);
document.getElementById('save-plan').addEventListener('click',async event=>{
  if(!planInput)return;
  event.currentTarget.disabled=true;
  try {showSaved((await experimentApi('/experiments','POST',planInput)).experiment);await refreshExperiments();}
  catch(error){document.getElementById('save-status').textContent=error.message;}
  finally{document.getElementById('save-plan').disabled=false;}
});
document.getElementById('observations-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!savedExperiment)return;
  const error=document.getElementById('observation-error');error.textContent='';
  const values=Object.fromEntries(new FormData(event.currentTarget));
  const body={version:savedExperiment.version};
  try {
    for(const period of ['baseline','followUp']) {
      const obj=Object.fromEntries(['start','end','outcomes','denominator','source','notes'].map(k=>[k,values[`${period}-${k}`].trim()]));
      if(Object.values(obj).every(v=>v==='')){body[period]=null;continue;}
      if(['start','end','outcomes','denominator','source'].some(k=>obj[k]===''))throw new Error('Complete all fields except notes for each period, or leave the entire period blank.');
      obj.outcomes=Number(obj.outcomes);obj.denominator=Number(obj.denominator);body[period]=obj;
    }
    const button=event.currentTarget.querySelector('[type=submit]');button.disabled=true;
    try {showSaved((await experimentApi('/experiments/'+savedExperiment.id,'PATCH',body)).experiment);error.textContent='Observations saved.';await refreshExperiments();}
    finally {button.disabled=false;}
  } catch(e){error.textContent=e.message;}
});
document.getElementById('delete-experiment').addEventListener('click',async()=>{
  if(!savedExperiment || !confirm('Permanently delete this experiment? Download it first if needed.'))return;
  try {await experimentApi('/experiments/'+savedExperiment.id,'DELETE');savedExperiment=null;experimentPlan=null;document.getElementById('plan-result').hidden=true;document.getElementById('observation-section').hidden=true;await refreshExperiments();}
  catch(e){document.getElementById('observation-error').textContent=e.message;}
});
void refreshExperiments();
document.getElementById('download-plan').addEventListener('click',()=>{
  if(!experimentPlan)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(experimentPlan,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='elancebot-experiment-plan.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
