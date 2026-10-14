import { fail } from './security.mjs';

export function referenceUrl(value) {
  let url;
  try { url = new URL(value); } catch { fail(400,'invalid_url','Enter a complete HTTPS source URL.'); }
  if(url.protocol!=='https:' || url.username || url.password || url.port || url.search || url.hash || url.href.length>2048 || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) || /(^|\.)(localhost|local|internal|test|invalid)$/.test(url.hostname)) fail(400,'unsafe_url','Use a public HTTPS URL without credentials, a custom port, query or fragment.');
  return url;
}
export function sourcePlatform(value) {
  const h=referenceUrl(value).hostname;
  for(const [domain,label] of [['fiverr.com','Fiverr'],['upwork.com','Upwork'],['linkedin.com','LinkedIn']]) if(h===domain || h.endsWith('.'+domain)) return label;
  return 'Website';
}
export function sourceText(value) {
  if(typeof value!=='string' || value.trim().length<100 || value.length>8000) fail(400,'source_required','Provide 100–8,000 characters of authorized page content, including the headline, offer details and evidence.');
  return value.trim();
}
export function insightContext(body) {
  const read=(key,max)=>{ const value=body[key] ?? ''; if(typeof value!=='string' || value.length>max) fail(400,'invalid_input',`${key} must be text up to ${max} characters.`); return value.trim(); };
  const specialty=read('specialty',160),audience=read('audience',160);
  if(!specialty) fail(400,'specialty_required','Describe the service or specialty you want to sell.');
  const keywords=[...new Set(read('keywords',600).split(/[,\n]/).map(x=>x.trim()).filter(Boolean))];
  if(keywords.length>10 || keywords.some(x=>x.length>80)) fail(400,'invalid_keywords','Use at most 10 search phrases, each up to 80 characters.');
  return {specialty,audience,keywords};
}
const normalize=s=>s.normalize('NFKC').toLowerCase();
function occurrences(text,phrase) {
  const t=normalize(text), p=normalize(phrase); let start=0,count=0;
  while(p && (start=t.indexOf(p,start))!==-1) { const before=t[start-1]||' ',after=t[start+p.length]||' '; if(!/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after)) count++; start+=p.length; }
  return count;
}
function evidence(text,pattern) {
  const lines=text.split(/\n|(?<=[.!?])\s+/).filter(Boolean);
  return lines.find(line=>pattern.test(line))?.slice(0,300) || null;
}
const dimensions=[
  {id:'deliverables',label:'Deliverables and scope',pattern:/\b(deliver|include|provide|build|design|write|create|develop|package|scope)\b/i,action:'List the concrete deliverables, file formats and exclusions so buyers can compare scope.',why:'Unclear scope can make an otherwise relevant offer harder to evaluate.'},
  {id:'proof',label:'Work samples and proof',pattern:/\b(portfolio|case study|case studies|sample|testimonial|certified|certification|experience|project)\b/i,action:'Add one relevant work sample or case study with your exact role and a substantiated outcome.',why:'Evidence helps a buyer assess risk. A proof-related word alone does not verify a claim.'},
  {id:'process',label:'Delivery process and boundaries',pattern:/\b(revisions?|turnaround|deadline|milestones?|process|days|weeks)\b/i,action:'Explain the process, delivery time, revision boundary and what you need from the buyer.',why:'Clear expectations can reduce uncertainty before a buyer contacts you.'},
  {id:'commercial',label:'Commercial terms',pattern:/[$€£₹]\s*\d|\b(USD|PKR)\s*\d|\b(price|pricing|hourly|budget|quote|rate)\b/i,action:'Make the pricing basis and package differences understandable without changing your rate blindly.',why:'Price without comparable scope is not a useful competitive benchmark.'},
  {id:'next-step',label:'Buyer next step',pattern:/\b(contact|message|book|request|discuss|order|schedule|get in touch|send)\b/i,action:'End with one platform-appropriate next step, such as sending a brief before placing an order.',why:'A specific next step helps an interested buyer know how to proceed.'}
];

export function analyzeOffer(own,competitor,context) {
  const source=own.text;
  const observations=dimensions.map(d=>{ const ownEvidence=evidence(source,d.pattern),other=competitor?evidence(competitor.text,d.pattern):null; return {id:d.id,label:d.label,observed:Boolean(ownEvidence),evidence:ownEvidence,competitorObserved:competitor?Boolean(other):null,competitorEvidence:other,action:d.action,why:d.why}; });
  const keywords=context.keywords.map(phrase=>({phrase,ownCount:occurrences(source,phrase),competitorCount:competitor?occurrences(competitor.text,phrase):null}));
  const gaps=keywords.filter(k=>!k.ownCount && k.competitorCount>0).map(k=>k.phrase);
  const coverage=keywords.length ? keywords.filter(k=>k.ownCount>0).length/keywords.length : null;
  const score=Math.round((observations.filter(o=>o.observed).length+(coverage??0))/(dimensions.length+(coverage===null?0:1))*100);
  const actions=observations.filter(o=>!o.observed).map(o=>({priority:o.competitorObserved?'High':'Medium',title:o.label,action:o.action,rationale:o.why,evidence:o.competitorObserved?`Competitor snapshot includes: ${o.competitorEvidence}`:'Not observed in the supplied/extracted text; check the complete page before treating it as missing.'}));
  if(keywords.some(k=>!k.ownCount)) actions.unshift({priority:'High',title:'Review search-phrase relevance',action:`Consider these missing phrases only if they accurately describe your service: ${keywords.filter(k=>!k.ownCount).map(k=>k.phrase).join(', ')}. Use natural language; do not repeat keywords to chase this checklist.`,rationale:'This compares your chosen phrases with the available text; it does not measure search demand or ranking.',evidence:gaps.length?`Present in the competitor snapshot but not yours: ${gaps.join(', ')}.`:'No search-volume or ranking provider is connected.'});
  actions.push({priority:'Review',title:'Test one meaningful change',action:'Record a baseline period, change one element, and compare equivalent periods using authorized impressions, clicks, inquiries and orders. Keep price, promotion and seasonality in mind.',rationale:'A higher content-checklist score is not evidence of increased earnings.',evidence:'Business outcomes have not been measured by this assessment.'});
  const platformNotes={Fiverr:'Review title, description, relevant tags, packages, FAQs and buyer requirements together. Keep transactions and communications within applicable platform rules.',Upwork:'Align your title, overview and portfolio with the jobs you actually target. Proposal fit needs the specific job brief, not only a profile URL.',LinkedIn:'Align headline, About and experience with your specialty, audience and verifiable examples. Profile relevance is not a measured search position.',Website:'Review the visible service proposition, evidence, process, pricing basis and conversion path alongside technical metadata.'};
  return {analysisType:'url-insights',auditVersion:'url-insights-1.0.1',score,scoreLabel:'Observed content coverage—not a ranking',context,sources:[own,...(competitor?[competitor]:[])],observations,keywords,keywordGaps:gaps,actions,platformNote:platformNotes[own.platform],draftFramework:{headline:`${context.specialty}${context.audience?' for '+context.audience:''}`,sections:['Open with the buyer problem and your actual service.','Specify deliverables, scope, timing and revision limits.','Insert a real case study or work sample; do not invent results.','Explain package/pricing differences.','Close with one permitted next step.'],note:'User-context-based outline, not an AI rewrite. Fill only with facts you can substantiate.'},ai:null,limitations:['Only the available text is evaluated; images, hidden/interactive sections and missing exports may change the interpretation.','Proof/price/process observations are text signals, not verification of quality or factual claims.','Competitor snapshots may differ in completeness and timing. This is not a live market benchmark.','No actual search position, traffic, demand, conversions or earnings are measured. Improvements cannot guarantee rankings or revenue.']};
}

export const improvementSchema={type:'object',properties:{headline:{type:'string'},description:{type:'string'},recommendations:{type:'array',items:{type:'object',properties:{source:{type:'string',enum:['own','competitor']},quote:{type:'string'},action:{type:'string'}},required:['source','quote','action'],additionalProperties:false}}},required:['headline','description','recommendations'],additionalProperties:false};
export function validateImprovements(raw,own,competitor) {
  let data=raw;
  if(typeof data==='string') {try {data=JSON.parse(data);} catch {fail(502,'ai_invalid','The model returned an invalid draft. Your source review remains available.');}}
  const bounded=(v,max)=>typeof v==='string' && v.trim().length>0 && v.length<=max;
  if(!data || !bounded(data.headline,200) || !bounded(data.description,3000) || !Array.isArray(data.recommendations) || data.recommendations.length<1 || data.recommendations.length>5) fail(502,'ai_invalid','The model did not return a usable bounded draft.');
  for(const r of data.recommendations) {const text=r?.source==='own'?own.text:r?.source==='competitor'?competitor?.text:null; if(!text || !bounded(r.quote,300) || r.quote.trim().length<10 || !text.includes(r.quote) || !bounded(r.action,700)) fail(502,'ai_ungrounded','The model cited evidence that was not in the source. The draft was rejected.');}
  return {headline:data.headline,description:data.description,recommendations:data.recommendations.map(r=>({source:r.source,quote:r.quote,action:r.action})),disclaimer:'AI-generated suggestions. Evidence quotes are checked against the snapshots, but you must verify every claim, number and platform rule before publishing. Nothing is posted automatically.'};
}
