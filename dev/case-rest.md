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
  block: feature-no-image
  slug: hi-level
  headline: High-level Design
  content: |
    The High-level components I chose were as follows:
      - A REST API to support the CRUD operations.
      - A File Store for reports themselves.
      - A sql Store for the reports metadata, the user metadata and the individual metrics storage.
      - A queuing service to validate and process the reports.
      - A queueing service to process the reports metrics.
      - An Authenthication service for controlling the users permissions.
      - The reports must follow the COUNTER code of practice format
      
    In terms of deployment
      - I put a gateway service in front of everything.
      - And the API, Authenthication, and quein services are all deploy via containers.


- template: content-feature
  block: mermaid-1
  slug: hi-diagram
  caption: High level Flow diagram
  diagram: |
    graph TD;
        Gateway[Gateway Service] --> API[REST API]
        API --> Auth[Authentication Service]
        API --> QSR[Queue Service for Reports]
        API --> QSM[Queue Service for Metrics]
        
        API --> MySQL[MySQL Store]

        
        Auth --> MySQL
        
        QSR --> FileStore[File Store]
        QSR --> MySQL
        
        QSM --> MySQL
        QSM --> Elastic[ElasticSearch]
        
        FileStore --> S3[S3 Bucket]
        
        Elastic --> AWS[AWS OpenSearch]
        
        subgraph Containerized Services
            API
            Auth
            QSR
            QSM
        end
        
        subgraph AWS Services
            Gateway
        end

        subgraph AWS Storage Services
            S3
            AWS
            MySQL
            Elastic
        end

- template: content-feature
  block: mermaid-1
  slug: hi-diagram
  caption: System Sequence Diagram
  diagram: |
    sequenceDiagram
        participant Gateway as Gateway Service
        participant API as REST API
        participant Auth as Authentication Service
        participant QSR as Queue Service for Reports
        participant QSM as Queue Service for Metrics
        participant MySQL as MySQL Store
        participant FileStore as File Store[S3]
        participant MetricsQueryStore as Metrics Query Store[ES]
        
        Gateway->>API: Forward Request
        API->>Auth: Verify User
        Auth-->>MySQL: Check Credentials
        Auth-->>API: Auth Response
        
        alt CRUD Operations
            API->>MySQL: CRUD on Reports' Metadata
            API->>FileStore: CRUD on Reports
        else Metrics Processing
            QSR->>QSM: Process Metrics
            QSM->>MySQL: Store Metrics for persistency
            QSM->>MetricsQueryStore: Store Metrics for query
        else Report Processing
            API->>QSR: Validate and Process Report
            QSR->>MySQL: Store Report Metadata
            QSR->>FileStore: Store Report File
        end
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




