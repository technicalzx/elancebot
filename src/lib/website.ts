import { fail, readBounded, safeUrl } from './security.mjs';
import { auditUrlMetadata } from './scoring.mjs';

export async function analyzeWebsite(value: string, allowedHosts: string, ownPage?: Response) {
  const url = safeUrl(value, allowedHosts);
  let response: Response;
  try {
    response = ownPage || await fetch(url.href, { redirect: 'manual', signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Elancebot/0.1 (+https://github.com/ycgiio/elancebot)', Accept: 'text/html' } });
  } catch { fail(502, 'fetch_failed', 'The website did not respond within eight seconds.'); }
  if (!response!.ok) { await response!.body?.cancel(); fail(422, 'website_status', 'The website must return a direct successful page (redirects are not followed).'); }
  if (!response!.headers.get('content-type')?.includes('text/html')) { await response!.body?.cancel(); fail(422, 'html_required', 'The URL must return an HTML page.'); }
  const html = new TextDecoder().decode(await readBounded(response!.body, 512_000));
  const metadata = { title: '', description: '', h1: '', canonical: '', lang: '', robots: response!.headers.get('x-robots-tag') || '', hasViewport: false, hasStructuredData: false };
  const append = (key: 'title' | 'h1') => ({ text(t: Text) { metadata[key] = (metadata[key] + t.text).slice(0, 1000); } });
  await new HTMLRewriter()
    .on('title', append('title')).on('h1', append('h1'))
    .on('html', { element(e) { metadata.lang = e.getAttribute('lang') || ''; } })
    .on('meta', { element(e) {
      const name = e.getAttribute('name')?.toLowerCase();
      if (name === 'description') metadata.description = (e.getAttribute('content') || '').slice(0, 1000);
      if (name === 'robots') metadata.robots += ' ' + (e.getAttribute('content') || '');
      if (name === 'viewport') metadata.hasViewport = true;
    } })
    .on('link', { element(e) { if (e.getAttribute('rel')?.toLowerCase() === 'canonical') metadata.canonical = (e.getAttribute('href') || '').slice(0, 2048); } })
    .on('script', { element(e) { if (e.getAttribute('type') === 'application/ld+json') metadata.hasStructuredData = true; } })
    .transform(new Response(html)).text();
  const result = auditUrlMetadata(metadata);
  if (ownPage) result.dataProvenance.source = 'Rendered HTML of this deployment (self-review; no outbound fetch)';
  return { ...result, metadata, fetchedUrl: url.href, fetchedAt: new Date().toISOString(), retrieval: ownPage ? 'local-rendered-html' : 'https-fetch' };
}
