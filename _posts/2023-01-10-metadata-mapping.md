---
layout: post
category : pages
title: "Decoding Jargon: How ChatGPT will transform the generation of controlled Vocabulary Mappings"
tags : [ai, metadata, schema mapping, chatgpt, ontology mapping]
published: true
---

# Decoding Jargon: How ChatGPT will transform the generation of controlled Vocabulary Mappings 

<img src="/uploads/2022/02/19/2023-01-20_vocab.png" width="700">


As we stand on the cusp of a new era of artificial intelligence, the availability of easy-to-use, AI-powered tools that utilize large language models is poised to revolutionize how we approach vocabulary mapping in specialized domains.

[Large language models](https://en.wikipedia.org/wiki/Language_model), or LLMs, are a type of machine learning algorithm trained on vast amounts of text data to understand the intricacies and patterns of human language. These models have the potential to decode and interpret a text in a manner similar to human understanding, making them powerful tools for a wide range of tasks such translation (e.g. DeepL) and vocabulary mapping.

Traditionally, vocabulary mapping in specialized domains such as medicine or law has been labor-intensive, requiring significant time and expertise to identify and extract key terms and phrases specific to the domain in question. For example, last year, I participated in a Task Force in which a group of experts got together to generate a mapping between the OECD Field of Science vocabulary and the DFG-Fachsystematik classification; both controlled vocabularies are used to classify items in terms of scientific domain. We worked for a couple of weeks, having discussions and multiple mapping sessions to produce a final mapping. The results of that work can be found in [Zenodo](https://doi.org/10.5281/zenodo.5176121). Today, with the advent of easy-to-use, AI-powered tools, such as [ChatGPT](https://openai.com/blog/chatgpt/), this process can now be automated, significantly reducing the time and resources required.

Through the power of large language models, these tools can potentially analyze controlled vocabularies from specialized domains and automatically identify matching key terms and phrases. This process can be done quickly and with a good level of accuracy, resulting in a specialized vocabulary map that can be used to help non-experts understand the jargon used in the domain or to normalise terms across multiple domians. 

To confirm this assertion, I ran a small experiment. I asked chatGPT to mapt two specialised vocabularies. I took the same vocabularies as in [Garza et al., 2021](https://doi.org/10.5281/zenodo.5176121) and submitted a few prompts to chatGPT. In a matter of seconds, chatGPT was able to map both vocabularies, but the results were mixed, and I had to refine them in dialogue with the bot. 


### High-Level Mapping

When mapping high-level categories, the results were excellent in the matching was very similar to what we get in mapping with experts. There was little to no need to add further propmts. The results can be seen below.


https://gist.github.com/kjgarza/d762bd08cc14f1af372cdf69ae38a35b


### Detail Level Mapping

On the other hand, the detail-level mapping resulted in strange results; chatGPT even made up new terms. The task at this level seem to be more complex for the AI. It is acknowledged that the GPT3.5 model can fail in complex tasks but there are a few simple techniques that can help to solve that. To tackle the detail-level mapping, I employed two strategies: [(a) splitting the complex task and (b) structure the instruction to keep the model on task](https://github.com/openai/openai-cookbook/blob/main/techniques_to_improve_reliability.md). Initially, my prompts divided the mapping into segments, and then, instead of specifying which vocabulary to map, I included the vocabulary to be mapped within the prompts, thereby simplifying the context of the vocabulary.


The use of both techniques significantly improved the detail-level mapping, but also, new things started to happen. ChatGPT started suggesting inter-level mapping. Inter-level mapping is when an applicable term is not found in the low-level terms then the bot uses the higher-level terms. This suggestion is astonishing and useful, as inter-level mapping was a topic of considerable discussion in [Garza et al., 2021](https://doi.org/10.5281/zenodo.5176121). The spreadsheet below shows the results compared to expert-drive mapping.

https://docs.google.com/spreadsheets/d/14BMMezqUNfacU-UP-0QGszF_ixZFaf2gNNOngAg4Zyc/edit?usp=sharing


The ease of access to these tools also means that more people will have the ability to perform vocabulary mapping in specialized domains, leading to a broader understanding and representation of the specialized language and terminology. This ease of access could be especially valuable for communities, working groups, or task forces who may not previously have access to the resources necessary for vocabulary mapping.

Nevertheless, chatGPT is still in its infancy and has not been proven to be better than humans. The example presented here is just one case. As we saw, the AI makes errors and produces biased output, and its ability to understand the context of the text and its in-depth meaning is limited. The current limitations can potentially mean that new tools must be developed on top of the current LLMs. New tools can use existing models, such as GPT-3.5, then train them to create "the one model" for controlled Vocabulary Mapping.


In conclusion, the availability of easy-to-use, model AI-powered tools that utilize large language models is poised to revolutionize how we approach controlled vocabulary mapping in specialized domains. These tools can quickly and accurately identify and match key terms and phrases and facilitate better understanding and communication within and between specialized disciplines while being more accessible to a broader range of people. We are on the threshold of a new era in which we can unlock a deeper understanding of specialized language thanks to the power of artificial intelligence.

I think this is an exciting field with a lot of potentials, and I would be happy to engage in a dialogue about the possibilities and implications of this technology. If you have any questions or insights on this topic, please do not hesitate to reach out.







