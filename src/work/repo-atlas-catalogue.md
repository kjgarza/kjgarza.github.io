---
layout: layouts/case-study.njk
title: Repo Atlas - Making 1,000+ Repos Discoverable with LLMs
description: Built an LLM-powered catalogue that scans an entire GitHub org and answers "does a repo already exist that does X?" through an MCP server and web UI.
company: Digital Science
tags:
  - LLMs
  - MCP
  - TypeScript
heroImage: /assets/images/repo-atlas-hero.png
permalink: /work/repo-atlas-catalogue/
passwordProtected: true
contentStyle: technical
---

## Overview

Repo Atlas is an LLM-powered catalogue that makes a sprawling GitHub organisation — over a thousand repositories — actually discoverable. It scans every repo, summarises what each one does, and lets engineers ask the question that large organisations struggle to answer: *"Does a repo already exist that does X?"* Answers are served both through an MCP server, so AI agents can query the catalogue directly, and through a web UI for people.

The goal is to stop teams from rebuilding what already exists, and to make an unmanageably large codebase navigable by intent rather than by remembering repo names.

## Problem Statement

Once an organisation crosses a few hundred repositories, nobody holds the whole map in their head. GitHub search matches on names and code, not on purpose, so:

- Engineers reinvent tools that already exist somewhere in the org
- Onboarding is slow because there is no way to explore the codebase by what things *do*
- Institutional knowledge about which repo owns which capability lives only in a few people's heads
- Naming conventions are inconsistent, so keyword search misses relevant repos entirely

## Solution Overview

Repo Atlas builds a searchable, intent-level catalogue of the entire org:

1. **Scans every repository** in the GitHub organisation
2. **Summarises each repo** with an LLM, capturing what it does and the capabilities it provides
3. **Indexes the catalogue** for retrieval by natural-language intent
4. **Answers "does a repo already exist that does X?"** rather than matching on names
5. **Serves results over both an MCP server and a web UI**, for agents and humans alike

Instead of guessing repo names, users describe the capability they need and Repo Atlas surfaces the repositories that already provide it.

## Technical Architecture

### Technology Stack

- **Language / Runtime**: TypeScript
- **Summarisation**: LLM-driven repository analysis
- **Source**: GitHub organisation-wide scanning
- **Agent Interface**: Model Context Protocol (MCP) server
- **Human Interface**: Web UI

### Key Components

#### Org Scanner

Walks the GitHub organisation and gathers the signal needed to describe each repository — READMEs, structure, and metadata — as input for summarisation. Designed to handle 1,000+ repos without manual curation.

#### LLM Summariser

Turns each repository into a concise, capability-focused description. This is what shifts discovery from *name matching* to *intent matching*: the catalogue knows what a repo does, not just what it is called.

#### Catalogue Index

Stores the summaries and makes them retrievable by natural-language query, so a description of a needed capability can be matched against what already exists.

#### Dual Interface: MCP + Web UI

The same catalogue is exposed two ways — an MCP server so AI agents can ask the catalogue questions as a tool, and a web UI so engineers can browse and search directly.

### Architecture Flow

1. **Scan**: Enumerate repositories across the organisation
2. **Summarise**: Generate an intent-level description of each repo with an LLM
3. **Index**: Store summaries for natural-language retrieval
4. **Query**: Users or agents ask whether a capability already exists
5. **Serve**: Return matching repositories via MCP or the web UI

## Challenges and Solutions

### Scale

**Challenge**: Summarising and keeping over a thousand repositories catalogued without manual effort.

**Solution**: Automated the full scan-and-summarise pipeline so the catalogue covers the whole org and can be refreshed as repositories change.

### Discovery by Intent, Not Name

**Challenge**: Keyword and code search miss relevant repos because they match tokens, not purpose.

**Solution**: Used LLM summaries to describe each repo by capability, so queries phrased as intent ("something that does X") match the right repositories regardless of naming.

### Serving Both Agents and People

**Challenge**: AI agents and human engineers need the catalogue in very different shapes.

**Solution**: Exposed one catalogue through two interfaces — an MCP server for agents and a web UI for humans — so both consume the same source of truth.

## Impact and Results

### Less Duplicated Work
Engineers can check whether a capability already exists before building it, cutting redundant projects.

### Faster Onboarding
Newcomers can explore a huge codebase by what things do, not by memorising repo names.

### Agent-native Discovery
AI agents can query the catalogue over MCP, making org-wide repo discovery part of automated workflows.

### Intent-level Search
Discovery works on purpose rather than keywords, surfacing relevant repos that name-based search would miss.

## Key Achievements

- **Catalogued 1,000+ repositories** across a GitHub organisation automatically
- **Built an LLM summarisation pipeline** that describes repos by capability, not name
- **Enabled intent-level discovery** — "does a repo already exist that does X?"
- **Exposed the catalogue over MCP** for AI agents and a **web UI** for engineers
- **Implemented the system in TypeScript** end to end

## Conclusion

Repo Atlas shows how LLMs can make a large codebase legible: by summarising every repository into intent-level descriptions and serving them to both agents and people, it turns an unmanageable sprawl of repos into a catalogue you can actually query. The dual MCP-and-web-UI design means the same knowledge powers automated agent workflows and everyday engineer discovery alike.
