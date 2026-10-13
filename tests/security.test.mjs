import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, checkPassword, digest, safeUrl, checkOrigin, readJson } from '../src/lib/security.mjs';
test('password hashes are salted and use OWASP scrypt parameters', async () => {
  const pass = 'a very long unique test passphrase'; const one = await hashPassword(pass), two = await hashPassword(pass);
  assert.notEqual(one,two); assert.match(one,/^scrypt:16384:8:5:/); assert.ok(await checkPassword(pass,one)); assert.equal(await checkPassword('wrong',one),false); assert.equal(await checkPassword(pass,null),false);
  await assert.rejects(hashPassword('short')); assert.equal((await digest('key')).length,64);
});
test('URL validation uses exact operator allowlist and blocks alternate schemes/credentials/addresses/platforms', () => {
  for(const value of ['http://example.org/','https://127.0.0.1','https://0x7f000001','https://[::1]','https://foo.local','https://example.org.evil.test','https://a:secret@example.org','https://example.org:8443','https://example.org?q=secret','https://www.upwork.com','https://example.org#x','file:///etc/passwd']) assert.throws(() => safeUrl(value,'example.org,www.upwork.com'));
  assert.equal(safeUrl('https://example.org/path','example.org').href,'https://example.org/path');
});
test('CSRF checks reject cross-site and absent-origin browser mutations', () => {
  assert.throws(() => checkOrigin(new Request('https://site.test/api',{method:'POST',headers:{origin:'https://evil.test'}})));
  assert.throws(() => checkOrigin(new Request('https://site.test/api',{method:'POST',headers:{cookie:'session=test'}})));
  checkOrigin(new Request('https://site.test/api',{method:'POST',headers:{origin:'https://site.test'}}));
});
test('JSON reader enforces type, object and byte limit', async () => {
  const req = body => new Request('https://site.test',{method:'POST',headers:{'content-type':'application/json'},body});
  await assert.rejects(readJson(req('[]'))); await assert.rejects(readJson(req('{'))); await assert.rejects(readJson(req(JSON.stringify({text:'a'.repeat(48000)}))));
  assert.deepEqual(await readJson(req('{"ok":true}')),{ok:true});
});
