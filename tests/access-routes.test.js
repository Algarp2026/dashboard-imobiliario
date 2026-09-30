const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHmac} = require('node:crypto');
const {pathToFileURL} = require('node:url');

async function main() {
  const root = path.resolve(__dirname, '..');
  const {config, default: middleware} = await import(pathToFileURL(path.join(root, 'middleware.ts')).href);
  const protectedPaths = [
    '/', '/index', '/index.html', '/commercial', '/commercial.html',
    '/commercial.js', '/commercial.css', '/config.js',
    '/comparador', '/comparador.html', '/app.js', '/data.json',
    '/data.xlsx', '/data.xls', '/precos_iniciais_atualizados.json',
    '/google_apps_script.gs'
  ];
  assert.deepEqual(config.matcher, protectedPaths);
  assert.ok(!config.matcher.includes('/access.html'));
  assert.ok(!config.matcher.includes('/Olhao_Ext_Piscina_Web.jpg'));

  process.env.COMMERCIAL_ACCESS_SECRET = 'test-only-session-secret';
  for (const pathname of protectedPaths) {
    const response = await middleware(new Request('https://example.test' + pathname));
    assert.equal(response.status, 303, pathname);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.pathname, '/access.html');
    assert.equal(destination.searchParams.get('next'), pathname);
  }

  const issuedAt = String(Date.now());
  const signature = createHmac('sha256', process.env.COMMERCIAL_ACCESS_SECRET).update(issuedAt).digest('hex');
  const authenticated = new Request('https://example.test/comparador.html', {
    headers: {cookie: `tv_commercial_access=${issuedAt}.${signature}`}
  });
  assert.equal(await middleware(authenticated), undefined);

  const login = fs.readFileSync(path.join(root, 'access.html'), 'utf8');
  assert.doesNotMatch(login, /Comparador público/);
  assert.match(login, /target\.origin === window\.location\.origin/);
  console.log('access route tests passed');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
