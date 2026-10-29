// Probe 2: screenshot key pages at desktop + mobile; usage: node shots.js <siteDir> <outDir>
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [site, out] = process.argv.slice(2);
const pages = ['/', '/work/', '/tools/', '/publications/', '/playground/', '/work/creating-a-design-system/', '/cv/', '/404.html'];
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const srv = http.createServer((req, res) => {
  let p = path.join(site, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
}).listen(0);
(async () => {
  const port = srv.address().port, b = await chromium.launch();
  fs.mkdirSync(out, { recursive: true });
  for (const [name, vp] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const ctx = await b.newContext({ viewport: vp });
    await ctx.route(/tally\.so|googletagmanager/, r => r.abort());
    const pg = await ctx.newPage();
    for (const u of pages) {
      await pg.goto(`http://localhost:${port}${u}`, { waitUntil: 'load' });
      await pg.evaluate(async () => {
        document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager');
        await Promise.all([...document.images].map(i => (i.complete ? Promise.resolve() : new Promise(r => { i.onload = i.onerror = r; })).then(() => i.decode().catch(() => {}))));
        window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 300)); window.scrollTo(0, 0);
        await document.fonts.ready;
        document.getAnimations().forEach(a => { a.currentTime = 0; a.pause(); });
      });
      const nav = await pg.evaluate(() => {
        const vis = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display !== 'none' : null; };
        return { desktopLinks: vis('#main-nav > div.hidden'), burger: vis('#burger-btn') };
      });
      const file = `${name}${u.replace(/\W+/g, '_')}.png`;
      await pg.screenshot({ path: path.join(out, file), fullPage: true });
      console.log(name, u, JSON.stringify(nav));
    }
    await ctx.close();
  }
  await b.close(); srv.close();
})();
