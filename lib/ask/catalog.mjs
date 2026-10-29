// json-render catalog for /ask/. Every prop except Answer.text is an id from
// /api/ask-data.json, so the model can choose what to show but can't invent it.
import { defineCatalog, validateSpec } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

export const ANSWER_MAX_CHARS = 600;

const ids = (items) => z.enum(items.map((i) => i.id));

export function createAskCatalog(data) {
  const sectionsBySlug = Object.fromEntries(data.caseStudies.map((cs) => [cs.slug, cs.sections.map((s) => s.id)]));

  return defineCatalog(schema, {
    components: {
      Stack: {
        props: z.object({}),
        description: "Vertical container. Use it as the root, with Answer as its first child and the supporting components after it.",
      },
      Answer: {
        props: z.object({ text: z.string().trim().min(1).max(ANSWER_MAX_CHARS) }),
        description: `A short plain-text answer in the first person as Kristian, at most ${ANSWER_MAX_CHARS} characters. The only free text in the answer.`,
      },
      WorkCard: {
        props: z.object({ id: ids(data.work) }),
        description: "A portfolio project card, by work id.",
      },
      Publication: {
        props: z.object({ id: ids(data.publications) }),
        description: "A publication citation with a link, by publication id.",
      },
      CaseStudyExcerpt: {
        props: z
          .object({ slug: z.enum(Object.keys(sectionsBySlug)), section: z.string() })
          .refine(({ slug, section }) => sectionsBySlug[slug]?.includes(section), {
            message: "section must be one of that case study's section ids",
            path: ["section"],
          }),
        description: "A short passage from a public case study, by case-study slug and section id.",
      },
      Timeline: {
        props: z.object({ roles: z.array(ids(data.roles)).min(1).max(data.roles.length) }),
        description: "A slice of employment history, by role ids, newest first.",
      },
      ToolCard: {
        props: z.object({ id: ids(data.tools) }),
        description: "A side-project tool card, by tool id.",
      },
      ContactCTA: {
        props: z.object({}),
        description: "The 'Get in touch' button. Add it last when the visitor might want to follow up.",
      },
    },
    actions: {},
  });
}

// Check one element against the catalog. Returns the element reduced to
// type/props/children (props as parsed), or the reasons it was rejected.
export function checkElement(catalog, element) {
  const component = element && catalog.data.components[element.type];
  if (!component) return { ok: false, issues: [`unknown component type ${JSON.stringify(element?.type)}`] };
  const props = component.props.safeParse(element.props ?? {});
  if (!props.success) return { ok: false, issues: props.error.issues.map((i) => `${element.type}.${i.path.join(".")}: ${i.message}`) };
  const children = Array.isArray(element.children) ? element.children.filter((c) => typeof c === "string") : [];
  return { ok: true, element: { type: element.type, props: props.data, children } };
}

export function validateAskSpec(catalog, spec) {
  const issues = validateSpec(spec)
    .issues.filter((i) => i.severity === "error")
    .map((i) => i.message);
  for (const [key, element] of Object.entries(spec?.elements ?? {})) {
    const result = checkElement(catalog, element);
    if (!result.ok) issues.push(...result.issues.map((i) => `${key}: ${i}`));
  }
  return { success: issues.length === 0, issues };
}
