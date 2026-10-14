// URL-led review UI. Shared helpers and authenticated API come from app.js.
function insightForm(project) {
  const p=project?.input||{}, ai=capabilities.urlInsights?.aiEnabled;
  return header(project?'Improve your offer draft':'Analyze an offer by URL','Understand the evidence, compare a competitor, and turn gaps into a better draft.')+`
    <div class="insight-intro card analysis-section"><h2>URL → evidence → comparison → improvements</h2><p>Approved websites can be read directly. Fiverr, Upwork and LinkedIn URLs need an authorized content snapshot until approved connectors are available. A URL is never treated as proof that its contents were fetched.</p></div>
    <form id="insight-form" data-id="${project?.id||''}" class="card form-card">
      <div class="form-grid">
        ${field('name','Review name',project?.name||'',{max:100,full:true})}
        ${field('url','Your gig, profile or service URL',p.url||'',{type:'url',required:true,max:2048,full:true,help:'Use the exact HTTPS page without tracking parameters. Approved fetch hosts: '+(capabilities.allowedUrlHosts?.join(', ')||'none configured')})}
        ${field('specialty','Service / specialty you want to sell',p.specialty||'',{required:true,max:160})}
        ${field('audience','Target client / audience',p.audience||'',{max:160})}
        ${field('keywords','Target search phrases',p.keywords||'',{max:600,full:true,help:'Up to 10 phrases separated by commas. These are your targets—not measured search demand.'})}
      </div>
      <details ${p.sourceText?'open':''}><summary>Your authorized source text (required for marketplace URLs)</summary>
        <p>Paste your title, description/About, packages, scope, samples, FAQs and relevant proof. Leave empty only to fetch an approved website. Editing this snapshot creates a supplied draft revision, not a live platform update.</p>
        ${field('sourceText','Your page content',p.sourceText||'',{area:true,rows:10,max:8000,full:true,help:'100–8,000 characters when supplied. No credentials or confidential client data.'})}
      </details>
      <h2>Compare an optional competitor</h2>
      ${field('competitorUrl','Competitor URL',p.competitorUrl||'',{type:'url',max:2048,full:true})}
      <details ${p.competitorText?'open':''}><summary>Competitor content snapshot</summary>
        <p>Use content you are permitted to analyze. Include comparable sections and keep its achievements separate from yours.</p>
        ${field('competitorText','Competitor page content',p.competitorText||'',{area:true,rows:7,max:8000,full:true})}
      </details>
      <div class="form-check"><input type="checkbox" id="insight-attested" name="attested" required><label for="insight-attested">I am authorized to analyze these sources and store the review in my private workspace.</label></div>
      <div class="form-check"><input type="checkbox" id="insight-ai" name="useAi" ${ai?'':'disabled'}><label for="insight-ai">Generate AI improvement drafts. I consent to sending these source snapshots and context to Cloudflare Workers AI.</label></div>
      <p class="field-helper">${ai?'Preview AI: at most 3 requests per account and 10 across this app per UTC day. Check every generated claim before publishing.':'AI inference is not enabled. This run provides evidence-based observations and a draft outline, not an AI rewrite.'} No live ranking or earnings provider is connected.</p>
      <p class="field-error" role="alert" hidden></p><div class="form-actions"><button class="button button-primary" type="submit">Analyze sources & save review</button><a class="button button-secondary" href="#app/projects">Saved reviews</a></div>
    </form>`;
}

function insightResultHtml(analysis,previous) {
  const r=analysis.result,other=r.sources.find(s=>s.role==='competitor');
  const comparable=previous?.result.analysisType==='url-insights' && previous.result.auditVersion===r.auditVersion && JSON.stringify(previous.result.context.keywords)===JSON.stringify(r.context.keywords);
  const diff=comparable?r.score-previous.result.score:null;
  return `<section class="card analysis-section insight-summary"><p class="eyebrow">URL-LED OFFER INTELLIGENCE</p><h2>${escape(r.context.specialty)}</h2><p>${escape(r.platformNote)}</p><p><strong>${r.score}/100 observed content coverage</strong>${diff===null?'':` · ${diff>=0?'+':''}${diff} versus preceding URL review`}. This summarizes detectable text signals, not quality, search position or earning potential.</p><small>Rules: ${escape(r.auditVersion)}${previous&&!comparable?' · Score change is not shown because the rules, target phrases or review type changed.':''}</small></section>
    <section class="card analysis-section"><h2>Where this review came from</h2><div class="insight-sources">${r.sources.map(s=>`<article><h3>${s.role==='own'?'Your offer':'Competitor'} · ${escape(s.platform)}</h3><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.url)}</a><p>${escape(s.retrieval)} · recorded ${escape(new Date(s.capturedAt).toLocaleString())}</p><details><summary>Inspect the exact source snapshot</summary><pre>${escape(s.text)}</pre>${s.metadata?`<h4>Page metadata</h4><pre>${escape(JSON.stringify(s.metadata,null,2))}</pre>`:''}</details></article>`).join('')}</div></section>
    <section class="card analysis-section"><h2>${other?'What differs between the offers':'What a buyer can find in the available text'}</h2><p>“Not observed” can mean a missing section in the snapshot. A detected phrase is not verification of the underlying claim.</p><div class="table-scroll"><table><thead><tr><th>Buyer question</th><th>Your evidence</th>${other?'<th>Competitor evidence</th>':''}</tr></thead><tbody>${r.observations.map(o=>`<tr><th>${escape(o.label)}</th><td>${o.observed?escape(o.evidence):'Not observed'}</td>${other?`<td>${o.competitorObserved?escape(o.competitorEvidence):'Not observed'}</td>`:''}</tr>`).join('')}</tbody></table></div></section>
    <section class="card analysis-section"><h2>Search-phrase opportunities</h2><p>Exact phrase counts in these snapshots—not search volume, keyword difficulty or marketplace rank. Relevance matters more than repetition.</p>${r.keywords.length?`<div class="table-scroll"><table><thead><tr><th>Your target phrase</th><th>Your mentions</th>${other?'<th>Competitor mentions</th>':''}</tr></thead><tbody>${r.keywords.map(k=>`<tr><th>${escape(k.phrase)}</th><td>${k.ownCount}</td>${other?`<td>${k.competitorCount}</td>`:''}</tr>`).join('')}</tbody></table></div>`:'<p>Add target phrases when you improve this draft to compare coverage.</p>'}</section>
    <section class="card analysis-section"><h2>Your next improvements</h2><div class="recommendation-list">${r.actions.map((a,i)=>`<article class="recommendation-item"><span>${i+1}</span><div><strong>${escape(a.title)} · ${escape(a.priority)}</strong><p>${escape(a.action)}</p><p>${escape(a.rationale)}</p><small>${escape(a.evidence)}</small></div></article>`).join('')}</div></section>
    <section class="card analysis-section"><h2>${r.ai?'AI improvement draft — review before using':'Draft structure to work from'}</h2>${r.ai?`<p>${escape(r.ai.disclaimer)}</p><h3>Suggested headline</h3><p>${escape(r.ai.headline)}</p><h3>Suggested description</h3><pre>${escape(r.ai.description)}</pre><h3>Evidence-grounded recommendations</h3>${r.ai.recommendations.map(a=>`<blockquote><p>${escape(a.quote)}</p><small>${escape(a.source)} snapshot</small></blockquote><p>${escape(a.action)}</p>`).join('')}<p>Model: ${escape(r.ai.model)}</p>`:`${r.aiError?`<p class="field-error">${escape(r.aiError)}</p>`:''}<p>${escape(r.draftFramework.note)}</p><h3>${escape(r.draftFramework.headline)}</h3><ol>${r.draftFramework.sections.map(s=>`<li>${escape(s)}</li>`).join('')}</ol>`}<a class="button button-primary" href="#app/improve/${analysis.project_id}">Edit source draft & compare again</a></section>
    <section class="card analysis-section"><h2>What this cannot tell you yet</h2><ul>${r.limitations.map(s=>`<li>${escape(s)}</li>`).join('')}</ul></section>`;
}
