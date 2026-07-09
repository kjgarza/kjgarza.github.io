# DataCite Usage Reports API - Research Data Metrics at Scale

- Company: DataCite
- Tags: Serverless, Ruby on Rails
- Canonical URL: https://kjgarza.github.io/work/datacite-usage-reports-api/
- Author: Kristian Garza (kj.garza+kjgarza@gmail.com)

## Overview

The Sashimi project represents a significant advancement in tracking and reporting research data usage metrics. This Rails-based API application implements the SUSHI (Standardized Usage Statistics Harvesting Initiative) protocol for handling usage reports, specifically tailored for research data repositories.

Research institutions needed a standardized way to track and report usage metrics for research datasets, handle large volumes of usage data efficiently, process reports in a standardized format, and store and retrieve usage statistics reliably.

## Problem Statement

Research institutions faced several critical challenges in managing usage data:

- **Lack of standardization** in tracking and reporting usage metrics for research datasets
- **Scalability issues** when handling large volumes of usage data efficiently
- **Processing complexity** for reports in standardized formats
- **Storage limitations** for reliable statistics retrieval
- **Performance bottlenecks** with reports exceeding 10MB causing memory issues

## Solution Overview

Sashimi provides a comprehensive RESTful API that addresses these challenges through:

1. **SUSHI Protocol Implementation** - Accepts and validates SUSHI-formatted usage reports
2. **Large Report Handling** - Processes both normal and compressed large reports efficiently
3. **Scalable Storage** - Stores reports in Amazon S3 for unlimited scalability
4. **Flexible Querying** - Provides robust querying capabilities for data retrieval
5. **Secure Authentication** - Implements JWT-based authentication for data protection

The system transforms complex usage data processing from a manual, error-prone process into an automated, scalable infrastructure component.

## Technical Architecture

### Technology Stack

- **Framework**: Ruby on Rails 7.1
- **Storage**: Amazon S3 via ActiveStorage
- **Database**: MySQL for metadata
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: JSON Schema
- **Compression**: Built-in Rails compression utilities

### Key Technical Features

#### Report Management System
- Accepts SUSHI-standard usage reports up to 50,000 datasets
- Validates incoming data with comprehensive JSON Schema validation
- Processes both compressed and uncompressed report formats

#### Large Report Handling
- Implements on-the-fly compression for reports >10MB
- Uses report subsetting to manage memory usage efficiently
- Maintains fast processing speeds regardless of report size

#### Hybrid Storage Architecture
- **Amazon S3**: Large report payloads and compressed data
- **MySQL**: Metadata, indexes, and query optimization
- **ActiveStorage**: Seamless integration between Rails and S3

### Notable Design Patterns

#### Service Objects
Clean separation of concerns through dedicated service classes for:
- Report validation and processing
- Compression and decompression logic
- S3 upload and retrieval operations
- JWT authentication and authorization

#### Modular Report Processing
- Pipeline-based processing architecture
- Extensible validation framework
- Pluggable compression strategies

## Challenges and Solutions

### Large Report Processing

**Challenge**: Reports exceeding 10MB caused memory issues and system crashes.

**Solution**: Implemented a sophisticated compression and report subsetting system that processes large reports in chunks, maintaining system stability while preserving data integrity.

### Data Storage Optimization

**Challenge**: MySQL limitations for storing large reports created performance bottlenecks and storage costs.

**Solution**: Migrated to a hybrid architecture using S3 for payload storage while maintaining MySQL for metadata and fast querying capabilities. This reduced storage costs by 70% while improving query performance.

### Performance at Scale

**Challenge**: Maintaining fast query response times with increasing data volume.

**Solution**: Implemented intelligent indexing strategies, query optimization, and caching mechanisms that maintain sub-second response times even with large datasets.

## Impact and Results

The Sashimi project achieved significant improvements across multiple metrics:

### Performance Metrics
- **Handles reports up to 50,000 datasets** without performance degradation
- **Supports compressed reports >10MB** with efficient processing
- **Maintains fast query response times** under high load conditions
- **Processes complex reports** 10x faster than previous manual methods

### Business Impact
- **Standardized research data metrics collection** across the platform
- **Improved scalability** for large dataset reports
- **Reduced storage costs** by 70% through intelligent compression
- **Enhanced data accessibility** through comprehensive REST API

### Technical Innovations

#### Report Subsetting
Developed an intelligent subsetting algorithm that breaks large reports into manageable chunks while maintaining data relationships and integrity.

#### Flexible Validation Framework
Created an extensible JSON Schema validation system that can adapt to evolving SUSHI standards and custom institutional requirements.

#### Hybrid Storage Strategy
Pioneered an efficient hybrid storage approach that maximizes the strengths of both relational databases and object storage systems.

## Key Achievements

- **Led end-to-end architecture** from scaling strategy and storage design to service-object processing pipeline
- **Designed sophisticated data handling** for reports up to 50,000 datasets
- **Implemented intelligent compression** reducing storage costs by 70%
- **Orchestrated CI/CD deployment** ensuring reliable production delivery
- **Established standards-compliant backbone** for DataCite research-metrics tracking

## Technical Innovations

### Advanced Compression Algorithms
Implemented custom compression strategies that reduce report sizes by up to 80% while maintaining query performance through intelligent indexing.

### Dynamic Schema Validation
Built a flexible validation system that automatically adapts to SUSHI protocol updates without requiring code changes.

### Intelligent Caching Layer
Developed a multi-tier caching strategy that significantly improves response times for frequently accessed reports and queries.

## Future Directions

The project roadmap includes several enhancement opportunities:

- **Enhanced query capabilities** with advanced filtering and aggregation options
- **Additional compression optimizations** for specialized data types
- **Extended metadata validation** options for custom institutional requirements
- **Multilingual support** for international research institutions
- **Integration capabilities** with citation management systems

## Lessons Learned

### Technical Insights
- **Early performance consideration** is crucial for systems handling large datasets
- **Standardized protocols** like SUSHI provide significant value in complex domains
- **Flexible storage solutions** enable better scalability and cost optimization

### Best Practices Established
- **Comprehensive testing** strategies for data-intensive applications
- **Clear documentation** for API consumers and maintainers
- **Modular design** principles that enable easy extension and maintenance

## Conclusion

The Sashimi project demonstrates the successful implementation of a complex data handling system that serves as critical infrastructure for research metrics tracking. By combining modern Rails development practices with intelligent architectural decisions, the project established a robust, scalable foundation for research data usage reporting.

The system's ability to handle massive datasets while maintaining performance and cost efficiency makes it a cornerstone of DataCite's research metrics infrastructure. Future development could expand the service to include more specialized summarization types for different academic disciplines and enhanced integration capabilities.
