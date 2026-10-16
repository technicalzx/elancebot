import { fail } from './security.mjs';

const text = (key, label, maxLength, value = '') => ({key, label, type:'textarea', maxLength, required:true, value});
const requirements = text('requirements','Required phrases, one per line (up to 20)',3500,'Cloud deployment\nDocumentation');
const evidence = text('evidence','Your authorized experience and evidence',12000,'Cloud deployment for a demo project. Documentation includes a handover checklist.');
export const professionalTools = [
  {id:'job-evidence-fit',name:'Job brief and evidence fit',category:'Career & clients',subcategory:'Proposals',mode:'workflow',summary:'Check explicitly supplied requirements against your evidence and prepare a proposal outline. Literal matches do not establish qualifications.',fields:[text('role','Role or project objective',160,'Cloud deployment support'),requirements,evidence]},
  {id:'resume-evidence-review',name:'Resume evidence review',category:'Career & clients',subcategory:'Resume',mode:'workflow',summary:'Inspect resume sections and supplied requirement phrases with exact excerpts. No proprietary ATS score or hiring prediction.',fields:[requirements,text('evidence','Authorized resume text',12000,'Summary: Cloud deployment specialist\nExperience: Cloud deployment for a demo project\nSkills: Documentation\nEducation: Supplied qualification')]},
  {id:'fiverr-package-review',name:'Offer package consistency',category:'Freelancing',subcategory:'Fiverr',mode:'workflow',summary:'Check your package prices, scope, delivery and revisions. Uses entered offers without retrieving marketplace data.',fields:[text('offer','Offer title',160,'Cloud deployment and handover'),text('packages','Packages JSON (1–3 packages)',8000,JSON.stringify([{name:'Basic',price:100,currency:'USD',deliveryDays:3,revisions:1,deliverables:['Deployment']},{name:'Standard',price:200,currency:'USD',deliveryDays:5,revisions:2,deliverables:['Deployment','Handover documentation']}],null,2)),text('buyerRequirements','What the buyer must supply',2000,'Authorized access and agreed deployment scope')]},
  {id:'client-brief-planner',name:'Client brief and proposal planner',category:'Career & clients',subcategory:'Proposals',mode:'workflow',summary:'Turn supplied scope, evidence and constraints into a reviewable proposal and discovery checklist. Nothing is sent.',fields:[text('objective','Client objective',1000,'Deploy the agreed application'),text('deliverables','Deliverables, one per line',3000,'Deployment\nHandover documentation'),text('constraints','Known constraints and exclusions',2000,'No production credentials supplied; hosting cost not agreed'),evidence,text('questions','Unanswered questions, one per line',2000,'Who approves acceptance?\nWhat hosting budget is approved?')]},
  {id:'content-outline',name:'Evidence-based content outline',category:'Content studio',subcategory:'Planning',mode:'workflow',summary:'Build a labeled template from supplied facts, audience, tone and call to action. Review every claim before publication.',fields:[text('topic','Topic',160,'A cloud deployment handover'),text('audience','Intended audience',300,'Small business owners'),evidence,text('callToAction','Your call to action',300,'Ask for the deployment checklist'),{key:'format',label:'Format',type:'select',required:true,value:'post',options:['post','article','email','case-study'].map(value=>({value,label:value}))},{key:'tone',label:'Tone',type:'select',required:true,value:'professional',options:['professional','friendly','persuasive','educational','conversational','technical','executive','personal','minimal','creative'].map(value=>({value,label:value}))}]}
];

function lines(value, label, max=20) {
  const values=value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!values.length || values.length>max || values.some(x=>x.length>160 || !/[\p{L}\p{N}]/u.test(x))) fail(400,'invalid_input',`${label}: supply 1–${max} nonempty lines of at most 160 characters.`);
  const unique=new Set(values.map(x=>x.normalize('NFC').toLowerCase()));
  if(unique.size!==values.length) fail(400,'invalid_input',`${label}: remove duplicate lines.`);
  return values;
}
function literalMatch(source, phrase) {
  const escaped=phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,'iu');
  const match=pattern.exec(source);
  if(!match)return null;
  const start=Math.max(0,match.index-60),end=Math.min(source.length,match.index+match[0].length+100);
  return {phrase,excerpt:source.slice(start,end),match:match[0],offset:match.index,source:'user-supplied evidence; not independently verified'};
}
function evidenceFit(input) {
  const required=lines(input.requirements,'Required phrases');
  const matches=required.map(phrase=>literalMatch(input.evidence,phrase));
  return {required,matches:matches.filter(Boolean),missing:required.filter((_,i)=>!matches[i])};
}
function packageReview(input) {
  let packages;
  try { packages=JSON.parse(input.packages); } catch { fail(400,'invalid_input','Packages must be a JSON array.'); }
  if(!Array.isArray(packages)||!packages.length||packages.length>3) fail(400,'invalid_input','Supply 1–3 packages.');
  const allowed=['name','price','currency','deliveryDays','revisions','deliverables'];
  for(const p of packages) {
    if(!p || typeof p!=='object' || Array.isArray(p) || Object.keys(p).some(k=>!allowed.includes(k))) fail(400,'invalid_input','Each package must contain only name, price, currency, deliveryDays, revisions and deliverables.');
    if(typeof p.name!=='string'||!p.name.trim()||p.name.length>80 || typeof p.currency!=='string'||! /^[A-Z]{3}$/.test(p.currency)) fail(400,'invalid_input','Supply a package name and a three-letter uppercase currency code.');
    if(typeof p.price!=='number'||!Number.isFinite(p.price)||p.price<=0||p.price>1e9||Math.abs(p.price*100-Math.round(p.price*100))>0.0001) fail(400,'invalid_input','Package prices must be positive numbers with at most two decimals.');
    if(!Number.isInteger(p.deliveryDays)||p.deliveryDays<1||p.deliveryDays>365||!Number.isInteger(p.revisions)||p.revisions<0||p.revisions>100) fail(400,'invalid_input','Delivery days must be 1–365 and revisions 0–100, as whole numbers.');
    if(!Array.isArray(p.deliverables)||!p.deliverables.length||p.deliverables.length>20||p.deliverables.some(x=>typeof x!=='string'||!x.trim()||x.length>160)) fail(400,'invalid_input','Each package needs 1–20 deliverables of at most 160 characters.');
    p.name=p.name.trim();p.deliverables=p.deliverables.map(x=>x.trim());
    if(new Set(p.deliverables.map(x=>x.toLowerCase())).size!==p.deliverables.length) fail(400,'invalid_input','Remove duplicate deliverables within a package.');
  }
  if(new Set(packages.map(p=>p.name.toLowerCase())).size!==packages.length) fail(400,'invalid_input','Package names must be unique.');
  if(new Set(packages.map(p=>p.currency)).size!==1) fail(400,'invalid_input','Use one currency to compare packages. No exchange rate is assumed.');
  const findings=[];
  for(let i=1;i<packages.length;i++) {
    const previous=packages[i-1],current=packages[i];
    if(current.price<=previous.price) findings.push(`${current.name}: price does not increase from ${previous.name}; confirm that this is intentional.`);
    const removed=previous.deliverables.filter(d=>!current.deliverables.some(x=>x.toLowerCase()===d.toLowerCase()));
    if(removed.length) findings.push(`${current.name}: not explicitly included from ${previous.name}: ${removed.join('; ')}. Clarify whether packages are cumulative or alternatives.`);
    const additions=current.deliverables.filter(d=>!previous.deliverables.some(x=>x.toLowerCase()===d.toLowerCase()));
    if(!additions.length && current.price>previous.price && current.revisions<=previous.revisions && current.deliveryDays>=previous.deliveryDays) findings.push(`${current.name}: higher price without an additional listed deliverable, more revisions or faster delivery. Explain the distinction.`);
  }
  return {packages,findings};
}
export function runProfessionalTool(id,input) {
  const values=[],explanations=[],recommendations=[];
  const limitations=['Uses only supplied text. No marketplace retrieval, AI inference, market benchmark, ranking or sending is performed. Verify facts and permissions before use.'];
  const add=(label,value)=>values.push({label,value,unit:''});
  let evidence=[];
  if(id==='job-evidence-fit'||id==='resume-evidence-review') {
    const fit=evidenceFit(input);evidence=fit.matches;
    add('Requirement phrases checked',fit.required.length);
    add('Phrases found in supplied text',fit.matches.length);
    add('Phrases not found',fit.missing.join('\n')||'None; this does not verify competence or suitability.');
    add('Exact evidence excerpts',fit.matches.map(m=>`${m.phrase}: “${m.excerpt}”`).join('\n\n')||'No literal evidence matched.');
    if(id==='job-evidence-fit') {
      add('Proposal outline — template',`Objective to confirm: ${input.role}\nEvidence to discuss:\n${fit.matches.map(m=>`- ${m.phrase}: “${m.excerpt}”`).join('\n')||'- [Add genuine relevant evidence]'}\nUnverified requirements: ${fit.missing.join('; ')||'All phrases occur; verify their context.'}\n[Confirm deliverables, acceptance, schedule and price before sending.]`);
      recommendations.push('Discuss each requirement with its original evidence and acknowledge every unsupported requirement.','Confirm scope, acceptance criteria, budget and availability before making a commitment.');
    } else {
      const headings=[['Summary',/(?:^|\n)\s*(?:professional\s+)?(?:summary|profile|objective)\s*[:\n]/iu],['Experience',/(?:^|\n)\s*(?:(?:work|professional)\s+)?experience\s*[:\n]/iu],['Skills',/(?:^|\n)\s*(?:technical\s+)?skills\s*[:\n]/iu],['Education',/(?:^|\n)\s*education\s*[:\n]/iu]];
      add('Recognized English section labels',headings.filter(([,re])=>re.test(input.evidence)).map(([label])=>label).join(', ')||'None recognized; review formatting and language manually.');
      recommendations.push('Use clear section labels and review dates, contact details and measurable claims yourself.','Add only skills and achievements supported by your experience; missing phrases are review prompts, not instructions to stuff keywords.');
      limitations.push('Plain text only. This does not parse PDF/DOCX, evaluate visual formatting or reproduce any employer ATS. Section recognition supports the listed English labels.');
    }
    explanations.push('Each user-entered phrase is matched case-insensitively with Unicode letter/number boundaries. Substrings inside longer words are excluded; synonyms and meaning are not inferred.','Matched excerpts are exact slices of the supplied source. A match may be negated, historical or irrelevant; read its context. A missing phrase does not prove a missing skill.');
  } else if(id==='fiverr-package-review') {
    const review=packageReview(input);
    add('Offer',input.offer);add('Packages checked',review.packages.length);
    add('Scope and price comparison',review.packages.map(p=>`${p.name}: ${p.price.toFixed(2)} ${p.currency}; ${p.deliveryDays} days; ${p.revisions} revisions\n${p.deliverables.map(x=>'- '+x).join('\n')}`).join('\n\n'));
    add('Consistency observations',review.findings.join('\n')||'No issue found by these limited comparison rules. Confirm the offer manually.');
    add('Buyer information to confirm',input.buyerRequirements);
    explanations.push('Compares adjacent packages in the supplied order. Flags missing explicitly repeated scope and unexplained higher prices; packages may intentionally be alternatives. Currency codes are labels, not verified exchange rates.');
    recommendations.push('State exclusions, revision boundaries, buyer prerequisites and acceptance criteria.','Explain tier differences and confirm that price covers actual costs. This checker does not estimate demand or recommend a market price.');
    limitations.push('No Fiverr account/API or live platform policy validation is used. These are general offer checks, not platform approval.');
  } else if(id==='client-brief-planner') {
    const deliverables=lines(input.deliverables,'Deliverables'),questions=lines(input.questions,'Unanswered questions');
    add('Proposal and scope outline — template',`Objective (supplied): ${input.objective}\nDeliverables to confirm:\n${deliverables.map(x=>'- '+x+' — [acceptance criterion and owner]').join('\n')}\nConstraints and exclusions (supplied): ${input.constraints}\nEvidence (supplied, unverified): ${input.evidence}\n[Agree schedule, price/currency, milestones, dependencies, revision limits and change approval.]`);
    add('Discovery checklist',questions.map(x=>'- '+x).join('\n'));
    explanations.push('Organizes your supplied statements into a proposal structure without inferring agreement, price, credentials or delivery dates.');
    recommendations.push('Resolve the listed questions with the client and record agreement before delivery.','Review the scope and commercial terms; this template is not a legal contract or legal advice.');
  } else if(id==='content-outline') {
    const structure={post:['Opening observation','Evidence and context','Practical takeaway','Call to action'],article:['Reader question','Context and evidence','Steps and tradeoffs','Limitations','Next action'],email:['Subject','Reason for writing','Relevant evidence','Request'], 'case-study':['Context','Agreed problem','Work performed','Observed result with source and date','Limitations','Next action']}[input.format];
    add('Editorial brief',`Topic: ${input.topic}\nAudience: ${input.audience}\nRequested tone: ${input.tone}\nFormat: ${input.format}`);
    add('Outline — template',structure.map((section,i)=>`${i+1}. ${section}: [write and review]`).join('\n'));
    add('Source facts to review',input.evidence);add('Call to action (supplied)',input.callToAction);
    explanations.push('Selects a format-specific outline and records your editorial preferences. Tone is a writing instruction; this tool does not rewrite prose or translate text.');
    recommendations.push('Use only facts supported by your source; leave outcomes blank until you have observations.','Review consent, names, numbers, links and platform requirements before publishing.');
  } else return null;
  return {values,explanations,recommendations,limitations,evidence,provenance:{kind:'rules-on-user-input',liveData:false,aiGenerated:false}};
}
