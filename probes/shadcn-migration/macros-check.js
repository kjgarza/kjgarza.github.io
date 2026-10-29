// Probe 4: macros reproduce the class sets of the hand-copied markup
const nunjucks = require('nunjucks');
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(__dirname), { autoescape: false });
const B = 'before:block: before:rounded-lg before:absolute before:top-0 before:bottom-0 before:right-0 before:left-0 inline-flex gap-3 relative items-center justify-center whitespace-nowrap rounded-lg text-base font-medium ring-offset-white disabled:pointer-events-none disabled:bg-neutral-100 disabled:text-neutral-500 disabled:shadow-none active:transform active:scale-[99%] active:transition-transform active:duration-75 active:ease-in-out hover:cursor-pointer';
const cases = [
  [`{% call ui.button("secondary", href="/x", class="w-fit mt-2") %}Read case study{% endcall %}`, `${B} w-fit hover:before:bg-special-state-hover bg-white text-neutral-900 shadow-button-secondary-rest active:shadow-none h-10 px-3 min-w-9 mt-2`],
  [`{% call ui.button("primary", class="w-fit") %}Get in touch{% endcall %}`, `${B} w-fit hover:before:bg-special-state-hover-inverse bg-button-primary text-white shadow-button-primary-rest active:shadow-none h-10 px-3 min-w-9`],
  [`{% call ui.button("primary", class="mt-6 w-full") %}Submit{% endcall %}`, `${B} hover:before:bg-special-state-hover-inverse bg-button-primary text-white shadow-button-primary-rest active:shadow-none h-10 px-3 min-w-9 mt-6 w-full`],
  [`{% call ui.button("ghost", "icon") %}<svg/>{% endcall %}`, `${B} text-neutral-900 hover:before:bg-special-state-hover h-10 w-10`],
  [`{{ bd.badge("APIs") }}`, 'inline-flex items-center rounded-full border-2 px-2 py-1 w-fit h-fit text-xs font-bold transition-colors border-neutral-300 bg-white text-primary'],
  [`{{ bd.badge("DOI", "blue") }}`, 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium border-blue-200 bg-blue-50 text-blue-700'],
];
// Typos in the old string that do nothing: "before:block:" (trailing colon), "active:transform" (no-op in v4).
// The macro uses the intended "before:block"/"before:inset-0", so compare after normalising those.
const norm = s => new Set(s.split(/\s+/).filter(Boolean).map(c => c === 'before:block:' ? 'before:block' : c)
  .filter(c => c !== 'active:transform').flatMap(c => c === 'before:inset-0' ? ['before:top-0', 'before:bottom-0', 'before:right-0', 'before:left-0'] : [c]));
let ok = 0;
for (const [tpl, want] of cases) {
  const html = env.renderString(`{% import "ui/button.njk" as ui %}{% import "ui/badge.njk" as bd %}${tpl}`);
  const got = norm(html.match(/class="([^"]*)"/)[1]), exp = norm(want);
  const extra = [...got].filter(c => !exp.has(c)), miss = [...exp].filter(c => !got.has(c));
  const pass = !extra.length && !miss.length; ok += pass;
  console.log(pass ? 'PASS' : 'FAIL', tpl.slice(0, 60), pass ? '' : JSON.stringify({ extra, miss }));
}
console.log(`${ok}/${cases.length}`); process.exit(ok === cases.length ? 0 : 1);
