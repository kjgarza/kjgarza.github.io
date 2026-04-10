---
layout: layouts/case-study.njk
title: Query Translation API - Natural Language to Database Queries
description: Architected and launched a FastAPI microservice that turns natural-language requests into optimized Dimensions searches via LLM entity extraction and pgvector semantic search.
company: Digital Science
tags: 
  - API Development
  - LLMs
  - Python
heroImage: /assets/images/nl2query-hero.png
permalink: /work/query-translation-api/
passwordProtected: true
contentStyle: technical
---

## Overview

The Query Translation API is an innovative solution designed to bridge the gap between natural language user queries and structured database queries for the [Dimensions database system](https://www.digital-science.com/blog/2024/11/new-ai-based-natural-language-feature-in-dimensions/). This service allows users to interact with complex research data using natural language, significantly improving accessibility and usability of research information systems.

Researchers and data analysts often struggle with formulating complex database queries to find relevant publications, grants, clinical trials, and patents in the Dimensions database. The traditional approach requires knowledge of specific query syntax and familiarity with the underlying data schema, creating a high barrier to entry for many users.

## Problem Statement

Researchers and data analysts often struggle with formulating complex database queries to find relevant publications, grants, clinical trials, and patents in the Dimensions database. The traditional approach requires knowledge of specific query syntax and familiarity with the underlying data schema, creating a high barrier to entry for many users. This results in:

- Inefficient data retrieval
- Missed research opportunities  
- Frustration when exploring scientific literature
- High learning curve for new users

## Solution Overview

The Query Translation API addresses these challenges by implementing a sophisticated natural language processing pipeline that:

1. **Accepts natural language queries** from users
2. **Extracts key entities and intents** using a Large Language Model
3. **Resolves entities** against an embedding store for semantic matching
4. **Translates the extracted information** into structured Dimensions queries
5. **Returns both the formatted query URL** and relevant search results

The system transforms casual user questions like *"Find chemistry papers published in Nature after 2020"* into precise database queries that can be executed against the Dimensions database.

## Technical Architecture

### Technology Stack

- **Backend Framework**: FastAPI
- **Language Model Integration**: LangChain with OpenAI
- **Vector Database**: PostgreSQL with pgvector
- **Search Engine**: Solr
- **Containerization**: Docker, Kubernetes (via Skaffold)
- **CI/CD**: GitLab CI
- **Monitoring**: Sentry, Prometheus
- **Testing**: Pytest with VCR for API mocking

### Key Components

#### Entity Extraction Service

The GPTExtractorService leverages large language models to parse natural language queries and extract structured entities according to predefined schemas. This service forms the initial processing layer that identifies what the user is looking for.

#### Schema Definitions

The system defines a comprehensive set of dimension resources that represent the different facets of research data, including:

- Researchers and author information
- Publication sources and journals
- Year ranges and temporal filtering
- Open access status and availability
- Citation metrics and impact scores
- Altmetric scores and social engagement
- Research organizations and affiliations
- Funding information and grants

Each dimension implements specialized query methods that transform natural language entities into structured query parameters.

### Architecture Flow

The system follows a microservice architecture pattern:

1. **User Interface**: Accepts natural language queries
2. **Translator Service**: Orchestrates the translation pipeline
3. **LLM Integration**: Performs entity extraction and query generation
4. **Embedding Store**: Provides semantic search capabilities for entity resolution
5. **Dimensions DB Interface**: Executes the generated queries against the database

## Challenges and Solutions

### Entity Resolution Accuracy

**Challenge**: Accurately mapping vague or ambiguous terms in user queries to specific entities in the database.

**Solution**: Implemented semantic search using vector embeddings stored in PostgreSQL, allowing fuzzy matching of concepts rather than requiring exact terminology. This approach significantly improved entity resolution for researcher names, journal titles, and subject areas.

### Query Optimization

**Challenge**: Translating complex natural language into efficient database queries.

**Solution**: Developed specialized query generation patterns for each dimension type, ensuring the produced queries follow optimization best practices. The system also implements caching via Redis to improve performance for common query patterns.

### Deployment and Scaling

**Challenge**: Ensuring consistent performance under varying load conditions.

**Solution**: Containerized the application using Docker and implemented Kubernetes deployment via Skaffold, with environment-specific configurations for development and production environments. This approach allows for horizontal scaling and simplified deployment across different infrastructure environments.

## Impact and Results

The Query Translation API delivers several significant benefits:

### Democratized Access
Researchers without database query expertise can now effectively search complex research datasets using natural language.

### Time Efficiency
Users can find relevant research papers, grants, and patents significantly faster than with traditional query methods.

### Improved Discovery
The semantic matching capabilities help users discover relevant research they might have missed with keyword-only searches.

### Cross-Domain Integration
The system supports queries across multiple Dimensions data types (publications, grants, clinical trials, patents), enabling more comprehensive research exploration.

## Key Achievements

- **Architected end-to-end system** from concept to production deployment
- **Designed sophisticated NLP pipelines** for entity extraction and query translation
- **Integrated vector search capabilities** using PostgreSQL with pgvector
- **Orchestrated comprehensive CI/CD** with GitLab CI for automated testing and deployment
- **Ensured production scalability** with Docker-Kubernetes infrastructure
- **Implemented comprehensive monitoring** with Sentry and Prometheus

## Conclusion

The ScarletLilyBeetle project represents a successful application of modern NLP and vector search technologies to solve a practical problem in research data access. By creating an intuitive bridge between natural language and structured database queries, it significantly lowers the barrier to engaging with complex research datasets.

The project demonstrates effective integration of LLMs with traditional database systems, showcasing a hybrid approach that leverages the strengths of both technologies. The architecture provides a blueprint for similar translation services in other domains where technical query languages create accessibility challenges.

Future enhancements could include expanding the supported entity types, improving multi-intent query handling, and developing more sophisticated disambiguation strategies for complex research concepts.
