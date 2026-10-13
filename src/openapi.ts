export function openapi(origin: string) {
  const string = { type: 'string' };
  const object = { type: 'object', additionalProperties: true };
  const success = { description: 'Successful JSON response', content: { 'application/json': { schema: object } } };
  const error = { description: 'Request rejected', content: { 'application/json': { schema: { type: 'object', properties: { error: { type: 'object', required: ['code','message'], properties: { code: string, message: string, requestId: string } } } } } } };
  const pathId = (name: string) => ({ name, in: 'path', required: true, schema: string });
  const request = (properties: object, required: string[] = []) => ({ required: true, content: { 'application/json': { schema: { type: 'object', properties, required } } } });
  const op = (summary: string, requestBody?: object, publicEndpoint = false, created = false) => ({ summary, security: publicEndpoint ? [] : [{ bearerAuth: [] }, { cookieAuth: [] }], ...(requestBody ? { requestBody } : {}), responses: { [created ? '201' : '200']: success, '400': error, '401': error, '403': error, '404': error, '409': error, '413': error, '415': error, '429': error, '500': error } });
  const input = { type: 'object', description: 'Content snapshot. Fields: headline, overview, services, skills, keywords, portfolio, testimonials, location, profileUrl; competitor contains an equivalent snapshot. Website projects: url, attested.', additionalProperties: true };
  return {
    openapi: '3.1.0', info: { title: 'Elancebot API', version: '0.1.0', description: 'Private project and audit API. Read keys allow reads; write keys allow reads and project/audit changes. Key/account administration is session-only. Keys expire after 30 days. No live marketplace rankings. Same-origin browser requests only; server clients use bearer keys. Limits: 180 requests/minute/account, 60 saved analyses/hour/account, 10 standalone URL checks/hour, 50 projects, 50 revisions/project. Auth rate-limited per IP and email. Maximum JSON body: 48,000 bytes.' },
    servers: [{ url: origin + '/api/v1' }],
    components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', description: 'eb_ API key created in your workspace' }, cookieAuth: { type: 'apiKey', in: 'cookie', name: '__Host-elancebot' } } },
    paths: {
      '/health': { get: op('Health and release version', undefined, true) },
      '/tools': { get: op('Capabilities and approved website hosts', undefined, true) },
      '/openapi': { get: op('This OpenAPI document', undefined, true) },
      '/auth/register': { post: op('Register; returns session cookie and one-time offline recovery code. Email is not verified.', request({ name: string, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 15, maxLength: 128 } }, ['name','email','password']), true) },
      '/auth/login': { post: op('Sign in', request({ email: string, password: string }, ['email','password']), true) },
      '/auth/recover': { post: op('Consume recovery code; rotate code, revoke all sessions/keys and set a new password', request({ email: string, password: string, recoveryCode: string }, ['email','password','recoveryCode']), true) },
      '/auth/logout': { post: op('Revoke current browser session') },
      '/auth/session': { get: op('Current user') },
      '/dashboard': { get: op('Projects and aggregate counts') },
      '/search': { get: { ...op('Search project names'), parameters: [{ name: 'q', in: 'query', schema: string }] } },
      '/projects': { get: op('List own projects'), post: op('Create a project', request({ name: string, kind: { type: 'string', enum: ['profile','gig','service','competitor','website'] }, input }, ['name','kind']), false, true) },
      '/projects/{id}': { parameters: [pathId('id')], get: op('Project and revision history'), patch: op('Update project input before another review', request({ name: string, input })), delete: op('Permanently delete a project and its reviews') },
      '/projects/{id}/analyses': { parameters: [pathId('id')], get: op('Review history'), post: op('Run a deterministic review from saved project input', undefined, false, true) },
      '/url/analyze': { post: op('Review HTML metadata on an approved owned domain; no redirects, queries, scripts or marketplace scraping', request({ url: { type: 'string', format: 'uri' }, attested: { const: true }, projectId: string }, ['url','attested'])) },
      '/api-keys': { get: op('List active key metadata (session-only)'), post: op('Create a 30-day key; secret shown once (session-only)', request({ name: string, scope: { type: 'string', enum: ['read','write'] } }, ['name','scope']), false, true) },
      '/api-keys/{id}': { parameters: [pathId('id')], delete: op('Revoke a key immediately (session-only)') },
      '/account/export': { get: op('Export own account, project inputs and reviews as JSON (session-only; no credentials)') },
      '/account': { delete: op('Delete account and all live workspace data (session-only)', request({ confirm: { const: 'DELETE' }, password: string }, ['confirm','password'])) }
    }
  };
}
