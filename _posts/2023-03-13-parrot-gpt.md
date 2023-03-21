---
layout: post
category: pages
title: "ParrotGPT: On the Advantages of Large Language Models Tools for Academic Metadata Schema Mapping"
tags: [ai, metadata, schema, crosswalk, chatgpt, rda, eosc]
published: true
---

# ParrotGPT: On the Advantages of Large Language Models Tools for Academic Metadata Schema Mapping

<img src="/uploads/2023/03/16/parrot-crosswalk-180323-min.png" width="700">

Picture, if you will, the labyrinthine world of academic information management, where metadata schema mapping serves as a vital underpinning for the exchange and intermingling of data across diverse platforms and systems. This arena has long been dominated by the venerable metadata schema crosswalk, which, though serviceable, has begun to show its age. The [traditional method of creating metadata schema crosswalks](https://medium.com/@kj.garza/revolutionizing-metadata-schema-mapping-with-chatgpt-a8df54e41e24) is a time-consuming and monotonous task that requires significant coordination. Enter the digital behemoths known as large language models (LLMs), whose unparalleled prowess in understanding and generating the complex tapestry of human language has opened up a new frontier in metadata schema mapping. I think LLMs present a far superior alternative to the traditional crosswalks of yore.


The LLMs have undergone significant improvements and can perform scholarly metadata mapping with minimal input. 
In a [previous blogpost](https://medium.com/@kj.garza/revolutionizing-metadata-schema-mapping-with-chatgpt-a8df54e41e24), I showed that with a short prompt, the LLM behind ChatGPT can convert metadata from Crossref schema to DataCite schema with great accuracy and even metadata enrichment. Among the multiple GPT-3 models available, the "Davinci" model stands out as the most powerful and efficient at this task. Compared with other GPT-3 models such as [ADA](https://platform.openai.com/docs/models/gpt-3) and [Curie](https://platform.openai.com/docs/models/gpt-3) it performs way better in terms of metadata transformation. "Davinci" has been trained on different datasets, which makes it capable of handling various metadata schema mapping. This level of precision is challenging to achieve with crosswalks, which require a considerable amount of manual input to create and maintain.

Furthermore, the [newly released GPT-4 model](https://openai.com/research/gpt-4) is more accurate and can perform tasks that previous GPT-3 family models will give up on performing. For example, while mapping metadata is a task that all GPT-family models can perform with different degrees of accuracy, generating a crosswalk of two schemas is a task that the GPT-3 family models will reject performing. GPT-4 models do perform that task with good results when compared to [expert crosswalks](https://zenodo.org/record/7661399#.ZBcMaOzMI-Q). Below you can see how the GPT-4 generates a crosswalk between DataCite Schema and schema.org (type ResearchProject) schema.

<img src="/uploads/2023/03/16/gpt4-schema-org-2.png" width="500">

## Tools to interact with Large Language models

In an effort to harness the full potential of all the GPT models for metadata schema mapping, I have taken it upon myself to develop the Python package, [Parrot-GPT](https://github.com/kjgarza/parrot_gpt). This tool utilizes the formidable GPT-3 models to effortlessly translate metadata from one schema to another, all the while obviating the need for the manual creation and upkeep of crosswalks, thus bestowing upon its users the gift of time and resource savings. As of this publication, I am working on [incorporating](https://github.com/kjgarza/parrot_gpt/issues/1) the new [OpenAI Chat API syntax for GPT-3.5 and 4](https://platform.openai.com/docs/guides/chat/introduction). Contributions are [welcomed](https://github.com/kjgarza/parrot_gpt/blob/main/CONTRIBUTING.rst).


### Continuous Adaptation in the LLM's Realm

Consider the crosswalk, which, much like an aging, inflexible cartographer, finds itself unable to evolve with minimal intervention. In stark contrast, the LLM-based mapping is a veritable chameleon, gracefully adapting to new schema properties and maintaining accuracy in its ever-changing environment. Furthermore, Parrot-GPT can even generate metadata for new schema properties, making it a truly versatile tool for metadata management.

Parrot-GPT can also be used to generate metadata from new schema properties. In an experiment, I created metadata with new fields and translated metadata from one schema to another. The goal of this experiment is to demonstrate the ability of the LLM behind Parrot_GPT to correctly map metadata fields from one schema to another, even when new fields are introduced that were not present in the original schema.

To begin the experiment, a metadata file was created with a new field that did not exist in DataCite Schema, but an analogous field is present in the DCAT schema. Then Parrot_GPT was then asked to convert the metadata file from DataCite Schema to DCAT schema, with no prior knowledge of the mapping between the two schemas. For the new field, I choose the "distribution" a field that currently does not exist in DataCite schema 4.4, but it will be included soon in [version 4.5](https://docs.google.com/document/d/1UyQQwtjnu-4_4zXE4TFZ74-mjLZI3NkEf8RrF0WeOdI). I took the example from the examples that [DataCite is preparing for the new schema release](https://github.com/datacite/schema/blob/schema-4.5/source/meta/kernel-4.5/example/datacite-distribution1-v4.xml)

Parrot_GPT can be run directly from the CLI specifying the file to transform {-mf}, the input schema {-i}, and the output schema {-t}. I transformed this DataCite Schema 4.5 metadata file in the example below to the DCAT schema. Input and output files can be found in [github](https://gist.github.com/kjgarza/6bbd6b0653d7ade6c7a67c954d926fed).


```shell
python -m parrot_gpt.cli -mf tests/example-distribution.xml -i datacite_xml -t DCAT > output.rdf
```

The results were promising, demonstrating that LLM mapping can handle new schema properties with minimal intervention. 
The new field "distribution" was correctly mapped to the [DCAT class distribution](https://w3c.github.io/dxwg/dcat/#Class:Distribution); all sub-properties were also correctly mapped. Interestingly the LLM chose to map DataCite `contentUrl` property to the DCAT `accessUrl` property, which one could argue is not the most suitable candidate. A few more interactions of the same experiment show that the model would choose the `downloadUrl` property on certain occasions instead. This raises a question about the model variable decision-making. Nevertheless, it is feasible to fine-tune this kind of issue with [model fine-tuning](https://platform.openai.com/docs/guides/fine-tuning). Overall this capability makes LLM mapping more flexible and adaptable than crosswalks.

I think the experiment supports the effectiveness of using LLMs for metadata schema mapping, as they can handle new and unexpected metadata fields with minimal additional input or intervention. We need to explore whether further fine-tuning can improve this general model. These capabilities make LLM mapping a highly scalable and efficient solution for managing metadata schemas in academic institutions and other organizations that deal with large volumes of data.

## The diminishment of the LLMs drawbacks   

Despite its advantages, using LLMs for metadata schema mapping has some drawbacks. One such drawback is the limited accuracy of LLMs when dealing with complex and nuanced metadata schemas. Human intervention may still be necessary to ensure accuracy, as we saw in the experiments. On the other hand, creating metadata schema crosswalks can be a tedious and manual process that requires continuous updates to ensure accuracy. Additionally, crosswalks may not be as scalable as LLMs in handling the proliferation of new schemas and their fast-pacing evolution. 

<img src="https://imgs.xkcd.com/comics/standards.png">


Large language models, particularly state-of-the-art models like "GPT-3", require substantial computational resources to run. This may present a barrier for smaller institutions or those with limited budgets. In contrast, traditional crosswalks can be created and maintained with significantly less computational power. However, recent developments have made LLMs-based services truly affordable. While writing this article, Microsoft Azure just announced [Azure OpenAI Service](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) providing REST API access to OpenAI's powerful language models, including the GPT-3, Codex and Embeddings model series with very affordable prices. This very month, the [inference of Facebook's LLaMA model](https://news.ycombinator.com/item?id=35100086) was published in pure C/C++, allowing anybody to run a model of similar capabilities to GPT-3 directly from a MacBook. 

In conclusion, allow me to reiterate that the utilization of large language models for mapping academic metadata schemas represents a transcendent method when compared to the creation of metadata schema crosswalks. Through the development of the [Parrot-GPT Python package](https://parrot-gpt.readthedocs.io), we have unlocked seamless schema mapping, continuous adaptation to new schema properties, and the generation of metadata for novel fields. The results of this experiment serve as a testimony to the myriad advantages of using LLMs for metadata schema mapping, thus making a compelling case for their adoption in the hallowed halls of academic information management systems. 

The dawn of this new metadata mapping era, fueled by large language models, sparks immense enthusiasm. As we delve further into these groundbreaking technologies, I look forward to a more interconnected, efficient future in academic information management.






<!-- 

## gpt4

Title: In the Light of Artificial Linguistic Giants: A Treatise on the Advantages of Large Language Models for Academic Metadata Schema Mapping

Introduction:

Picture, if you will, the labyrinthine world of academic information management, where metadata schema mapping serves as a vital underpinning for the exchange and intermingling of data across diverse platforms and systems. This arena has long been dominated by the venerable metadata schema crosswalk, which, though serviceable, has begun to show its age. Enter the digital behemoths known as large language models (LLMs), whose unparalleled prowess in understanding and generating the complex tapestry of human language has opened up a new frontier in metadata schema mapping. The thesis of this essay, dear reader, is that these LLMs present a far superior alternative to the traditional crosswalks of yore.

The Prodigious Growth of Large Language Models:
Within the ever-advancing field of artificial intelligence, the formidable LLMs have exhibited considerable progress, now capable of tackling intricate linguistic tasks with nary a hint of guidance. A recent comparison among these digital giants demonstrated that the so-called "davinci" model stands head and shoulders above its peers, making it the top contender for the task of metadata schema mapping.

The Birth of Parrot-GPT:
In an effort to harness the full potential of the "davinci" model for metadata schema mapping, we have taken it upon ourselves to develop the Python package, Parrot-GPT. This remarkable tool utilizes the formidable "davinci" to effortlessly translate metadata from one schema to another, all the while obviating the need for the manual creation and upkeep of crosswalks, thus bestowing upon its users the gift of time and resource savings.

Continuous Adaptation in the LLM's Realm:
Consider the crosswalk, which, much like an aging, inflexible cartographer, finds itself unable to evolve with minimal intervention. In stark contrast, the LLM-based mapping is a veritable chameleon, gracefully adapting to new schema properties and maintaining accuracy in its ever-changing environment. Furthermore, Parrot-GPT can even generate metadata for new schema properties, making it a truly versatile tool for metadata management.

Experimentation and the Pursuit of Truth:

To substantiate our claims, we embarked on an experiment involving the creation of metadata with new fields and the translation of metadata from one schema to another. Lo and behold, the results were nothing short of breathtaking. Parrot-GPT successfully generated metadata for the new schema properties and accurately translated metadata between schemas, thereby illustrating the undeniable superiority of LLMs over their crosswalk counterparts in matters of adaptability, accuracy, and efficiency.
Conclusion:

In conclusion, dear reader, allow me to reiterate that the utilization of large language models, particularly the "davinci" model, for the mapping of academic metadata schemas represents a transcendent method when compared to the creation of metadata schema crosswalks. Through the development of the Parrot-GPT Python package, we have unlocked seamless schema mapping, continuous adaptation to new schema properties, and the generation of metadata for novel fields. The results of our experiment serve as a testimony to the myriad advantages of using LLMs for metadata schema mapping, thus making a compelling case for their adoption in the hallowed halls of academic information management systems.


## original

Metadata schema generation is a crucial process in the organization and management of digital information. However, creating metadata schemas crosswalks to map different schemas has been a tedious and time-consuming process. Thanks to the advancement of technology, the use of large language models (LLMs) has revolutionized metadata schema mapping. In this essay, I will argue that using LLMs for mapping academic metadata schemas is a better method than creating metadata schema crosswalks.

LLMs have improved so much that they can do mapping with little input. The accuracy of LLMs has been tested by comparing multiple models, and the "Davinci" model has been found to be the best. This model is incredibly powerful and can process a vast amount of data in a short period. It has been trained on diverse datasets and can handle different kinds of metadata schema mapping. This level of precision is difficult to achieve with crosswalks, which require a lot of manual input to create and maintain.

Parrot-GPT is a python package I created to use LLM models to translate metadata from one schema to another. With this package, users can quickly generate a mapping between different metadata schemas. This software can be easily integrated into existing systems, and it provides an efficient and automated solution for metadata schema mapping. Unlike crosswalks, Parrot-GPT requires minimal human intervention, making it more time-efficient and cost-effective.


## Counterarguments for using LLMs for mapping academic metadata schemas:

Limited accuracy: While LLMs have improved significantly, they still have limitations in their accuracy, especially when it comes to handling complex and nuanced metadata schemas. Human input and intervention may still be required to ensure accuracy.

High cost: Implementing LLMs for metadata schema mapping may come at a high cost, especially for smaller organizations or academic institutions. The cost of purchasing and maintaining LLMs may be prohibitive, making crosswalks a more feasible solution.

Limited flexibility: LLMs may not be as flexible as crosswalks in handling unique metadata schema requirements. Crosswalks can be customized to meet specific needs, while LLMs may have limitations in their adaptability.

Counterarguments for creating metadata schema crosswalks:

Manual input: Creating and maintaining crosswalks requires a significant amount of manual input, which can be time-consuming and costly. Crosswalks may require continuous updating as metadata schemas change, leading to additional costs and workload.

Limited scalability: Crosswalks may not be as scalable as LLMs in handling a large volume of metadata schemas. Crosswalks may require human intervention to scale, while LLMs can handle a larger volume of metadata schema mapping without human intervention.

Limited accuracy: Crosswalks may have limitations in their accuracy, especially when dealing with complex and nuanced metadata schemas. Crosswalks may require continuous updating to ensure accuracy, leading to additional costs and workload.

In conclusion, while both LLMs and crosswalks have their advantages and disadvantages, it is essential to consider the unique needs and requirements of the academic institution when selecting a metadata schema mapping solution. LLMs may offer a more efficient and effective solution in handling a large volume of metadata schemas, while crosswalks may offer more customization and flexibility.


So, there you have it. The potential of large language models to transform metadata mapping is enormous. It is an exciting time to work in this field, and I cannot wait to see what the future holds.



## suggest 5 titles for this essay in the style of the new yorker magazine
"The Revolutionizing Role of Large Language Models in Metadata Schema Generation"
"The Better Way to Map Academic Metadata Schemas: Large Language Models or Crosswalks?"
"Simplifying Metadata Schema Mapping: The Advantages of Large Language Models"
"Metadata Schema Crosswalks vs. Large Language Models: A New Era in Data Management"
"Parrot-GPT: The Python Package Changing the Game for Academic Metadata Schema Mapping"



## suggest 5 tweets to promote this essay online

"Are metadata schema crosswalks a thing of the past? Discover how large language models are revolutionizing academic data management in our latest essay. #metadata #LLMs #datamanagement"
"Tired of manual metadata schema mapping? Check out Parrot-GPT, the python package that leverages large language models for efficient and automated mapping. #ParrotGPT #LLMs #datamanagement"
"Looking for a better way to map academic metadata schemas? Our latest essay breaks down the advantages of using large language models over traditional crosswalks. #metadata #LLMs #datamanagement"
"Metadata schema mapping made easy with the power of large language models. Discover the advantages in our latest essay. #metadata #LLMs #datamanagement"
"Metadata schema generation may not be the most exciting topic, but it's essential for data management. Find out how large language models are changing the game in our latest essay. #metadata #LLMs #datamanagement"



## suggest 5 reddit titles to promote this essay in reddit
"How to map metadata without Schema Crosswalks wiht Parrot_GPT?"
"Say Goodbye to Tedious Metadata Schema Crosswalks - Large Language Models Are the Future!"
"Parrot-GPT: The Python Package Making Metadata Schema Mapping More Efficient and Automated"
"Why Large Language Models Are the Better Method for Mapping Academic Metadata Schemas - A Comprehensive Essay"
"The Advantages of Large Language Models for Metadata Schema Mapping - Find Out More Here"
"Tired of Manual Metadata Schema Mapping? Discover the Advantages of Large Language Models in Our Latest Essay" -->