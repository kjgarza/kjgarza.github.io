# Kristian Garza - Candidate Profile

> Generated from `src/_data/` by `.claude/skills/generate-kristian-profile/driver.mjs`.
> Do not hand-edit — re-run the driver after changing the site data.

## Identity

- **Name**: Kristian Garza
- **Current Role**: Senior AI Engineer at Digital Science
- **Location**: Berlin, Germany
- **Languages**: English, German, Spanish
- **ORCID**: 0000-0003-3484-6875
- **LinkedIn**: https://www.linkedin.com/in/kjgarza
- **GitHub**: https://github.com/kjgarza
- **Portfolio**: https://kjgarza.github.io/

## Positioning Statement

I'm a Berlin-based AI engineer. My skill set includes robust research capabilities, prototyping, and coding, all aimed at crafting empowering and intuitive user experiences. I specialize in leveraging the intersection of design and AI to address real-world challenges.

**Currently**: Building and prototyping AI-driven microservices and agents at Digital Science, from LLM-powered APIs to Rust-based clustering engines.

**Past**: Developed core infrastructure at DataCite, including Commons, Fabrica, and Sashimi, while leading metadata and design system initiatives.

**Also**: Hosting DS’s AI Technology Radar sessions and experimenting with personal AI projects like a Dataset Discovery & Evaluation Agent.

## Target Role Parameters

- **Seniority**: Above-senior — Staff, Lead, Principal, Manager, Director
- **Arrangement**: Remote-first, Europe-based (Berlin preferred)
- **Tracks**:
  - Track A: Frontier AI labs (Anthropic, OpenAI, Google DeepMind, Mistral, Cohere, etc.)
  - Track B: Research infrastructure organizations (CZI, Crossref, ORCID, OpenAlex, etc.)

## Employment History

### AI Senior Software Engineer — Digital Science, Berlin (2024— Present)

- Launched a FastAPI microservice that converts natural-language queries into optimized Dimensions searches using LLM entity extraction and pgvector, deployed on Docker/Kubernetes with automated CI.
- Delivered a Rust-based Embeddings API that clusters research-document embeddings in seconds with parallel K-means and LLM summarization, deployed as a scalable Kubernetes microservice.
- Built a FastAPI service using OpenAI LLMs and Redis caching to generate instant TL;DRs and key points from research articles, deployed at scale with CI/CD and monitoring.
- Built a GitHub org catalogue scanning 1,000+ repos via a single LLM call per repo; exposed semantic search through an MCP server at ~$1 per full org scan.
- Designed and shipped two generations of a research knowledge graph system: a Graphology-based production pipeline (7,068 entities, 19,085 relationships) and a hexagonal-architecture rewrite using Effect-TS, PostgreSQL+pgvector, and a 22-stage extraction pipeline with graph topology metrics.
- Built an AI-powered manuscript review environment in Next.js with Tiptap v3, real-time citation verification via MCP, contradiction detection through the Dimensions API, and Overleaf sync.
- Prototyped an internal knowledge graph product unifying Salesforce, Drive, Confluence, Zendesk, Slack, and GitHub data; led discovery, wrote the PRD, and validated architecture through three interactive demo surfaces.

### Product Designer — DataCite, Berlin (2020 — 2023)

- Created and open-sourced Parrot GPT—a GPT-powered Python toolkit that auto-converts and enriches publishing metadata across 20+ schemas through an extensible interface, chunk-safe processing, and CI-backed test coverage—slashing manual conversion time for libraries and research institutions.
- Spearheaded DataCite’s first unified Design System, shipping a Bootstrap-driven, WCAG-compliant component library and Storybook docs that standardize UX across all web products and accelerate developer adoption.

### Full Stack Developer — DataCite, Berlin (2016 — 2020)

- Developed and deployed a React / Next.js frontend featuring GraphQL-powered multi-entity search, interactive relationship graphs, and high-performance SSR—complete with TypeScript, Cypress test suites, and GitHub Actions CI, elevating DataCite Commons’ research-output discovery experience.
- Designed and delivered a Rails API that ingests, validates, and stores large SUSHI usage reports in S3/MySQL at 50K-dataset scale with JWT security and on-the-fly compression—establishing a standards-compliant, performant backbone for DataCite research-metrics tracking.

### PHP Developer — DataMine (2011 — 2012)

- Devised features for an ERP system using a Symfony-like framework in PHP, increasing system efficiency and significantly enhancing maintainability due to the implementation of modern programming practices. Tools: PHP, MySQL.

## Case Study Proof Points

### 1. Knowledge Graph Engine - Company Knowledge as a Graph for AI Agents (Digital Science)

**Tags**: Knowledge Graphs, Effect-TS, LLMs

**Summary**: The Knowledge Graph Engine turns a company's scattered documentation into a queryable knowledge graph that AI agents can reason over. Instead of pointing a language model at a pile of raw documents and hoping retrieval surfaces the right passage, the engine extracts entities and relationships into a Postgres-backed graph and exposes it to agents over the Model Context Protocol (MCP).

**Highlights**:
- Designed a hexagonal architecture that isolates extraction logic from infrastructure
- Built the pipeline in Effect-TS for typed errors, retries, and safe concurrency
- Extracted a Postgres-backed knowledge graph from unstructured company documents
- Implemented entity reconciliation to keep the graph coherent at scale
- Served the graph to AI agents over MCP for native graph traversal

**Tech**: Language / Runtime: TypeScript with Effect-TS, Architecture: Hexagonal (ports and adapters), Graph Store: PostgreSQL, Extraction: LLM-driven entity and relationship extraction, Agent Interface: Model Context Protocol (MCP) server

**Source**: `src/work/knowledge-graph-engine.md`

### 2. Repo Atlas - Making 1,000+ Repos Discoverable with LLMs (Digital Science)

**Tags**: LLMs, MCP, TypeScript

**Summary**: Repo Atlas is an LLM-powered catalogue that makes a sprawling GitHub organisation — over a thousand repositories — actually discoverable. It scans every repo, summarises what each one does, and lets engineers ask the question that large organisations struggle to answer: *"Does a repo already exist that does X?"* Answers are served both through an MCP server, so AI agents can query the catalogue directly, and through a web UI for people.

**Highlights**:
- Catalogued 1,000+ repositories across a GitHub organisation automatically
- Built an LLM summarisation pipeline that describes repos by capability, not name
- Enabled intent-level discovery — "does a repo already exist that does X?"
- Exposed the catalogue over MCP for AI agents and a web UI for engineers
- Implemented the system in TypeScript end to end

**Metrics**: Catalogued 1,000+ repositories

**Tech**: Language / Runtime: TypeScript, Summarisation: LLM-driven repository analysis, Source: GitHub organisation-wide scanning, Agent Interface: Model Context Protocol (MCP) server, Human Interface: Web UI

**Source**: `src/work/repo-atlas-catalogue.md`

### 3. Query Translation API - Natural Language to Database Queries (Digital Science)

**Tags**: APIs, LLMs, Python

**Summary**: The Query Translation API is an innovative solution designed to bridge the gap between natural language user queries and structured database queries for the [Dimensions database system](https://www.digital-science.com/blog/2024/11/new-ai-based-natural-language-feature-in-dimensions/). This service allows users to interact with complex research data using natural language, significantly improving accessibility and usability of research information systems.

**Highlights**:
- Architected end-to-end system from concept to production deployment
- Designed sophisticated NLP pipelines for entity extraction and query translation
- Integrated vector search capabilities using PostgreSQL with pgvector
- Orchestrated comprehensive CI/CD with GitLab CI for automated testing and deployment
- Ensured production scalability with Docker-Kubernetes infrastructure

**Tech**: Backend Framework: FastAPI, Language Model Integration: LangChain with OpenAI, Vector Database: PostgreSQL with pgvector, Search Engine: Solr, Containerization: Docker, Kubernetes (via Skaffold), CI/CD: GitLab CI, Monitoring: Sentry, Prometheus, Testing: Pytest with VCR for API mocking

**Source**: `src/work/query-translation-api.md`

### 4. Harmonizing with a Design System (DataCite)

**Tags**: Design systems, UX Design

**Summary**: Crafted a Design System for all DataCite frontend services.

**Source**: `src/work/creating-a-design-system.md`

### 5. Innovating Data Usage Processing Services (DataCite)

**Tags**: Product Design, UX Research

**Summary**: In this project, I took on the role of a Senior Product Designer to pioneer an alternative to existing data usage processing services. These services were heavily dependent on weblogs, which posed challenges when sharing across distributed borders, thus the necessity for a novel solution was clear.

**Source**: `src/work/innovating-data-usage-processing-services.md`

### 6. Usage Reports API - Research Data Metrics at Scale (DataCite)

**Tags**: Serverless, Ruby on Rails

**Summary**: The Sashimi project represents a significant advancement in tracking and reporting research data usage metrics. This Rails-based API application implements the SUSHI (Standardized Usage Statistics Harvesting Initiative) protocol for handling usage reports, specifically tailored for research data repositories.

**Highlights**:
- Led end-to-end architecture from scaling strategy and storage design to service-object processing pipeline
- Designed sophisticated data handling for reports up to 50,000 datasets
- Implemented intelligent compression reducing storage costs by 70%
- Orchestrated CI/CD deployment ensuring reliable production delivery
- Established standards-compliant backbone for DataCite research-metrics tracking

**Metrics**: Handles reports up to 50,000 datasets

**Tech**: Framework: Ruby on Rails 7.1, Storage: Amazon S3 via ActiveStorage, Database: MySQL for metadata, Authentication: JWT (JSON Web Tokens), Validation: JSON Schema, Compression: Built-in Rails compression utilities

**Source**: `src/work/datacite-usage-reports-api.md`

### 7. Redesigning DataCite's Harvesting Services (DataCite)

**Tags**: UX Research, Service Design

**Summary**: Redesigned DataCite's Harvesting Services from the ground up to address underutilization and unlock untapped revenue opportunities.

**Source**: `src/work/redesigning-datacite-harvesting-services.md`

## Technical Stack (from cv.js skills)

### AI/ML & LLMs
OpenAI APIs, Claude SDK, Claude Code, Claude Code Plugins, Langchain, LlamaIndex, Model Context Protocol (MCP), AWS Sagemaker, PostgreSQL + pgvector, SQLite with Embeddings, promptfoo, Figma + Playwright MCPs, Claude for Chrome, AGENTS.md, Knowledge Graph Engineering, MCP Server Development, LLM Pipeline Design, Hybrid Search (BM25 + vector), Graph Algorithms

### Backend & Infrastructure
Python (FastAPI), Rust, Ruby (RoR), SST, GitHub Actions, Effect-TS, tRPC, DynamoDB, AWS (SQS/Lambda/S3)

### Frontend & Design
NextJs + TypeScript, VueJs, Eleventy (11ty), Bun, UX Pilot, Tiptap, Design Sprints, Design Thinking

### Other
GitHub Copilot, Context7, Autoresearch, ChatGPT Atlas, Dia, Vercel AI SDK

## Publications (by theme)

### LLMs & Scholarly Metadata
- "The Impact of Language User Interfaces on Finding Scholarly Repositories" (2023)
- "Breaking a Metadata Barrier: Improving discoverability with automatic subject classification" (2023)
- "ParrotGPT: On the Advantages of Large Language Models Tools for Academic Metadata Schema Mapping" (2023)
- "Academic Publishing web forms meet your demise: The unstoppable rise of large language models (ChatGPT)" (2023)
- "Revolutionizing Metadata Schema Mapping with ChatGPT" (2022)

### Design & UX
- "DataCite Design System is ready to be worn" (2023)
- "Refining our Thinking: How we are improving DataCite design processes" (2022)

### PIDs & Research Infrastructure
- "D4.7 Tools for finding and selecting certified repositories for researchers and other stakeholders" (2022)
- "2021 FAIR Island Annual Report" (2022)
- "The FAIR Island Project: Tracking the impact of field station research" (2022)
- "You shoulda put a PID on it: Leveraging the PID Graph for DMPs" (2021)
- "Are You There, Metadata? It’s Me, the Bibliometrician" (2021)
- "Frontend for the DataCite Commons service" (2020)
- "maDMPs Machine Actionable Data Management Plans (maDMPs) demonstration" (2020)
- "The DataCite MDC Stack" (2020)
- "A tale of two regions: Using Vega-Lite Population Pyramid to explore PIDs populations" (2020)
- "Datacite Citation Display: Unlocking Data Citations" (2020)

### Other
- "Open hours updates: Spring re-launch open hours for consortium leads" (2021)
- "New Research Work on COVID-19 as the pandemic develops" (2020)

**Total**: 19 publications on record.

## Side Projects (initiative signals)

| Project | Type | What it shows |
|---|---|---|
| **Dataset Discovery Agent** | AI SDK | An AI agent automating discovery, evaluation, and acquisition of open research datasets for scientists and data engineers. |
| **SnowyOwl** | Claude SDK | An asynchronous AI development tool where you write task specifications and receive completed pull requests overnight — delegation without presence. |
| **Technology Radar** | Open Source | A personal technology radar that categorizes tools, frameworks, and techniques into Adopt, Trial, and other tiers — separating what's genuinely useful from what's just hype. |
| **Parrot GPT** | LLMs | A Python toolkit that uses GPT-3/3.5 to translate, enrich, and cross-walk bibliographic metadata across schemas, with CLI and CI/CD support. |
| **Election Program AI Analyser** | OpenAI | An AI-powered tool that simplifies 2025 Bundestag election programs, giving clear answers to voters’ policy questions in natural language. |
| **CrossFit WOD Viewer** | Git Scrape | A web app that scrapes CrossFit workout-of-the-day data and uses AI to provide explanations, scaling options, and beginner-friendly modifications. |
| **Kitchen Timer** | Claude | A mobile-optimized cooking app that uses GPT vision to extract structured data from recipe photos, with an action-first UI designed to reduce cognitive load in the kitchen. |

## Education

- **PhD Computer Science**, University of Manchester, Manchester (2012 — 2016)
- **MSc Spacecraft Technology**, University College London, London (2007 — 2008)

## Dynamic Positioning Frames

Choose the frame based on each job posting's emphasis:

| Frame | When to use | Lead evidence |
|-------|-------------|---------------|
| **Lead/Principal Engineer** | Role emphasizes technical architecture, mentorship, system design | Query Translation API, Knowledge Graph Engine, Sashimi API |
| **AI/Agentic Systems Engineer** | Role emphasizes LLM/RAG, agents, MCP, evaluation | Knowledge Graph Engine, Repo Atlas, Query Translation API, promptfoo eval loop |
| **Engineering Manager** | Role emphasizes cross-functional coordination, team building | Harvesting Services (56-person research), Design System (4-person team) |
| **Head of / Director** | Role owns a domain (Head of AI, Director of Infrastructure) | AI depth + infrastructure scale + design leadership combined |
| **Staff Engineer** | Role emphasizes deep IC work with org-wide influence | Publications record + production systems + cross-domain expertise |

