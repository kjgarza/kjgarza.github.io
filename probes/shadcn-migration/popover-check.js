// Probe 5: behaviour of the current hand-rolled menu vs a native popover menu
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const serve = root => http.createServer((q, r) => { let p = path.join(root, q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; fs.readFile(p, (e, d) => { r.writeHead(e ? 404 : 200, { 'content-type': p.endsWith('.css') ? 'text/css' : 'text/html' }); r.end(d); }); }).listen(0);
(async () => {
  const b = await chromium.launch();
  for (const [label, root, url] of [['current', process.argv[2], '/'], ['popover', process.argv[3], '/popover.html']]) {
    const srv = serve(root), pg = await b.newPage({ viewport: { width: 390, height: 844 } });
    await pg.route(/tally|googletag/, r => r.abort());
    await pg.goto(`http://localhost:${srv.address().port}${url}`);
    const open = () => pg.evaluate(() => { const m = document.getElementById('mobile-menu'); return m.matches(':popover-open') || getComputedStyle(m).display !== 'none'; });
    const exp = async () => { await pg.waitForTimeout(50); return pg.getAttribute('#burger-btn', 'aria-expanded'); };
    const r = {};
    await pg.click('#burger-btn'); r.opens = await open(); r.ariaOpen = await exp();
    await pg.keyboard.press('Escape'); r.escCloses = !(await open());
    if (await open()) await pg.click('#burger-btn');
    await pg.click('#burger-btn'); await pg.mouse.click(200, 800); r.outsideClickCloses = !(await open());
    if (await open()) await pg.click('#burger-btn');
    await pg.focus('#burger-btn'); await pg.keyboard.press('Enter'); await pg.keyboard.press('Tab');
    r.tabGoesIntoMenu = await pg.evaluate(() => document.getElementById('mobile-menu').contains(document.activeElement));
    r.ariaClosedAfter = await (async () => { await pg.keyboard.press('Escape'); return exp(); })();
    console.log(label, JSON.stringify(r));
    srv.close();
  }
  await b.close();
})();
