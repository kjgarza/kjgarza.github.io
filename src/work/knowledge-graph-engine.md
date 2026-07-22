---
layout: layouts/case-study.njk
title: Knowledge Graph Engine - Company Knowledge as a Graph for AI Agents
description: Architected a hexagonal Effect-TS pipeline that extracts a Postgres-backed knowledge graph from company documents and serves it to AI agents over MCP.
company: Digital Science
tags:
  - Knowledge Graphs
  - Effect-TS
  - LLMs
heroImage: /assets/images/knowledge-graph-engine-hero.png
permalink: /work/knowledge-graph-engine/
passwordProtected: true
contentStyle: technical
---

## Overview

The Knowledge Graph Engine turns a company's scattered documentation into a queryable knowledge graph that AI agents can reason over. Instead of pointing a language model at a pile of raw documents and hoping retrieval surfaces the right passage, the engine extracts entities and relationships into a Postgres-backed graph and exposes it to agents over the Model Context Protocol (MCP).

The result is a single, structured source of truth about how the company's people, projects, systems, and concepts relate to one another — one that agents can traverse rather than merely search.

## Problem Statement

Institutional knowledge lives in documents that were never designed to be read by machines: wikis, design docs, runbooks, meeting notes, and READMEs. When an AI agent needs to answer a question that spans several of these sources, plain vector retrieval struggles:

- Facts are scattered across documents with no explicit links between them
- Multi-hop questions ("which services does the team that owns X depend on?") require reasoning over relationships, not just similarity
- Retrieval returns passages, not structured facts, leaving the model to re-derive connections on every call
- There is no stable, inspectable representation of what the company actually knows

## Solution Overview

The engine addresses this by building an explicit knowledge graph as a first-class artifact:

1. **Ingests company documents** from their source systems
2. **Extracts entities and relationships** using LLM-driven extraction against a defined schema
3. **Persists the graph** in Postgres, with nodes and typed edges
4. **Reconciles and deduplicates** entities so the same concept is not represented twice
5. **Serves the graph to AI agents over MCP**, letting them query and traverse it as a tool

Agents no longer receive a bag of text chunks — they get a navigable graph they can walk to answer relational questions.

## Technical Architecture

### Hexagonal Design

The pipeline is built around a hexagonal (ports and adapters) architecture. The extraction and graph-building domain logic sits at the core, isolated from infrastructure concerns. Ports define the contracts for document sources, LLM providers, and graph persistence; adapters implement them. This keeps the core testable and makes it straightforward to swap a document source or model provider without touching the extraction logic.

### Effect-TS Pipeline

The pipeline is implemented in [Effect-TS](https://effect.website/), which provides typed error handling, structured concurrency, and composable effects. Each stage — ingestion, extraction, reconciliation, persistence — is an Effect that can be composed, retried, and observed. This gives the pipeline predictable failure behaviour and makes concurrency across many documents safe by construction.

### Technology Stack

- **Language / Runtime**: TypeScript with Effect-TS
- **Architecture**: Hexagonal (ports and adapters)
- **Graph Store**: PostgreSQL
- **Extraction**: LLM-driven entity and relationship extraction
- **Agent Interface**: Model Context Protocol (MCP) server

### Architecture Flow

1. **Document Sources**: Adapters pull documents from company systems
2. **Extraction Core**: LLMs extract entities and typed relationships against the graph schema
3. **Reconciliation**: Entities are matched and deduplicated to keep the graph coherent
4. **Graph Persistence**: Nodes and edges are written to Postgres
5. **MCP Server**: Exposes the graph to AI agents for querying and traversal

## Challenges and Solutions

### Entity Reconciliation

**Challenge**: The same person, service, or concept is referred to differently across documents, producing duplicate nodes.

**Solution**: Added a reconciliation stage that matches candidate entities before persistence, collapsing duplicates into single canonical nodes so the graph stays coherent as more documents are ingested.

### Reliable Extraction at Scale

**Challenge**: LLM extraction is inherently fallible, and running it across a large document corpus multiplies the chances of partial failure.

**Solution**: Modelled every stage as an Effect with typed errors and retries, so a failure on one document does not sink the run, and structured concurrency keeps throughput high without unbounded parallelism.

### Serving a Graph to Agents

**Challenge**: Agents need to traverse relationships, not just fetch documents.

**Solution**: Exposed the graph through an MCP server with tools tailored to graph traversal, letting agents follow edges and answer multi-hop questions natively.

## Impact and Results

### Structured Institutional Knowledge
Company knowledge becomes an explicit, inspectable graph rather than an opaque pile of documents.

### Multi-hop Reasoning
Agents can answer relational questions that plain retrieval cannot, by traversing typed edges in the graph.

### Clean Separation of Concerns
The hexagonal design keeps extraction logic independent of document sources and model providers, making the system adaptable.

### Agent-native Access
MCP makes the graph a first-class tool for any compatible AI agent, without bespoke integration work.

## Key Achievements

- **Designed a hexagonal architecture** that isolates extraction logic from infrastructure
- **Built the pipeline in Effect-TS** for typed errors, retries, and safe concurrency
- **Extracted a Postgres-backed knowledge graph** from unstructured company documents
- **Implemented entity reconciliation** to keep the graph coherent at scale
- **Served the graph to AI agents over MCP** for native graph traversal

## Conclusion

The Knowledge Graph Engine demonstrates a durable pattern for grounding AI agents in institutional knowledge: extract structure once, persist it as a graph, and let agents reason over relationships instead of re-deriving them on every query. The combination of a hexagonal architecture and an Effect-TS pipeline yields a system that is testable, resilient, and adaptable as document sources and models evolve.
