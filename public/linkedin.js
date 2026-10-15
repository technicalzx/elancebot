'use strict';
let linkedinProjectId=null,linkedinAnalyses=[],linkedinResult=null;
const li=id=>document.getElementById(id);
async function linkedinApi(path,method='GET',body){
  const response=await fetch('/api/v1'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();if(!response.ok)throw new Error(data.error?.message||'Request failed.');return data;
}
function liText(parent,tag,text){const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;}
function showLinkedin(result){
  linkedinResult=result;li('linkedin-results').hidden=false;
  li('linkedin-summary').textContent=`${result.band} · ${result.score}% imported section coverage, not quality or ranking · Goal: ${result.goal} · ${result.auditVersion}`;
  const report=li('linkedin-report');report.replaceChildren();
  liText(report,'p',result.dataProvenance.note);
  for(const rec of result.recommendations){liText(report,'h3',`${rec.priority}. ${rec.title}`);liText(report,'p',rec.action);liText(report,'blockquote',result.criteria.find(c=>c.id===rec.id).evidence[0]);}
  liText(report,'h3','Target phrase coverage');
  if(!result.keywords.length)liText(report,'p','No target phrases supplied.');
  for(const item of result.keywords)liText(report,'p',`${item.phrase}: ${item.sections.join(', ')||'Not found in imported sections'}`);
  liText(report,'h3','Draft outline to complete with your own facts');const outline=document.createElement('ol');report.append(outline);for(const item of result.draftOutline)liText(outline,'li',item);
  for(const note of result.limitations)liText(report,'p',note);
  li('linkedin-json').textContent=JSON.stringify(result.structuredProfile,null,2);
  li('linkedin-project-link').href='/#app/project/'+encodeURIComponent(linkedinProjectId);
  li('linkedin-result-title').focus();
}
async function loadLinkedin(id){
  const data=await linkedinApi('/projects/'+encodeURIComponent(id));
  if(data.project.input.workflow!=='linkedin')throw new Error('This is not a dedicated LinkedIn review.');
  linkedinProjectId=id;linkedinAnalyses=data.analyses.filter(a=>a.result.analysisType==='linkedin-profile');
  for(const key of ['url','goal','keywords','sourceText'])li('linkedin-form').elements[key].value=data.project.input[key]||'';
  li('linkedin-form').elements.attested.checked=false;
  li('linkedin-editing').textContent='Editing this saved project. Reconfirm authorization to save a new revision.';
  li('linkedin-revision').replaceChildren();linkedinAnalyses.forEach((a,i)=>li('linkedin-revision').add(new Option(`${a.created_at} · ${a.result.auditVersion}`,String(i))));
  if(linkedinAnalyses.length)showLinkedin(linkedinAnalyses[0].result);
}
async function refreshLinkedin(){
  const list=li('linkedin-saved');list.replaceChildren();
  try{const {user}=await linkedinApi('/auth/session');li('linkedin-session').textContent=`Signed in as ${user.name}.`;
    const {projects}=await linkedinApi('/projects');
    for(const p of projects.filter(p=>p.input.workflow==='linkedin')){const item=liText(list,'li','');const button=liText(item,'button',p.name);button.type='button';button.className='button button-secondary';button.addEventListener('click',()=>loadLinkedin(p.id).catch(e=>li('linkedin-error').textContent=e.message));}
    if(!list.children.length)liText(list,'li','No saved LinkedIn reviews yet.');
  }catch(e){li('linkedin-session').textContent=e.message+' Sign in through the workspace link.';}
}
li('linkedin-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.currentTarget.querySelector('[type=submit]');button.disabled=true;li('linkedin-error').textContent='';
  try{const values=Object.fromEntries(new FormData(event.currentTarget));const data=await linkedinApi('/linkedin/analyze','POST',{...values,attested:values.attested==='on',...(linkedinProjectId?{projectId:linkedinProjectId}:{})});await loadLinkedin(data.project.id);await refreshLinkedin();}
  catch(e){li('linkedin-error').textContent=e.message;}finally{button.disabled=false;}
});
li('linkedin-new').addEventListener('click',()=>{linkedinProjectId=null;linkedinResult=null;linkedinAnalyses=[];li('linkedin-form').reset();li('linkedin-results').hidden=true;li('linkedin-editing').textContent='New project. Nothing saved yet.';li('linkedin-error').textContent='';});
li('linkedin-refresh').addEventListener('click',refreshLinkedin);
li('linkedin-revision').addEventListener('change',event=>showLinkedin(linkedinAnalyses[Number(event.target.value)].result));
function downloadLinkedin(profileOnly){if(!linkedinResult)return;const blob=new Blob([JSON.stringify(profileOnly?linkedinResult.structuredProfile:linkedinResult,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=profileOnly?'elancebot-linkedin-profile.json':'elancebot-linkedin-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
li('linkedin-download-profile').addEventListener('click',()=>downloadLinkedin(true));li('linkedin-download-report').addEventListener('click',()=>downloadLinkedin(false));
void refreshLinkedin();
