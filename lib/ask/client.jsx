// Page script for /ask/, bundled to src/assets/js/ask.js by `bun run build:ask`.
// The form and suggested questions are static HTML from src/ask.njk; this
// script takes them over and streams answers into #ask-answer.
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useUIStream } from "@json-render/react";
import { AskAnswer } from "./registry.jsx";

const MESSAGE = "text-secondary text-base font-medium";

function App({ data, endpoint, form, links, region }) {
  const { spec, isStreaming, error, send } = useUIStream({ api: endpoint });

  useEffect(() => {
    const input = form.elements.question;
    const ask = (question) => {
      input.value = question;
      send(question);
    };
    const onSubmit = (e) => {
      e.preventDefault();
      const question = input.value.trim();
      if (question) send(question);
    };
    const onLink = (e) => {
      e.preventDefault();
      ask(e.currentTarget.dataset.question);
      input.focus();
    };
    form.addEventListener("submit", onSubmit);
    links.forEach((a) => a.addEventListener("click", onLink));
    return () => {
      form.removeEventListener("submit", onSubmit);
      links.forEach((a) => a.removeEventListener("click", onLink));
    };
  }, [send]);

  useEffect(() => {
    region.setAttribute("aria-busy", String(isStreaming));
    form.querySelector("button[type=submit]").disabled = isStreaming;
  }, [isStreaming]);

  if (error) {
    return <p className={MESSAGE}>Sorry, I couldn't answer that just now ({error.message}). Each suggested question links to the page that covers it.</p>;
  }
  if (!spec?.root) return isStreaming ? <p className={MESSAGE}>Thinking…</p> : null;
  return <AskAnswer spec={spec} data={data} loading={isStreaming} />;
}

async function main() {
  const form = document.getElementById("ask-form");
  const region = document.getElementById("ask-answer");
  if (!form || !region || !form.dataset.endpoint) return;
  // Without the data the page keeps working as a list of links
  let data;
  try {
    const res = await fetch("/api/ask-data.json");
    if (!res.ok) return;
    data = await res.json();
  } catch {
    return;
  }
  const links = [...document.querySelectorAll("a[data-question]")];
  createRoot(region).render(<App data={data} endpoint={form.dataset.endpoint} form={form} links={links} region={region} />);
  form.hidden = false;
}

main();
