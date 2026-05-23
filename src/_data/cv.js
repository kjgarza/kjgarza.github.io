module.exports = {
  name: "Kristian Garza",
  title: "AI Software Engineer",
  location: "Berlin, Germany",
  email: "kj.garza@gmail.com",

  profile:
    "Curiosity-driven AI engineer who rapidly prototypes and ships: built open-source LLM metadata translators, scalable Embeddings & RAG pipelines, and a Rust API clustering millions of vectors in seconds. Skilled in LangChain, Hugging Face, and pgvector, I design experiments, build evaluation pipelines, and turn new research into practical PoCs—communicating results clearly to guide product strategy.",

  links: [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/kjgarza" },
    { name: "Github", url: "https://github.com/kristiangarza" },
    { name: "Portfolio", url: "https://kjgarza.github.io/" },
  ],

  skills: [
    { name: "OpenAI APIs", level: 95 },
    { name: "Claude SDK", level: 90, radarUrl: "https://kjgarza.github.io/radar/edition/2026-04#blip-claude-agent-sdk" },
    { name: "Claude Code", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-claude-code" },
    { name: "Claude Code Plugins", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2026-04#blip-claude-plugins" },
    { name: "Python (FastAPI)", level: 95, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-fastapi" },
    { name: "Langchain", level: 85, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-langchain" },
    { name: "LlamaIndex", level: 80, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-llamaindex" },
    { name: "Model Context Protocol (MCP)", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-mcp-platform" },
    { name: "AWS Sagemaker", level: 75 },
    { name: "Rust", level: 70 },
    { name: "NextJs + TypeScript", level: 85 },
    { name: "Ruby (RoR)", level: 90 },
    { name: "PGVector", level: 80 },
    { name: "SQLite with Embeddings", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2026-04#blip-sqlite-with-embeddings" },
    { name: "VueJs", level: 70 },
    { name: "Eleventy (11ty)", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-eleventy" },
    { name: "Bun", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-bun" },
    { name: "SST", level: 75, radarUrl: "https://kjgarza.github.io/radar/edition/2026-04#blip-sst" },
    { name: "GitHub Actions", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-github-actions-extended" },
    { name: "GitHub Copilot", level: 75, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-github-copilot" },
    { name: "Context7", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-context7" },
    { name: "promptfoo", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2026-04#blip-promptfoo" },
    { name: "Autoresearch", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2026-04#blip-autoresearch" },
    { name: "Figma + Playwright MCPs", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-figma-playwright-mcps" },
    { name: "UX Pilot", level: 75, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-ux-pilot" },
    { name: "ChatGPT Atlas", level: 65, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-chatgpt-atlas" },
    { name: "Claude for Chrome", level: 75, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-claude-chrome" },
    { name: "Dia", level: 65, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-dia-browser" },
    { name: "AGENTS.md", level: 88, radarUrl: "https://kjgarza.github.io/radar/edition/2025-12#blip-agents-md" },
    { name: "Design Sprints", level: 85 },
    { name: "Design Thinking", level: 85 },
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
      period: "2024\u2014 Present",
      bullets: [
        "Launched a FastAPI microservice that converts natural-language queries into optimized Dimensions searches using LLM entity extraction and pgvector, deployed on Docker/Kubernetes with automated CI.",
        "Delivered a Rust-based Embeddings API that clusters research-document embeddings in seconds with parallel K-means and LLM summarization, deployed as a scalable Kubernetes microservice.",
        "Built a FastAPI service using OpenAI LLMs and Redis caching to generate instant TL;DRs and key points from research articles, deployed at scale with CI/CD and monitoring.",
      ],
    },
    {
      role: "Product Designer",
      company: "DataCite",
      location: "Berlin",
      period: "2020 \u2014 2023",
      bullets: [
        "Created and open-sourced Parrot GPT\u2014a GPT-powered Python toolkit that auto-converts and enriches publishing metadata across 20+ schemas through an extensible interface, chunk-safe processing, and CI-backed test coverage\u2014slashing manual conversion time for libraries and research institutions.",
        "Spearheaded DataCite\u2019s first unified Design System, shipping a Bootstrap-driven, WCAG-compliant component library and Storybook docs that standardize UX across all web products and accelerate developer adoption.",
      ],
    },
    {
      role: "Full Stack Developer",
      company: "DataCite",
      location: "Berlin",
      period: "2016 \u2014 2020",
      bullets: [
        "Developed and deployed a React / Next.js frontend featuring GraphQL-powered multi-entity search, interactive relationship graphs, and high-performance SSR\u2014complete with TypeScript, Cypress test suites, and GitHub Actions CI, elevating DataCite Commons\u2019 research-output discovery experience.",
        "Designed and delivered a Rails API that ingests, validates, and stores large SUSHI usage reports in S3/MySQL at 50K-dataset scale with JWT security and on-the-fly compression\u2014establishing a standards-compliant, performant backbone for DataCite research-metrics tracking.",
      ],
    },
    {
      role: "PHP Developer",
      company: "DataMine",
      location: "",
      period: "2011 \u2014 2012",
      bullets: [
        "Devised features for an ERP system using a Symfony-like framework in PHP, increasing system efficiency and significantly enhancing maintainability due to the implementation of modern programming practices. Tools: PHP, MySQL.",
      ],
    },
  ],

  employmentFooter:
    "Visit linkedin.com/in/kjgarza for full EMPLOYMENT HISTORY",

  education: [
    {
      degree: "PhD Computer Science",
      institution: "University of Manchester",
      location: "Manchester",
      period: "2012 \u2014 2016",
      description:
        "Led the investigation of the employment of a novel choice architecture approach to integrate the captured context into the data repository design, developing features that resonated with the user base.",
    },
    {
      degree: "MSc Spacecraft Technology",
      institution: "University College London",
      location: "London",
      period: "2007 \u2014 2008",
      description: "Defined design improvements of electron detectors.",
    },
  ],

  hacks: [
    {
      title: "Converting Publications into Interactive Podcasts",
      event: "Holtzbrinck Hackathon 2024",
      year: "2024",
      description:
        "Co-led a 48-hour sprint to ship a Next.js app that transforms academic PDFs into multi-speaker, podcast-style episodes with live Q&A, marrying custom LLM condensation and speech-synthesis pipelines (TTS) with an accessible, mobile-first UI.",
    },
    {
      title: "Workflow Automation for Research Communities",
      event: "Holtzbrinck Hackathon 2025",
      year: "2025",
      description:
        "Build a no-code workflow-automation platform in a Next.js app that connects research staples such as Dimensions, Overleaf, and ReadCube, letting scholars stitch together cross-tool integrations in minutes and eliminating brittle, ad-hoc scripts. services through a no-code interface.",
    },
  ],

  projectsNote: "Visit website for OTHER PROJECTs",

  publishedWork: [
    {
      title:
        "Revolutionizing Metadata Schema Mapping with ChatGPT and AI.",
      publisher: "Substack",
      year: "2023",
      url: "https://doi.org/10.59350/b9na4-hq881",
    },
    {
      title:
        "ParrotGPT: On the Advantages of Large Language Models Tools (AI) for Academic Metadata Schema Mapping.",
      publisher: "EOSC",
      year: "2023",
      url: "https://doi.org/10.59350/hs9k1-wn031",
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
