---
layout: post
category : pages
title: "Decoding Jargon: How large Language Models are Revolutionizing Vocabulary Mapping in Specialized Domains"
tags : [ai, metadata, schema mapping, chatgpt, ux]
published: true
---

<img src="/uploads/2022/02/19/2023-01-20_vocab.png" width="700">


As we stand on the cusp of a new era of artificial intelligence, the availability of easy-to-use, AI-powered tools that utilize large language models is poised to revolutionize how we approach vocabulary mapping in specialized domains.

Large language models, or LLMs, are a type of machine learning algorithm trained on vast amounts of text data to understand the intricacies and patterns of human language. These models have the potential to decode and interpret a text in a manner similar to human understanding, making them powerful tools for a wide range of tasks (e.g., translation with DeepL), including vocabulary mapping.

Traditionally, vocabulary mapping in specialized domains such as medicine or law has been labor-intensive, requiring significant time and expertise to identify and extract key terms and phrases specific to the domain in question. For example, last year, I participated in a Task Force in which a group of experts got together to generate a mapping between the OECD Field of Science vocabulary and DFG-Fachsystematik classification. We worked for a couple of weeks, having discussions and multiple mapping sessions to produce a final mapping. The results of that work can be found in [Zenodo](https://doi.org/10.5281/zenodo.5176121). However, with the advent of easy-to-use, AI-powered tools, such as ChatGPT, this process can now be automated, significantly reducing the time and resources required.

Through the power of large language models, these tools can potentially analyze a corpus of text from a specialized domain and automatically identify key terms and phrases. This process can be done quickly and with a good level of accuracy, resulting in a specialized vocabulary map that can be used to help non-experts understand the jargon and terminology used in the domain. 

To confirm this assertion, I took two vocabularies and drafted a few prompts to chatGPT. In a matter of seconds, chatGPT was able to map both vocabularies, but the results were mixed, and I had to refine them in dialogue with the bot. When high-level mapping categories, the results were excellent in the matching was very similar to what we get in mapping with experts. 


### High-Level Mapping

https://gist.github.com/kjgarza/d762bd08cc14f1af372cdf69ae38a35b


On the other hand, the detail-level mapping resulted in strange results; chatGPT even made up new terms. While iterating with the bot, I restricted the terms to map with a new prompt. In the original prompt, I asked to map the vocabulary; in the new prompt, I gave the robot the terms instead of mentioning which vocabulary they belonged to. That significantly improved the detail-level mapping, but also, new things started to happen. chatGPT started suggesting inter-level mapping. Inter-level mapping is when an applicable term is not found in the low-level terms then the bot uses the higher-level terms. This suggestion is astonishing and useful, as inter-level mapping was a topic of considerable discussion in the task force.


### Detail Level Mapping

https://docs.google.com/spreadsheets/d/14BMMezqUNfacU-UP-0QGszF_ixZFaf2gNNOngAg4Zyc/edit?usp=sharing


The ease of access to these tools also means that more people will have the ability to perform vocabulary mapping in specialized domains, leading to a broader understanding and representation of the specialized language and terminology. This ease of access could be especially valuable for marginalized communities who may not previously have access to the resources necessary for vocabulary mapping.

Nevertheless, chatGPT is still in its infancy and has not been proven to be better than humans in this regard. The example presented here is just one case. As we saw, the AI makes errors and produces biased output, and its ability to understand the context of the text and its in-depth meaning is limited. The current limitations can potentially mean that new tools can use huge base models, such as GPT-3.5. They will train on top of those to create "the model" for language models for vocabulary mapping in specialized domains.


In conclusion, the availability of easy-to-use, model AI-powered tools that utilize large language models is poised to revolutionize how we approach vocabulary mapping in specialized domains. These tools can quickly and accurately identify key terms and phrases and facilitate better understanding and communication within and between specialized disciplines while being more accessible to a broader range of people. We are on the threshold of a new era in which we can unlock a deeper understanding of specialized language thanks to the power of artificial intelligence.

I think this is an exciting field with a lot of potentials, and I would be happy to engage in a dialogue about the possibilities and implications of this technology. If you have any questions or insights on this topic, please do not hesitate to reach out.











While the use of large language models for vocabulary mapping in specialized domains is a promising approach, there are a few criticisms that can be made about the core argument of the essay.

One criticism is that the essay assumes that large language models are inherently better at understanding and interpreting language than humans. However, NLMs are still in their infancy and have not been proven to be better than humans in this regard. They are known to make errors and produce biased output, and the level of their ability to understand the context of the text and in-depth meaning is limited.

Another criticism is that the essay does not address the issue of data bias. Since large language models are trained on large amounts of text data, any biases present in that data will also be present in the model. This can lead to a lack of representation of certain groups of people or ideas in the vocabulary map, which can negatively impact communication and understanding in the specialized domain.

Additionally, the essay focuses on the benefits of using large language models for vocabulary mapping, but it doesn't mention the costs and resource needed to train and maintain such models, which can be a significant barrier for implementation and adoption of these technologies. Moreover, the correctness of the mapping and understanding of the specialized vocabulary also rely heavily on the quality of the text data used for training which can be quite scarce in some domains.

In short, while the use of large language models for vocabulary mapping in specialized domains is a promising approach, it is important to consider the limitations and potential drawbacks of the technology, as well as the costs and resources required for its implementation.


