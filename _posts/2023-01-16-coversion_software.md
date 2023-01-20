---
layout: post
category: pages
title: "Transforming Code and DOI Metadata: The Potential of large Language Models in Software Development"
tags: [ai, metadata, schema mapping, chatgpt, rda]
published: true
---


<img src="/uploads/2022/02/19/2023-01-20_transform_meatdata.png" width="700">

Large language models have been making waves in artificial intelligence for a good reason. These models have the ability to understand and generate human language, which has far-reaching implications for the future of technology. One area where these models have a significant impact is in the realm of software development. Specifically, with Github Copilot and ChatGPT, large language models might possibly replace or enhance software developers and transform how we write and understand code.

On the one hand, it is easy to see how large language models could greatly simplify the process of writing and understanding code. Currently, software developers must spend a significant amount of time learning the intricacies of different programming languages, and even then, they often struggle to understand code written by others. With large language models, like those in Github Copilot, developers can simply describe their desired program in plain language, and the model would convert that description into working code. These benefits would not only save developers time but would also make it easier for non-experts to understand and modify code.

Another potential use for large language models in software development is their ability to transform data from one schema to another without the need for manual coding. Metadata transformation AI-powered tools could be especially useful for organizations that need to integrate data from multiple sources, such as from different institutions, metadata models, or from external partners.

Currently, metadata transformation process can be tedious and error-prone, as developers must write code to extract, transform, and load the data. In the case of DOI metadata, there exist libraries and services that provide such features, such as [Bolognese](https://github.com/datacite/bolognese) and [Crosscite Content Negotiation](https://support.datacite.org/docs/datacite-content-resolver0). However, even these tools require constant updating when new versions of metadata schemas are released. Not only is the coding time-consuming, but the generation of mappings between multiple schemas also takes significant effort; the [Research Metadata Schemas Working Group](https://www.rd-alliance.org/groups/research-metadata-schemas-wg) of the Research Data Alliance dedicates much time to generating such mappings and crosswalks.

With large language models, however, this process could be greatly simplified. Developers could simply describe the desired schema, and the model would automatically generate the necessary code to transform the data. This would not only save time, but it would also reduce the risk of errors, which could lead to data loss or corruption.

To demonstrate this, we can look at a few examples. The first example shows how the Bolognese ruby library, which can transform DataCite metadata to Crossref metadata, can be converted into Kotlin using the GitHub Copilot tool. The second example shows how the GPT-3.5 model can be used to convert data from one schema to another. In addition, the GPT-3.5 model can also be used to interpret and provide solutions for vastly different schemas, such as the DataCite Schema 4.5 and DCAT 3.0. This example demonstrates that the GPT-3.5 model can handle and transform different types of metadata schema.

Recently, I was tasked with transforming the Bolognese library from its native Ruby to Kotlin. As I am not a Kotlin developer, this task was not something I would have dared to undertake without dedicating a significant amount of time to it. However, this task can now be completed faster with tools such as Copilot. The comparison below shows a code snippet from the Bolognese library that transforms DataCite metadata to Crossref metadata, converted into Kotlin with the GitHub Copilot extension. 


```ruby
def set_container(meta)
  series_information = Array.wrap(meta.dig("descriptions", "description")).find { |r| r["descriptionType"] == "SeriesInformation" }.to_h.fetch("__content__", nil)
  si = get_series_information(series_information)

  is_part_of = Array.wrap(meta.dig("relatedIdentifiers", "relatedIdentifier")).find { |ri| ri["relationType"] == "IsPartOf" }.to_h

  if si["title"].present? || is_part_of.present?
    {
      "type" => meta.dig("resourceType", "resourceTypeGeneral") == "Dataset" ? "DataRepository" : "Series",
      "identifier" => is_part_of["__content__"],
      "identifierType" => is_part_of["relatedIdentifierType"],
      "title" => si["title"],
      "volume" => si["volume"],
      "issue" => si["issue"],
      "firstPage" => si["firstPage"],
      "lastPage" => si["lastPage"]
    }.compact
  else
    {}
  end
end

def get_titles(meta)
  titles = Array.wrap(meta.dig("titles", "title")).map do |r|
    if r.blank?
      nil
    elsif r.is_a?(String)
      { "title" => sanitize(r) }
    else
      { "title" => sanitize(r["__content__"]), "titleType" => r["titleType"], "lang" => r["lang"] }.compact
    end
  end.compact

  titles
end
```

```kotlin
fun set_container(meta: Map<String, Any>): Map<String, Any> {
  val seriesInformation = meta.dig("descriptions", "description")?.let { Array.wrap(it) }?.find { r -> r["descriptionType"] == "SeriesInformation" }?.toHashMap()?.get("__content__")

  val si = getSeriesInformation(seriesInformation)

  val isPartOf = meta.dig("relatedIdentifiers", "relatedIdentifier")?.let { relatedIdentifiers ->
            Array.wrap(relatedIdentifiers).find { it["relationType"] == "IsPartOf" }
        }?.toH()

  if (si["title"] != null || isPartOf != null) {
      mapOf(
          "type" to if (meta.dig("resourceType", "resourceTypeGeneral") == "Dataset") "DataRepository" else "Series",
          "identifier" to isPartOf?.get("__content__"),
          "identifierType" to isPartOf?.get("relatedIdentifierType"),
          "title" to si["title"],
          "volume" to si["volume"],
          "issue" to si["issue"],
          "firstPage" to si["firstPage"],
          "lastPage" to si["lastPage"]
      ).filterValues { it != null }
  } else {
      emptyMap()
  }
}

fun get_titles(meta: Map<String, Any>): Map<String, Any> {
  val titles = Array.wrap(meta.dig("titles", "title")).map {
              if (it.isBlank()) {
                  null
              } else if (it is String) {
                  mapOf("title" to sanitize(it))
              } else {
                  mapOf(
                      "title" to sanitize(it["__content__"]),
                      "titleType" to it["titleType"],
                      "lang" to it["lang"]
                  ).filterValues { it != null }
              }
          }.filterNotNull()

  titles
}
```


The restuls are not that impressive While there is still more work to be done around this simple class, the core of the transformation is there, and it took but a few seconds to generate. but there are still errors that any Kotlin developer will catch plus this in only part of the code that converts metadata, the library still needs extra wrapping code around it.

The second experiment is different; why bother transforming the code when the GPT-3.5 model already knows about Datacite Schema and Crossref Schema? We can ask the GPT-3.5 model, via ChatGPT, to covert data from one schema to another. The example below shows that. I took the metadata of a DOI in Crossref schema (i.e., 10.1002/EJIC.201900339)  and used it as a prompt to convert to DataCite Schema. I had to trim the metadata a bit as it has too many relationships, but it is good enough to check the conversation. Then compared, the results with the metadata conversion using Crosscite Content Negotiation (a service maintained by Crossref and DataCite). Finally, I validated the resulting metadata against the DataCite API validation.

 ![Metadata conversion side by side comparion. Left: Original Crossref Metadata. Middle: ChatGPT converted Metadata. Right: Crosscite CN converted Metadata](/uploads/2022/02/19/2023-01-20_comparison.png)


![Valid metadata](/uploads/2022/02/19/Capture-2023-01-17-115718.png) -->

<!-- <img src="/uploads/2022/02/19/2023-01-20_comparison.png" width="700"> -->

<img src="/uploads/2022/02/19/Capture-2023-01-17-115718.png" width="700">



Overall the results are excellent. The first chatGPT conversion in valid DataCite metadata indicates that it understands the DataCite Metadata. Second, in terms of the comparison, the results are very positive but not perfect. Mandatory fields mapped corrected. ChatGPT also made some interpretations to enrich the metadata with "subjects" and a "description." Optional fields like dates and funding had mixed results, but they are not inaccurate. The results are auspicious. 


On the other hand, there are some concerns that the increasing reliance on large language models could lead to a loss of expertise in the field of software development. As large language models take over more and more of the work currently done by developers, fewer people may be needed to write and maintain code. This could lead to a shortage of skilled software developers, which could slow the pace of technological progress.

Additionally, it is important to consider the potential for bias in large language models. Language is inherently subjective, and if models are trained on biased data, they may perpetuate that bias in the code they generate. For example, what happens when the model chooses to translate to an older version of the schema instead of the newest one? Such biases could lead to unintended consequences and discrimination in the programs and systems we build. 


In short, large language models have the potential to revolutionize the way we process and transform data, making it more efficient, accurate, and cost-effective. AI-powered tools could lead to significant cost savings for businesses and allow them to use their data better, leading to new insights and opportunities. I would love to get in touch with more people interested in the topic to look for collaboration.
























Currently, this process can be time-consuming and error-prone, as developers must manually write code to extract, transform, and load the data. In the case of DOI metadata ther exist libraries (e.g., Bolognese https://github.com/datacite/bolognese), and services (e.g., Crosscite Content Negotation https://support.datacite.org/docs/datacite-content-resolver) that provide such features. But even those pnes need to be constantly updated when a new metadata schema version appears (e.e DataCite 4.4).
Not only the coding is time consuing but generating the mapping between two or more schemas takes time and significant effort; RDA has a full working group on this topic that dedicates time to genereta mappings and crosswwalks. https://www.rd-alliance.org/groups/research-metadata-schemas-wg.


The second experiment is different, why bother to transform the code when the GPT-3.5 model already knows about the DataCite Schema and the Crossref Schema? We can ask the GPT-3.5 model, via ChatGPT, to convert data from one schema to another. The example below demonstrates that this is possible, and the resulting metadata is completely valid.

We can even go further, the previous two examples have discussed schemas that are quite similar and pertain to the same type of objects. What about schemas that are vastly different? I have been working on a feature for the DataCite Schema 4.5 and one of them, distribution, is heavily inspired by DCAT 3.0. However, there has been much debate regarding how the new property would work in certain edge cases. Can ChatGPT interpret both schemas and provide a solution? The example below shows that it can.

To examplify this lets look at two small experiments. Not long I was asked to transform the Bolognes library for its native ruby to kotlin. I'm not a kotlin developer so this task was not something I would dare to embarq without some good dedicated time. But now with copilot one can do that tasks faster. The comparison below shows a snippet the code from bolognese library that transform DataCtie metadata to Crossref Metadata converted into Kotlin with the Github Copilot extension. The transformation took only a few seconds but there are still errors that any Kotlin developer will catch plus this in only part of the code that converts metadata, the library still needs extra wrapping code around it.














In conclusion, large language models have the potential to revolutionize the way we write and understand code. However, it is important to consider the potential consequences of this technology, both positive and negative, and to ensure that we are using it in a responsible and ethical way. It is also important to be mindful of the potential for bias in these models and to take steps to mitigate it. In short, large language models have the power to make software development more accessible and efficient, but we must be cautious to use it responsibly.

large language models are a promising area of artificial intelligence research. These models can understand and generate human language, which has implications for many fields, including software development. One application is the replacement of software developers and the transformation of code from one programming language to another.

On the one hand, large language models could simplify the process of writing and understanding code. Currently, developers spend a significant amount of time learning various programming languages and struggle to understand code written by others. With large language models, developers could describe the desired program in large language and the model would convert that description into working code. This would save time and make code more accessible to non-experts.

On the other hand, there are concerns that the increasing use of large language models could lead to a loss of expertise in software development and a shortage of skilled developers. Additionally, there is the potential for bias in large language models, which could perpetuate discrimination in the programs and systems we build.

Another application of large language models in software development is their ability to transform data from one schema to another without manual coding. This could simplify the process of integrating data from multiple sources and reduce the risk of errors.

In conclusion, large language models have the potential to revolutionize software development, making it more efficient and accessible. However, we must be aware of the potential negative consequences and ensure that we use the technology responsibly. Additionally, the use of these models in data transformation can lead to significant cost savings and better use of data. We must take into consideration these benefits while being mindful of the potential biases and errors that may arise.

Another potential use for large language models in software development is their ability to transform data from one schema to another without the need for manual coding. This could be especially useful for businesses that need to integrate data from multiple sources, such as from different departments or from external partners.

Currently, this process can be time-consuming and error-prone, as developers must manually write code to extract, transform, and load the data. With large language models, however, this process could be greatly simplified. Developers could simply describe the desired schema and the model would automatically generate the necessary code to transform the data. This would not only save time, but it would also reduce the risk of errors, which could lead to data loss or corruption.

Furthermore, large language models could also be used to automatically generate the code for data validation, error handling, and data quality checks which are crucial for the integrity of the data. This could be a great help to developers and data engineers who spend a significant amount of time maintaining and updating these codes.

In short, large language models have the potential to revolutionize the way we process and transform data, making it more efficient, accurate and cost-effective. This could lead to significant cost savings for businesses and allow them to make better use of their data, which could in turn lead to new insights and opportunities.

"The Future of Software Development: How large Language Models are Changing the Game"
"The Rise of the Code Generators: How Natural Language Models are Disrupting the Software Industry"
"The Pros and Cons of Using Natural Language Models in Software Development"
"The Impact of Natural Language Models on Software Developers and Code Transformation"
"Transforming Code and Data: The Potential of Natural Language Models in Software Development
