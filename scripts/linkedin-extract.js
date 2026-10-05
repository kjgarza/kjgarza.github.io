// Logged-in LinkedIn job-search extraction for linkedin-query-optimizer.py --results.
// Three snippets, run with claude-in-chrome javascript_tool in ONE dedicated tab:
//
//   RESET   once, before the first search
//   COLLECT on each search page, after navigate + ~4s wait (appends one row)
//   DUMP    once at the end; returns {rows, jobs} to write to disk, then convert with
//           to-results (see bottom) into the JSONL the optimiser reads
//
// Why it's shaped like this (all learned 2026-10-05):
// - Rows accumulate in window.name: it survives same-origin navigations; LinkedIn wipes
//   unknown localStorage keys on load, so localStorage silently lost a full run.
// - Synchronous only: an async scroll loop froze a background tab (timers throttled).
// - Only ~7 cards render until the list is visibly scrolled, but every card's job id is in
//   the DOM; the optimiser backfills missing titles from the public posting endpoint.
// - Tool output truncates any single line past ~1000 chars and blocks text that looks like
//   key=value query strings, so DUMP returns an object of short strings, no "=" or "&".
// - Logged-in booleans are strict and the header states an exact total. A search with no
//   matches shows "Jobs you may be interested in" instead — recorded as empty.

// RESET
window.name = 'LQO\n'; 'reset';

// COLLECT
(() => {
  const t = [...document.querySelectorAll('div,span,small,p')]
    .find(e => e.children.length < 3 && /^\s*[\d,]+\+?\s+results?\s*$/i.test(e.innerText || ''));
  const total = t ? +t.innerText.replace(/[^\d]/g, '') : null;
  const empty = total === null && /Jobs you may be interested in/i.test(document.querySelector('main')?.innerText || '');
  const u = new URL(location.href);
  const j = empty ? [] : [...document.querySelectorAll('li[data-occludable-job-id]')].map(li => {
    const L = li.innerText.split('\n').map(s => s.trim()).filter(Boolean).filter((s, i, a) => s !== a[i - 1]);
    const p = r => L.find(s => r.test(s));
    const c = { i: li.dataset.occludableJobId };
    if (L[0]) {
      Object.assign(c, { title: L[0], company: L[1], location: L[2] });
      const m = { salary: p(/^[^a-z]*[$€£]|EUR|USD|GBP|\/yr|\/month|\/hr/), network: p(/works? here/), posted: p(/\bago\b|^Reposted/) };
      for (const k in m) if (m[k]) c[k] = m[k];
      if (p(/Actively reviewing/i)) c.actively_reviewing = 1;
      if (p(/^Easy Apply$/)) c.easy_apply = 1;
      if (p(/^Viewed$/)) c.viewed = 1;
      if (p(/^Applied$/)) c.applied = 1;
    }
    return c;
  });
  window.name += JSON.stringify({ k: u.searchParams.get('keywords'), l: u.searchParams.get('location'),
    s: u.searchParams.get('start') || '0', t: empty ? 0 : total, e: empty,
    cr: /retiring classic job search/i.test(document.body.innerText), j }) + '\n';
  return `${total} total, ${j.length} ids, ${j.filter(x => x.title).length} rendered`;
})();

// DUMP — rows: "row ; start ; total ; empty ; classic_retiring ; id,id,…" in collection order
//        jobs: "id | title | company | location | salary | network | posted | flags(R/E/V/A)"
(() => {
  const R = window.name.split('\n').slice(1).filter(Boolean).map(r => JSON.parse(r));
  const m = {};
  R.forEach(r => r.j.forEach(x => { if (x.title && !m[x.i]) m[x.i] = x; }));
  const clean = s => (s || '').replace(/\|/g, '-');
  return {
    rows: R.map((r, i) => [i, r.s, r.t, r.e ? 1 : 0, r.cr ? 1 : 0, r.j.map(x => x.i).join(',')].join(' ; ')),
    jobs: Object.values(m).map(x => [x.i, clean(x.title), clean(x.company), clean(x.location), clean(x.salary),
      x.network || '', x.posted || '', (x.actively_reviewing ? 'R' : '') + (x.easy_apply ? 'E' : '') +
      (x.viewed ? 'V' : '') + (x.applied ? 'A' : '')].join(' | ')),
  };
})();

// Then write DUMP's rows to rows.txt and jobs to jobs.txt (one string per line) and run
//   scripts/linkedin-query-optimizer.py <seed> --rows rows.txt --jobs jobs.txt --plan plan.json
// Visit the plan URLs in plan order (empty searches too); add &start=25 pages right after
// their first page. Rows are matched to plan entries by that order.
