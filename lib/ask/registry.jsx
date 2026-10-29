// React components for the /ask/ catalog. They reuse the markup and Tailwind
// classes of the Nunjucks components (work-card.njk, tool-card.njk and the
// button/badge macros in components/ui/) so answers look native.
// Tailwind scans this directory (@source in src/styles/tailwind.css).
// Each one looks its id up in the site data and renders nothing when it's unknown.
import { useMemo } from "react";
import { defineRegistry, JSONUIProvider, Renderer } from "@json-render/react";
import { createAskCatalog } from "./catalog.mjs";

const TALLY_FORM = "3XjAKz";

const BUTTON_BASE =
  "before:block before:rounded-lg before:absolute before:inset-0 inline-flex gap-3 relative items-center justify-center whitespace-nowrap rounded-lg text-base font-medium ring-offset-white disabled:pointer-events-none disabled:bg-neutral-100 disabled:text-neutral-500 disabled:shadow-none active:scale-[99%] active:transition-transform active:duration-75 active:ease-in-out hover:cursor-pointer w-fit";
export const BUTTON_SECONDARY = `${BUTTON_BASE} hover:before:bg-special-state-hover bg-white text-neutral-900 shadow-button-secondary-rest active:shadow-none h-10 px-3 min-w-9`;
export const BUTTON_PRIMARY = `${BUTTON_BASE} hover:before:bg-special-state-hover-inverse bg-button-primary text-white shadow-button-primary-rest active:shadow-none h-10 px-3 min-w-9`;
const TAG = "inline-flex items-center rounded-full px-2 text-xs border-2 py-1 w-fit h-fit font-bold transition-colors border-neutral-300 bg-white text-foreground";
const CARD = "bg-card border-border flex flex-col gap-2 rounded-2xl border-2 p-6";

const byId = (items) => new Map(items.map((i) => [i.id, i]));

export function createAskRegistry(data) {
  const work = byId(data.work);
  const publications = byId(data.publications);
  const tools = byId(data.tools);
  const roles = byId(data.roles);
  const caseStudies = new Map(data.caseStudies.map((cs) => [cs.slug, cs]));

  const { registry } = defineRegistry(createAskCatalog(data), {
    components: {
      Stack: ({ children }) => <div className="flex flex-col gap-6">{children}</div>,

      Answer: ({ props }) => <p className="text-foreground text-lg font-medium">{props.text}</p>,

      WorkCard: ({ props }) => {
        const w = work.get(props.id);
        if (!w) return null;
        return (
          <div className="bg-card hover:border-border-strong border-border flex flex-col overflow-hidden rounded-lg border-2">
            <div className="flex flex-col gap-2 p-6">
              <div className="flex flex-row items-center justify-between">
                <p className="font-mono">{w.company}</p>
                <div className="flex flex-row gap-1">
                  {w.tags.map((tag) => (
                    <div key={tag} className={TAG}>{tag}</div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold">{w.title}</h3>
                <p className="text-muted-foreground text-base font-medium">{w.description}</p>
                {w.status === "published" ? (
                  <a className={`${BUTTON_SECONDARY} mt-2`} href={w.link}>Read case study</a>
                ) : (
                  <p className="text-base font-medium text-neutral-500">Case study coming soon...</p>
                )}
              </div>
            </div>
          </div>
        );
      },

      Publication: ({ props }) => {
        const p = publications.get(props.id);
        if (!p) return null;
        return (
          <article className={CARD}>
            <h3 className="text-foreground text-lg font-bold">{p.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">{p.publicationYear}</span>
              <a href={p.id} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-medium underline hover:no-underline">
                Read
              </a>
            </div>
          </article>
        );
      },

      CaseStudyExcerpt: ({ props }) => {
        const cs = caseStudies.get(props.slug);
        const section = cs && cs.sections.find((s) => s.id === props.section);
        if (!section) return null;
        return (
          <blockquote className={CARD}>
            <p className="text-primary font-mono text-sm font-medium">{cs.title} · {section.heading}</p>
            <p className="text-muted-foreground text-base font-medium">{section.excerpt}</p>
            <a href={cs.url} className="text-primary text-base font-medium underline hover:no-underline">Read the case study</a>
          </blockquote>
        );
      },

      Timeline: ({ props }) => {
        const items = props.roles.map((id) => roles.get(id)).filter(Boolean);
        if (!items.length) return null;
        return (
          <ol className={CARD}>
            {items.map((r) => (
              <li key={r.id} className="flex flex-col gap-1">
                <p className="text-primary font-mono text-sm font-medium">{r.period}</p>
                <h3 className="text-foreground text-base font-bold">{r.role}, {r.company}</h3>
                {r.summary && <p className="text-muted-foreground text-base font-medium">{r.summary}</p>}
              </li>
            ))}
          </ol>
        );
      },

      ToolCard: ({ props }) => {
        const t = tools.get(props.id);
        if (!t) return null;
        return (
          <div className="bg-card border-border flex h-fit w-fit flex-row gap-2 rounded-2xl border-2 p-4">
            <div className="flex w-full flex-col gap-1">
              <div className="flex flex-row items-center justify-between">
                <h3 className="text-foreground text-base font-bold">{t.name}</h3>
                <div className={TAG}>{t.type}</div>
              </div>
              <p className="text-muted-foreground text-base font-medium">{t.description}</p>
              <a href={t.link} target="_blank" rel="noopener noreferrer" className="text-primary text-base font-medium underline hover:no-underline">
                View on the web
              </a>
            </div>
          </div>
        );
      },

      // Tally's embed script binds buttons present at load; answers arrive later, so open it directly
      ContactCTA: () => (
        <button
          type="button"
          className={BUTTON_PRIMARY}
          data-tally-open={TALLY_FORM}
          data-tally-layout="modal"
          onClick={(e) => {
            if (typeof window !== "undefined" && window.Tally) {
              e.preventDefault();
              window.Tally.openPopup(TALLY_FORM, { layout: "modal" });
            }
          }}
        >
          Get in touch
        </button>
      ),
    },
  });
  return registry;
}

export function AskAnswer({ spec, data, loading = false }) {
  const registry = useMemo(() => createAskRegistry(data), [data]);
  return (
    <JSONUIProvider registry={registry}>
      <Renderer spec={spec} registry={registry} loading={loading} />
    </JSONUIProvider>
  );
}
