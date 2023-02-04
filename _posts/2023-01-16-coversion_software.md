---
layout: post
category: pages
title: "Revolutionizing Metadata Mapping with ChatGPT"
tags: [ai, metadata, schema mapping, chatgpt, rda]
published: true
---

# Revolutionizing Metadata Mapping with ChatGPT

<img src="/uploads/2022/02/19/2023-01-20_transform_meatdata.png" width="700">

Large language models have been making waves in artificial intelligence for a good reason. These models have the ability to understand and generate human language, which has far-reaching implications for the future of technology. One area where these models have a significant impact is in the realm of software development. Specifically, with Github Copilot and ChatGPT, large language models might possibly transform how we write and understand code. In this post, I'd like to discuss the potential impact that language models could have on metadata mapping.

On the one hand, it is easy to see how large language models could greatly simplify the process of writing and understanding code. Currently, software developers must spend a significant amount of time learning the intricacies of different programming languages, and even then, they often struggle to understand code written by others. With large language models, like those in Github Copilot, developers can simply describe their desired program in plain language, and the model would convert that description into working code. These benefits would save developers time and make it easier for non-experts to understand and modify code.

Another potential use for large language models is their ability to transform data from one schema to another without the need for manual coding. Metadata transformation AI-powered tools could be especially useful for organizations that need to integrate data from multiple sources, such as from different institutions, metadata models, or from external partners.

Currently, the metadata transformation process can be tedious and error-prone, as developers must write code to extract, transform, and load the data. In the case of DOI metadata, there exist libraries and services that provide such features, such as [Bolognese](https://github.com/datacite/bolognese) and [Crosscite Content Negotiation](https://support.datacite.org/docs/datacite-content-resolver0). However, even these tools require constant updating when new versions of metadata schemas are released. The coding is time-consuming, and the generation of mappings between multiple schemas also takes significant effort; the [Research Metadata Schemas Working Group](https://www.rd-alliance.org/groups/research-metadata-schemas-wg) of the Research Data Alliance dedicates much time to generating such mappings and crosswalks.

With large language models, however, this process could be significantly simplified. Developers could simply describe the desired schema, and the model automatically generates the necessary code to transform the data. Using LLMs would not only save time but also reduce the risk of errors, which could lead to data loss or corruption.

In my experiments, I have been using a large language model and a Chain-of-Thought (CoT) approach to generate software for creating schema mappings. The results have been interesting. To demonstrate this, we can look at a few experiments.

- The first experiment shows the capabilities of ChatGPT to generate code for schema transformation.
- The second experiment shows how the GPT-3.5 model can be used to convert data from one schema to another, removing the need to write code completely. 

## Generating Code for schema transformation

To generate a prompt for ChatGPT and include a set of constraints. These were:

- To use a [Facade design pattern](https://en.wikipedia.org/wiki/Facade_pattern) for the transformation.
- To transform [Datacite Metadata](https://schema.datacite.org/meta/kernel-4.4/doc/DataCite-MetadataKernel_v4.4.pdf) to Crossref Metadata
- To use [Kotlin](https://kotlinlang.org/) as the language to implement the code

Prompt:

> Act as a Senior kotlin Developer. I will give you a set of Project and functional Requirements and you will write the code to accomplish that project using the kotlin language.  
>
> Project Requirements:  
> - Write the code for a metadata converter.  
> - Use schema.org as exchange format.  
> - Include all mandatory and recommended fields in the DataCite schema to the converter's DataCite metadata model  
> - Use a facade design pattern to create the converter.  
>
> Functional requirements:  
> Given that program receives a XML file that contains metadata in DataCite Schema. Then the program should take the file and map it to the appropriate Crossref type. And The program should output the result of the mapping into a XML file. Let's think step by step.  


The results (below) are not perfect, but they are promising and extremely helpful. ChatGPT was able to create the needed data model and main functions for the facade pattern but omitted the parsing logic for each function.


```kotlin

class MetadataConverter {
    fun convert(inputFormat: String, input: String, outputFormat: String): String {
        val metadata = when (inputFormat) {
            "datacite" -> parseDataCiteMetadata(input)
            "crossref" -> parseCrossrefMetadata(input)
            else -> throw IllegalArgumentException("Unsupported input format: $inputFormat")
        }
        return when (outputFormat) {
            "schema" -> serializeSchemaMetadata(metadata)
            else -> throw IllegalArgumentException("Unsupported output format: $outputFormat")
        }
    }

    private fun parseCrossrefMetadata(input: String): CrossrefMetadata {
        // Parsing logic here
    }

    private fun parseDataCiteMetadata(input: String): DataCiteMetadata {
        // Parsing logic here
    }

    private fun serializeSchemaMetadata(metadata: DataCiteMetadata): String {
        // Serialization logic here
    }
}

```

Following a Chain-of-Thought approach, I used the results of the first propmt to generate the code for the parsing and serializing logic. Furthermore, I asked ChaGPT to include all mandatory and recommended fields of the schemas. The results have been impressive; ChatGPT was able to generate the logic and the metadata model without inputting any mapping. All the files generated can be found in [github](https://gist.github.com/kjgarza/2b1be71e3d2a2a4e700b546af794960b)

While it is clear that large language models and the Chain-of-Thought approach have the potential to reduce the manual labor involved in metadata mapping significantly, it is evident that they will not replace software developers completely. Developers are still needed to architect the software and ensure that it is designed in a way that makes the best use of these language models.

## Forget about Code; just transfrom the data

<img src="/uploads/2022/02/19/2023-01-20_comparison.png" width="600">

The second experiment is different; why bother transforming the code when the GPT-3.5 model already knows about Datacite Schema and Crossref Schema? I can ask the GPT-3.5 model, via ChatGPT, to covert data from one schema to another. The example below shows that. I took the metadata of a DOI in Crossref schema (i.e., [10.1002/EJIC.201900339](https://doi.org/10.1002/EJIC.201900339))  and used it as a prompt to convert to DataCite Schema. I had to trim the metadata a bit as it has too many relationships, but it is good enough to check the conversation. Then compared, the results with the metadata conversion using Crosscite Content Negotiation (a service maintained by Crossref and DataCite). Finally, I validated the resulting metadata against the DataCite API validation.


<img src="/uploads/2022/02/19/Capture-2023-01-17-115718.png" width="400">


Overall the results are excellent. The first chatGPT conversion in valid DataCite metadata indicates that it understands the DataCite Metadata. Second, in terms of the comparison, the results are very positive but not perfect. Mandatory fields mapped corrected. ChatGPT also made some interpretations to enrich the metadata with "subjects" and a "description." Optional fields like dates and funding had mixed results, but they are not inaccurate. 

The results from both experiments are promising. Both examples show that the LLM model is aware of the different schemas,their properties, formats, software patterns, languages, and syntax. 

Nevertheless, it is important to consider the potential for bias in large language models. Language is inherently subjective, and if models are trained on biased data, they may perpetuate that bias in the code or mappings they generate. For example, what happens when the model chooses to translate to an older version of the schema instead of the newest one? Such biases could lead to unintended consequences and discrimination in the programs and systems we build. 

In short, I believe that the use of large language models can potentially significantly transform the way we map metadata schema models. By automating the process and reducing the need for manual labor, we can improve the efficiency and accuracy of metadata mapping. As language models continue to improve, I would not be surprised if we see even more drastic transformations in the future.

So, there you have it. The potential of large language models to transform metadata mapping is enormous. It is an exciting time to work in this field, and I cannot wait to see what the future holds.







