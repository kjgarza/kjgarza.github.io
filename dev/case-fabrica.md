---
layout: blocks
title: Kristian Garza - REST
date: 2022-01-22T23:00:00.000+00:00
type: "design"
page_sections:
- template: content-feature
  block: hero-1
  slug: desing-system
  heading:  Usage metrics Service
- template: content-feature
  block: list-1
  slug: requirementes-list
  headline: Requirements 
  items:
    - headline: Functional
      items:
        - Manage (create, edit, access, and delete) usage metrics reports.
        - Authenthication for ceratin operations
        - Generate PIDs for every metadata deposit
        - Metrics in the reports needs to be easly query across reports.
    - headline: Non-functional
      items:
        - Use standard protocols
        - 99% uptime
        - reports can be as large as 40MB
- template: content-feature
  block: role
  slug: role
  columns: 
  - headline: My Contribution
    content:
    - Systems Design
    - Implementation
    - Debugging
    - QA
  - headline: Main learning
    content: 
    - I learned the importance of designing APIs for scalability. 
  - headline: Main challenge
    content: 
     - We faced frequent changes in requirements, which meant a lot of code had to be reworked
  - headline: Tools
    content: 
     - Ruby on Rails
     - MySQL, S3 and ElasticSearch
     - AWS, Docker
  - headline: Year
    content: 
     - 2018

- template: content-feature
  block: mermaid-1
  slug: hi-diagram
  caption: Block diagram
  diagram: |
    sequenceDiagram
        participant User
        participant App
        participant OpenAI API
        participant Web Crawler
        participant DataCite REST API
        participant Fabrica

        User->>App: Provide Credentials
        App-->>User: Authenticate and Redirect to Main Page

        User->>App: Provide Metadata (Various Formats)
        App->>OpenAI API: Transform Metadata to DataCite 4.4
        OpenAI API-->>App: Return Transformed Metadata

        User->>App: Provide URL as Metadata Input
        App->>Web Crawler: Crawl and Scrape URL Content
        Web Crawler-->>App: Return Scraped Content
        App->>OpenAI API: Transform Scraped Content to DataCite 4.4
        OpenAI API-->>App: Return Transformed Metadata

        User->>App: Provide Title String as Metadata Input
        App->>OpenAI API: Transform Title String to DataCite 4.4
        OpenAI API-->>App: Return Transformed Metadata

        User->>App: Provide Multiple Metadata Inputs
        App->>OpenAI API: Transform Multiple Inputs Concurrently
        OpenAI API-->>App: Return Transformed Metadata

        App->>App: Validate Metadata Schema Compliance
        App->>DataCite REST API: Create Record for Valid Metadata
        DataCite REST API-->>App: Confirm Record Creation
        App-->>User: Display Confirmation/Result

        DataCite REST API-->>App: Return Response (200)
        App->>App: Process Successful Response
        App-->>Fabrica: Redirect to Fabrica Edit Page 

        OpenAI API-->>App: Return Response (!= 200)
        App-->>User: Display Transformation Error Message

        Web Crawler-->>App: Return Response (!= 200)
        App-->>User: Display Web Crawling Error Message

        DataCite REST API-->>App: Return Response (!= 200)
        App-->>User: Display Record Creation Error Message
- template: content-feature
  block: feature-no-image
  slug: lo-level
  headline: Low-level Design
  content: |
    In terms of technology:
      - We selected Rails as framework for the all the services.
      - For the storage we use a combination: MySQL for persistent storage of the reports metadata, the user metadata, and the metrics; S3 for the file storage of the reports and Elasticsearch for storage of the metrics.
      - We use ElasticSearch for the storage of the metrics because it allows us to do quick aggregations and queries of the metrics independently of the report.
      - Deployment was done with AWS services. I use ECS for all the services and Mysql, S3 and OpenSearch to host the storage.

    - I also selected the jsonapi spec to deign the API. This way we can support very standard protocols and ways to manage the metadata deposits.

    Design Patterns

- template: content-feature
  block: media-1
  slug: websites
  image: "https://i.imgur.com/U4ztTVr.png"
- template: content-feature
  block: cta-1
  slug: next
  content: "Go to documentation"
  link: "https://support.datacite.org/docs/api"
- template: content-feature
  block: next-1
  slug: next
  headline: "Next Case Study"
  content: "GraphQL API ➔"
  link: "/dev/case-graphql.html"
---




