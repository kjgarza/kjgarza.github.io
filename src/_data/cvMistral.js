module.exports = {
  name: "Kristian Garza",
  title: "Technical Lead · Applied AI Engineer",
  location: "Berlin, Germany",
  email: "kj.garza@gmail.com",

  profile:
    "AI-focused technical lead with 10+ years shipping production software and 4+ years scaling enterprise LLM systems. At Digital Science: architect Python/FastAPI RAG microservices and knowledge graphs on Kubernetes. At DataCite: led 4-person teams, researched stakeholder needs, shipped open-source LLM tools. PhD Computer Science, proven at translating research into production systems.",

  links: [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/kjgarza" },
    { name: "Github", url: "https://github.com/kristiangarza" },
    { name: "Portfolio", url: "https://kjgarza.github.io/" },
  ],

  skills: [
    { name: "Python (FastAPI)", level: 95 },
    { name: "LLM Pipeline Design", level: 90 },
    { name: "RAG Systems (LangChain + pgvector)", level: 90 },
    { name: "Agentic Workflows / MCP", level: 88 },
    { name: "OpenAI / Claude APIs", level: 95 },
    { name: "LangChain / LlamaIndex", level: 88 },
    { name: "Hybrid Search (BM25 + vector)", level: 85 },
    { name: "Knowledge Graph Engineering", level: 85 },
    { name: "AWS (SQS / Lambda / S3)", level: 80 },
    { name: "Kubernetes + Docker", level: 85 },
    { name: "PostgreSQL + pgvector", level: 85 },
    { name: "TypeScript / Next.js", level: 85 },
    { name: "Promptfoo (LLM Evaluation)", level: 88 },
    { name: "MCP Server Development", level: 85 },
    { name: "Design Sprints / Stakeholder Research", level: 85 },
  ],

  languages: [
    { name: "English", level: 100 },
    { name: "Spanish", level: 100 },
    { name: "German", level: 70 },
  ],

  employment: [
    {
      role: "AI Senior Software Engineer",
      company: "Digital Science",
      location: "Berlin",
      period: "2024 — Present",
      bullets: [
        "Architected and shipped a Python/FastAPI RAG microservice translating natural-language researcher queries into structured Dimensions searches via LangChain entity extraction and pgvector semantic search — deployed on Kubernetes with Sentry/Prometheus observability.",
        "Designed and shipped two generations of a research knowledge graph system: a Graphology-based production pipeline and a hexagonal-architecture rewrite using Effect-TS, PostgreSQL+pgvector, and a 22-stage extraction pipeline with graph topology metrics.",
        "Built an AI-powered manuscript review environment in Next.js with Tiptap v3, real-time citation verification via MCP, contradiction detection through the Dimensions API, and Overleaf sync — hands-on IC delivery of a complex agentic system.",
        "Built a GitHub org catalogue scanning 1,000+ repos via a single LLM call per repo, exposed through an MCP server at ~$1 per full org scan — demonstrating cost-efficient agentic pipeline design."
      ],
    },
    {
      role: "Product Designer & Engineering Lead",
      company: "DataCite",
      location: "Berlin",
      period: "2020 — 2023",
      bullets: [
        "Created and open-sourced Parrot GPT — a Python toolkit using GPT-3/3.5 for automatic bibliographic metadata translation across 20+ schemas — an early production LLM tool for knowledge management pipelines, demonstrating applied AI in the open-source space.",
        "Owned technical strategy and user research for a harvesting service relaunch: ran a 56-person focus group across 10 organisations and an 85-response survey, facilitating design sprints that cut delivery lead time by 42% and opened 4 new customer relationships.",
        "Led a 4-person cross-functional team (designer, developer, PM, design manager) to design and ship DataCite's unified Design System — WCAG-compliant component library, Storybook docs, Bootstrap-compatible JS package — used across all web products.",
      ],
    },
    {
      role: "Full Stack Developer",
      company: "DataCite",
      location: "Berlin",
      period: "2016 — 2020",
      bullets: [
        "Designed and delivered Sashimi, a Rails API implementing the SUSHI protocol for research usage metrics at 50,000-dataset scale — S3/MySQL hybrid storage, JWT auth, and on-the-fly compression reduced storage costs by 70%.",
        "Built DataCite Commons: a React/Next.js frontend with GraphQL-powered multi-entity search, interactive relationship graphs, and SSR — with TypeScript and Cypress test suites and GitHub Actions CI.",
      ],
    },
  ],

  employmentFooter:
    "Visit linkedin.com/in/kjgarza for full EMPLOYMENT HISTORY",
  employmentFooterUrl: "https://www.linkedin.com/in/kjgarza",

  education: [
    {
      degree: "PhD Computer Science",
      institution: "University of Manchester",
      location: "Manchester",
      period: "2012 — 2016",
      description:
        "Investigated novel choice-architecture approaches for data-repository design, delivering user-centric features grounded in controlled experiments and contextual inquiry.",
    },
    {
      degree: "MSc Spacecraft Technology",
      institution: "University College London",
      location: "London",
      period: "2007 — 2008",
      description: "Defined design improvements for electron detectors.",
    },
  ],

  hacks: [
    {
      title: "Workflow Automation for Research Communities",
      event: "Holtzbrinck Hackathon 2025",
      year: "2025",
      description:
        "Built a no-code workflow-automation platform connecting research tools (Dimensions, Overleaf, ReadCube) via a Next.js app — letting scholars stitch cross-tool integrations in minutes, eliminating brittle ad-hoc scripts.",
    },
    {
      title: "Converting Publications into Interactive Podcasts",
      event: "Holtzbrinck Hackathon 2024",
      year: "2024",
      description:
        "Co-led a 48-hour sprint to ship a Next.js app transforming academic PDFs into multi-speaker podcast episodes with live Q&A, using custom LLM condensation and TTS synthesis pipelines.",
    },
  ],

  projectsNote: "Visit website for OTHER PROJECTs",
  projectsNoteUrl: "https://kjgarza.github.io/work",

  publishedWork: [
    {
      title:
        "The Impact of Language User Interfaces on Finding Scholarly Repositories.",
      publisher: "iPRES 2023",
      year: "2023",
      url: "https://doi.org/10.59350/b9na4-hq881",
    },
    {
      title:
        "ParrotGPT: On the Advantages of Large Language Models for Academic Metadata Schema Mapping.",
      publisher: "EOSC 2023",
      year: "2023",
      url: "https://doi.org/10.59350/hs9k1-wn031",
    },
    {
      title:
        "Academic Publishing Web Forms Meet Your Demise: The Unstoppable Rise of Large Language Models.",
      publisher: "Substack / Force11",
      year: "2023",
      url: "https://doi.org/10.59350/b9na4-hq881",
    },
  ],

  courses: [
    {
      title: "Designing AI Experiences",
      provider: "NN/Group",
      year: "2025",
      url: "https://www.nngroup.com/courses/designing-ai-experiences/",
    },
    {
      title: "Designing Complex Apps for Specialised Domains",
      provider: "NN/Group",
      year: "2022",
      url: "https://www.nngroup.com/courses/complex-apps-specialized-domains/",
    },
  ],
};
