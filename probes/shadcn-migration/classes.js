// Probe 1: classes used in built HTML (excluding legacy Next pages) vs selectors defined in the frozen CSS
const fs = require('fs'), path = require('path');
const site = process.argv[2], cssFile = process.argv[3];
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return p.includes('case-studies') || p.includes('_next') ? [] : walk(p);
  return p.endsWith('.html') ? [p] : [];
});
const used = new Map();
for (const f of walk(site)) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/\bclass="([^"]*)"/g))
    for (const c of m[1].split(/\s+/).filter(Boolean)) {
      if (!used.has(c)) used.set(c, new Set());
      used.get(c).add(path.relative(site, f));
    }
  for (const m of html.matchAll(/classList\.(?:add|remove|toggle)\('([^']+)'/g)) used.set(m[1], used.get(m[1]) || new Set(['(js)']));
}
const css = fs.readFileSync(cssFile, 'utf8');
const defined = new Set();
for (const m of css.matchAll(/\.((?:\\.|[\w-])+)/g)) defined.add(m[1].replace(/\\(.)/g, '$1'));
const missing = [...used.keys()].filter(c => !defined.has(c)).sort();
console.log(JSON.stringify({ usedCount: used.size, definedCount: defined.size,
  missing: missing.map(c => [c, [...used.get(c)].slice(0, 3).join(', ')]) }, null, 1));
fs.writeFileSync(process.argv[4], [...used.keys()].sort().join('\n'));
