module.exports = {
  name: "Kristian Garza",
  title: "Tech Lead · AI Engineer",
  location: "Berlin, Germany",
  email: "kj.garza@gmail.com",

  profile:
    "Senior AI Engineer and technical leader with 10+ years building production software and 4+ years shipping LLM-powered systems at scale. At Digital Science I architected Python/FastAPI RAG microservices—agentic orchestration, vector-search APIs, LLM evaluation—deployed on Kubernetes/AWS. At DataCite I led a 4-person cross-functional team to deliver a WCAG-compliant design system and shaped product strategy through rigorous user research. PhD in Computer Science, 18+ publications on LLMs and scholarly metadata, and deep experience in responsible AI for knowledge-intensive domains.",

  links: [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/kjgarza" },
    { name: "Github", url: "https://github.com/kristiangarza" },
    { name: "Portfolio", url: "https://kjgarza.github.io/" },
  ],

  skills: [
    { name: "Python (FastAPI / Django)", level: 95 },
    { name: "LLMs & RAG Pipelines", level: 95 },
    { name: "LangChain / LlamaIndex", level: 90 },
    { name: "OpenAI / Claude APIs", level: 95 },
    { name: "Vector DBs (pgvector, OpenSearch)", level: 85 },
    { name: "PostgreSQL / Relational DBs", level: 90 },
    { name: "AWS + Kubernetes", level: 85 },
    { name: "Team Leadership & Mentoring", level: 90 },
    { name: "LLM Evaluation & Governance", level: 85 },
    { name: "TypeScript / React / Next.js", level: 80 },
    { name: "Docker / CI/CD", level: 90 },
    { name: "Design Sprints / UX Research", level: 85 },
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
        "Architected and shipped a Python/FastAPI RAG microservice that translates natural-language researcher queries into structured Dimensions searches via LangChain entity extraction and pgvector semantic search—deployed on Kubernetes with Sentry/Prometheus observability.",
        "Built a Python/FastAPI service using OpenAI LLMs and Redis caching to generate real-time article summaries and key-point extractions from research literature at production scale with full CI/CD.",
        "Delivered a Rust-based embeddings API clustering research-document vectors with parallel K-means and LLM summarization—designed as a scalable Kubernetes microservice serving live traffic.",
        "Facilitates AI Technology Radar sessions to evaluate and adopt emerging GenAI tools (LLM evaluation frameworks, agentic orchestration, vector stores) across the engineering organisation.",
      ],
    },
    {
      role: "Product Designer & Engineering Lead",
      company: "DataCite",
      location: "Berlin",
      period: "2020 — 2023",
      bullets: [
        "Led a 4-person cross-functional team (designer, developer, PM, design manager) to design and ship DataCite's unified Design System—Atomic Design component library, WCAG-compliant Storybook docs, Bootstrap-compatible JS package—used across all web products.",
        "Owned product strategy for a harvesting service relaunch: ran a 56-person focus group across 10 organisations and an 85-response survey, facilitated design sprints that cut delivery lead time by 42% and opened 4 new customer relationships.",
        "Created and open-sourced Parrot GPT—a Python toolkit using GPT-3/3.5 for automatic bibliographic metadata translation across 20+ schemas—an early production LLM tool for knowledge management pipelines.",
      ],
    },
    {
      role: "Full Stack Developer",
      company: "DataCite",
      location: "Berlin",
      period: "2016 — 2020",
      bullets: [
        "Designed and delivered Sashimi, a Rails API implementing the SUSHI protocol for research usage metrics at 50,000-dataset scale—S3/MySQL hybrid storage, JWT auth, and on-the-fly compression reduced storage costs by 70%.",
        "Built DataCite Commons: a React/Next.js frontend with GraphQL-powered multi-entity search, interactive relationship graphs, and SSR—with TypeScript and Cypress test suites.",
      ],
    }
  ],

  employmentFooter:
    "Visit linkedin.com/in/kjgarza for full EMPLOYMENT HISTORY",

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
        "Built a no-code workflow-automation platform connecting research tools (Dimensions, Overleaf, ReadCube) via a Next.js app—letting scholars stitch cross-tool integrations in minutes, eliminating brittle ad-hoc scripts.",
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
