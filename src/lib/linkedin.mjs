import {fail} from './security.mjs';
const fields=['headline','about','experience','skills','featured','education'];
function bounded(value,name,max,required=false){
  if(value===undefined&&!required)return '';
  if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail(400,'invalid_linkedin',`${name}: provide ${required?'nonempty ':''}text up to ${max} characters.`);
  return value.trim();
}
export function linkedinInput(body){
  let url;try{url=new URL(body.url);}catch{fail(400,'invalid_linkedin_url','Enter an HTTPS LinkedIn /in/ profile URL.');}
  if(url.protocol!=='https:'||!['linkedin.com','www.linkedin.com'].includes(url.hostname)||url.port||url.username||url.password||url.search||url.hash||!/^\/in\/[\p{L}\p{N}%_-]{1,100}\/?$/u.test(url.pathname))fail(400,'invalid_linkedin_url','Use an HTTPS linkedin.com/in/profile URL without tracking parameters.');
  const goal=body.goal||'clients';if(!['clients','jobs','brand'].includes(goal))fail(400,'invalid_linkedin','Choose clients, jobs or brand.');
  const keywords=bounded(body.keywords,'Target phrases',500).split(',').map(v=>v.trim()).filter(Boolean);
  if(keywords.length>10||keywords.some(v=>v.length>60))fail(400,'invalid_linkedin','Use up to ten phrases, each at most 60 characters.');
  const source=bounded(body.sourceText,'Profile content',12000);
  if(!source)fail(422,'linkedin_connection_required','URL recognized, but no approved LinkedIn profile connector is configured. Add authorized profile JSON or labeled text; no profile has been fetched.');
  let parsed={},format='labeled-text';
  if(source.startsWith('{')){
    try{parsed=JSON.parse(source);}catch{fail(400,'invalid_linkedin_json','The profile JSON is invalid. Use the provided schema.');}
    if(parsed?.schemaVersion==='linkedin-profile-1.0'){
      if(parsed.url!==`https://www.linkedin.com${url.pathname.replace(/\/$/,'')}`)fail(400,'profile_url_mismatch','The exported profile URL must match the reference URL.');
      parsed=parsed.fields;
    }
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||Object.keys(parsed).some(k=>!fields.includes(k)))fail(400,'invalid_linkedin_json','Profile JSON accepts only headline, about, experience, skills, featured and education string fields.');
    format='profile-json';
  }else{
    let section=null,unmapped=0;
    for(const line of source.split(/\r?\n/)){
      const match=line.match(/^\s*(Headline|About|Experience|Skills|Featured|Education)\s*:\s*(.*)$/i);
      if(match){section=match[1].toLowerCase();parsed[section]=(parsed[section]?parsed[section]+'\n':'')+match[2];}
      else if(section)parsed[section]+='\n'+line;
      else if(line.trim())unmapped++;
    }
    if(unmapped)fail(400,'unmapped_profile_text','Start each section with an English label such as Headline: or About:. Unlabeled introductory text cannot be mapped reliably.');
  }
  const profile=Object.fromEntries(fields.map(k=>[k,bounded(parsed[k],k,k==='headline'?500:5000)]));
  if(!Object.values(profile).some(Boolean))fail(400,'empty_profile','No recognized profile sections were supplied.');
  return {workflow:'linkedin',url:`https://www.linkedin.com${url.pathname.replace(/\/$/,'')}`,goal,keywords:keywords.join(', '),sourceText:source,profile,format};
}
export function analyzeLinkedin(input){
  const {profile,goal}=input;
  const guidance={headline:'State your specialty, intended audience and credible value. Keep only claims you can support.',about:'Explain who you help, the problem, your method, one verified example and a clear next step.',experience:'Describe your own contribution, project scope and substantiated outcomes. Do not invent employers, dates or numbers.',skills:'Include relevant skills you can demonstrate; connect them to experience rather than keyword stuffing.',featured:'Choose a relevant case study, work sample or project link. Check that you can share it publicly.',education:'Record accurate qualifications and relevant learning. Missing imported education is not proof that education is absent.'};
  const priorities={clients:['headline','about','featured','experience','skills','education'],jobs:['experience','skills','headline','about','education','featured'],brand:['headline','featured','about','experience','skills','education']};
  const criteria=fields.map(id=>({id,label:id[0].toUpperCase()+id.slice(1),score:profile[id]?1:0,maxScore:1,evidence:[profile[id]?profile[id].slice(0,350):'Not present in supplied data; actual profile may contain this section.']}));
  const recommendations=priorities[goal].map((id,i)=>({id,title:`${profile[id]?'Review':'Supply'} ${id}`,action:guidance[id],impact:i<3?'high':'medium',effort:'medium',priority:i+1,criterionId:id}));
  const keywords=input.keywords.split(',').map(k=>k.trim()).filter(Boolean).map(phrase=>({phrase,sections:fields.filter(k=>profile[k].toLocaleLowerCase().includes(phrase.toLocaleLowerCase()))}));
  const coverage=criteria.reduce((n,c)=>n+c.score,0);
  return {analysisType:'linkedin-profile',auditVersion:'linkedin-1.0',score:Math.round(coverage/fields.length*100),band:`${coverage}/6 imported sections`,deterministic:true,
    goal,structuredProfile:{schemaVersion:'linkedin-profile-1.0',url:input.url,fields:profile,missingSections:fields.filter(k=>!profile[k]),provenance:{retrieval:'user-supplied-snapshot',format:input.format,recordedAt:new Date().toISOString(),verified:false}},
    criteria,recommendations,keywords,checklist:recommendations.map(r=>({id:r.id,action:r.action,completed:false})),
    draftOutline:goal==='jobs'?['Target role and demonstrated specialties','Relevant experience with verified contributions','Skills backed by evidence','Clear availability and contact next step']:goal==='clients'?['Audience and problem you solve','Deliverables and working process','Relevant case study with verified evidence','Invitation to discuss a brief']:['Professional point of view','Specialty and audience','Selected original work and evidence','Invitation to follow or start a relevant conversation'],
    dataProvenance:{source:'Authorized user-supplied LinkedIn snapshot',liveData:false,note:'The reference URL was not fetched. Section mapping is deterministic, not AI extraction.'},
    limitations:['The percentage measures imported section coverage only, not profile quality, LinkedIn rank, employability or earnings.','Only English section labels are parsed; JSON field values may contain other languages. Check mapping before using recommendations.','Target phrase matches are literal substrings, not search volume or ranking signals.','Goal-specific guidance and outlines are rules, not personalized AI rewrites. No changes are posted to LinkedIn.']};
}
