import test from 'node:test';
import assert from 'node:assert/strict';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

for (const environment of ['preview','production']) test(`${environment} public SEO routes and private-data crawl boundaries`,async()=>{
  const origin=environment==='production'?'https://elancebot.com':'https://preview.test';
  const mf=new Miniflare(convertV4MiniflareOptions({name:'seo-'+environment,modules:true,scriptPath:'dist/worker.js',compatibilityDate:'2026-10-13',compatibilityFlags:['nodejs_compat'],bindings:{ENVIRONMENT:environment,PUBLIC_ORIGIN:origin,URL_ALLOWED_HOSTS:''}}));
  try {
    for(const path of ['/','/toolkit.html','/experiments.html']) {
      const response=await mf.dispatchFetch(origin+path),html=await response.text();
      assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-cache');
      assert.equal(response.headers.get('x-robots-tag'),environment==='preview'?'noindex, nofollow':null);
      assert.ok(html.includes(`rel="canonical" href="${origin}${path}"`));assert.match(html,/<html lang="en"/);assert.match(html,/<meta name="description" content="[^"]{70,180}"/);
      assert.equal((html.match(/<h1[\s>]/g)||[]).length,1);
      const json=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];assert.equal(JSON.parse(json)['@context'],'https://schema.org');
      assert.match(response.headers.get('content-security-policy'),/object-src 'none'/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
      assert.ok(!response.headers.has('access-control-allow-origin'));
    }
    const robots=await (await mf.dispatchFetch(origin+'/robots.txt')).text();
    if(environment==='production') {assert.match(robots,/Disallow: \/api\//);assert.ok(robots.includes('Sitemap: https://elancebot.com/sitemap.xml'));} else assert.equal(robots,'User-agent: *\nDisallow: /\n');
    const sitemap=await (await mf.dispatchFetch(origin+'/sitemap.xml')).text();assert.ok(sitemap.includes(origin+'/toolkit.html'));assert.ok(sitemap.includes(origin+'/experiments.html'));assert.doesNotMatch(sitemap,/#app|\/api\/|\/privacy/);
    const api=await mf.dispatchFetch(origin+'/api/v1/tool-runs');assert.equal(api.status,401);assert.equal(api.headers.get('cache-control'),'no-store');assert.equal(api.headers.get('x-robots-tag'),'noindex, nofollow');
    assert.equal((await mf.dispatchFetch(origin+'/unlisted-page')).status,404);
  } finally {await mf.dispose();}
});
