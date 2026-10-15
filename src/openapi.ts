export function openapi(origin: string) {
  const string = { type: 'string' };
  const object = { type: 'object', additionalProperties: true };
  const success = { description: 'Successful JSON response', content: { 'application/json': { schema: object } } };
  const error = { description: 'Request rejected', content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'object', required: ['code','message'], properties: { code: string, message: string, requestId: string } } } } } } };
  const pathId = (name: string) => ({ name, in: 'path', required: true, schema: string });
  const request = (properties: object, required: string[] = []) => ({ required: true, content: { 'application/json': { schema: { type: 'object', properties, required } } } });
  const op = (summary: string, requestBody?: object, publicEndpoint = false, created: boolean | 'optional' = false) => ({ summary, security: publicEndpoint ? [] : [{ bearerAuth: [] }, { cookieAuth: [] }], ...(requestBody ? { requestBody } : {}), responses: { ...(created !== true ? { '200': success } : {}), ...(created ? { '201': success } : {}), '400': error, '401': error, '403': error, '404': error, '409': error, '413': error, '415': error, '422': error, '429': error, '500': error, '502': error, '503': error } });
  const input = { type: 'object', description: 'Content snapshot. Fields: headline, overview, services, skills, keywords, portfolio, testimonials, location, profileUrl; competitor contains an equivalent snapshot. Website projects: url, attested.', additionalProperties: true };
  return {
    openapi: '3.1.0', info: { title: 'Elancebot API', version: '0.3.0', description: 'Private project, audit and tool API. Read keys allow reads; write keys allow reads and project/audit/tool changes. Key/account administration is session-only. Keys expire after 30 days. No live marketplace rankings. Same-origin browser requests only; server clients use bearer keys. Limits: 180 requests/minute/account, 60 saved analyses/hour/account, 60 calculator/utility runs/hour, 100 saved tool results, 10 standalone URL checks/hour, 50 projects, 50 revisions/project. Auth rate-limited per IP and email. Maximum JSON body: 48,000 bytes.' },
    servers: [{ url: origin + '/api/v1' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', description: 'eb_ API key created in your workspace' }, cookieAuth: { type: 'apiKey', in: 'cookie', name: '__Host-elancebot' } } },
    paths: {
      '/experiments': {get:op('List up to 50 private experiments with manually supplied outcome comparisons'),post:op('Save an immutable experiment plan. Optional projectId must be owned; deleting that project deletes linked experiments. Limit 30 creations/hour.',request({offer:{type:'string',maxLength:160},evidence:{type:'string',maxLength:2000},change:{type:'string',maxLength:2000},metric:{enum:['inquiry-rate','click-rate','order-rate']},periodDays:{type:'integer',minimum:7,maximum:90},source:{type:'string',maxLength:300},confounders:{type:'string',maxLength:2000},projectId:string},['offer','evidence','change','metric','periodDays','source']),false,true)},
      '/experiments/{id}': {parameters:[pathId('id')],get:op('Read own experiment, observations and comparison'),delete:op('Delete own experiment permanently'),patch:op('Replace observations using current version; stale versions return 409. Each period is null or {start,end,outcomes,denominator,source,notes}. ISO date windows are inclusive, equal to planned periodDays, non-overlapping and end before today UTC. Counts are unique conversions, integer 0–1e9, outcomes <= denominator. No causal or ranking inference.',request({version:{type:'integer',minimum:1},baseline:{type:['object','null'],additionalProperties:true},followUp:{type:['object','null'],additionalProperties:true}},['version','baseline','followUp']))},
      '/health': { get: op('Health and release version', undefined, true) },
      '/tools': { get: op('Capabilities, live tool catalog with input schemas, and approved website hosts', undefined, true) },
      '/openapi': { get: op('This OpenAPI document', undefined, true) },
      '/insights': { post:op('URL-led offer and optional competitor review; saves a project/revision. Automatic fetch is exact-approved website hosts only. Marketplace URLs require authorized supplied text. AI is optional, explicitly consented, provider-gated and quota-limited.',request({url:{type:'string',format:'uri'},sourceText:{type:'string',maxLength:8000},competitorUrl:{type:'string',format:'uri'},competitorText:{type:'string',maxLength:8000},specialty:{type:'string',maxLength:160},audience:{type:'string',maxLength:160},keywords:{type:'string',maxLength:600},name:{type:'string',maxLength:100},projectId:string,attested:{const:true},useAi:{type:'boolean',default:false},aiConsent:{type:'boolean'}},['url','specialty','attested']),false,true) },
      '/auth/register': { post: op('Register; returns session cookie and one-time offline recovery code. Email is not verified.', request({ name: string, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 15, maxLength: 128 } }, ['name','email','password']), true) },
      '/auth/login': { post: op('Sign in', request({ email: string, password: string }, ['email','password']), true) },
      '/auth/recover': { post: op('Consume recovery code; rotate code, revoke all sessions/keys and set a new password', request({ email: string, password: string, recoveryCode: string }, ['email','password','recoveryCode']), true) },
      '/auth/logout': { post: op('Revoke current browser session') },
      '/auth/session': { get: op('Current user') },
      '/dashboard': { get: op('Projects and aggregate counts') },
      '/search': { get: { ...op('Search catalog, own project names and own saved tool-result titles'), parameters: [{ name: 'q', in: 'query', schema: {type:'string',maxLength:100} }] } },
      '/tool-state': { get: op('Own favorites and recently opened tool names') },
      '/tool-state/{id}': { parameters:[pathId('id')], patch:op('Set favorite or record tool use; only supported catalog IDs',request({favorite:{type:'boolean'},used:{const:true}})) },
      '/tool-runs': { get:op('Own saved tool results, newest first (maximum 100)'), post:op('Calculate a tool result; save:true persists inputs and versioned result and returns 201, otherwise 200. Input schema is in GET /tools.',request({toolId:string,input:object,save:{type:'boolean',default:false}},['toolId','input']),false,'optional') },
      '/tool-runs/{id}': { parameters:[pathId('id')], get:op('Own saved tool inputs and result'), delete:op('Delete own saved tool result') },
      '/projects': { get: op('List own projects'), post: op('Create a project', request({ name: string, kind: { type: 'string', enum: ['profile','gig','service','competitor','website'] }, input }, ['name','kind']), false, true) },
      '/projects/{id}': { parameters: [pathId('id')], get: op('Project and revision history'), patch: op('Update project input before another review', request({ name: string, input })), delete: op('Permanently delete a project and its reviews') },
      '/projects/{id}/analyses': { parameters: [pathId('id')], get: op('Review history'), post: op('Run a deterministic review from saved project input', undefined, false, true) },
      '/url/analyze': { post: op('Review HTML metadata on an approved owned domain; no redirects, queries, scripts or marketplace scraping', request({ url: { type: 'string', format: 'uri' }, attested: { const: true }, projectId: string }, ['url','attested'])) },
      '/api-keys': { get: op('List active key metadata (session-only)'), post: op('Create a 30-day key; secret shown once (session-only)', request({ name: string, scope: { type: 'string', enum: ['read','write'] } }, ['name','scope']), false, true) },
      '/api-keys/{id}': { parameters: [pathId('id')], delete: op('Revoke a key immediately (session-only)') },
      '/account/export': { get: op('Export own account, project inputs, reviews, tool history and favorites as JSON (session-only; no credentials)') },
      '/account': { delete: op('Delete account and all live workspace data (session-only)', request({ confirm: { const: 'DELETE' }, password: string }, ['confirm','password'])) }
    }
  };
}
