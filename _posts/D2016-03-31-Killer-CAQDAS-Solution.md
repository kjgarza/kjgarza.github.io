---
layout: post
category : pages
title: "Merge RQDA and Annotations to make the killer app"
tags : [review, CAQDAS, RQDA, Annotations]
---
> There is not a perfect #CAQDAS but #RQDA and #Annotations are leading the way.

![too](https://38.media.tumblr.com/5d2e56c090995429e558a48a5c70f865/tumblr_nu03q5HjdD1rjjxbmo3_540.gif 'Title text')

One of the experiences I loathe during my research was coding interview transcripts. The process was confusing, mechanic, and required a good deal of organisation for which I was not ready.
I tend to throw technical solutions at problems and so I did with this one. I used the CAQDAS application RQDA[^rqda]. RQDA is an R package with a GUI that can be used to analyse textual data. Since RQDA is a R package is open source and thus free.
Unfortunately, my CAQDAS selection paid to be not a great decision but not because RQDA was not perfect but because **there is no perfect CAQDAS solution now**. Unfortunately, reviews are not great source of help now, as they mostly list the features of each CAQDAS solution (e.g. Woods, Macklin, and Lewis 2015 [^woods], Schönfelder 2011[^scho], Hwang 2008[^hwang], Lewins and Silver 2009[^lewis]).
If I could have something different I would have taken a few of these CAQDAS solutions used for a bit and compared them. That is what has retrospectively made in this post. I took three CAQDAS solutions (i.e. RQDA, Annotations and Atlas.ti) and compared them in four simple aspects: Coding Experience, Coding Exporting,  Analysis Tools and Inter-coder Reliability Support.

|---
| Solution | Coding Experience | Coding Exporting | Analysis Tools | Inter-coder Reliability Support | License |
|===|:===|:===|:===|:===|:===|
| RQDA | Code Text: 7.5s  Create Code: 13.42s | 2 | Quantitative (*) and Qualitative (*) | Multiple coders | Free |
| Atlas.ti | Code Text: 6.82s  Create Code: 7.10s | 1 | Quantitative (2) | Multiple coders | Proprietary |
| Annotations | Code text: 5.1s  Code text: 6.62s  Create Code: 6.99s | 0 | No support | No support | Proprietary |
|=========
| * Multiple number of tools
{: rules="groups"}

In terms of coding experience, Annotations is the best and fastest experience. Atlas.ti comes close but Annotations is still a bit a head. This could be mostly related to Annotation's auto pop-up tagging menu, which appears every time you select a piece of text.  RQDA  trails way behind the other two solutions mostly due to the lack of autocomplete search for codes; a feature both Atlas.ti and Annotations have built-in. In theory, those two features make the coding experience in Annontations and Atlas.ti, 30% and 10% faster, respectively, than in RQDA.
However, the backend of Annotations and to some extend Atlas.ti are in shambles when compared with RQDA. RQDA can handle almost any standard data exchange format[^formats], which comes very useful to exchange your coded text with other applications, R scripts, or even publishing your data[^publish]. Atlas.ti at least can output the coded text in XML but Annotations can only expert plain text on HTML. In terms of analysis tools, RQDA has a number of tools included in the package like a code concurrency table; but it can be hooked up with maybe other R libraries to check Sentiment Analysis, Text Mining and Visualisations. Atlas.ti also supports a concurrency table and a word cruncher (you can use TM in R). On the other hand, Annotations has nothing. The lack of analysis tools could stem from the perspective that doing a quantitative analysis in qualitative data does not lead to reliable inferences. In essence, RQDA is so robust in the back end that leaves the other two applications on the floor.
A worrying issue is the absence of support of Intercode reliability in all these packages. RQDA and Atlas.ti both support multiple coders but no tool is provided to check reliability among them. The lack of support in this area could be related to the same reason as with the lack of analysis tools (i.e., quantitative analysis in qualitative data.). If that is the case, then the software should support other types of analysis tools. For example, support card sorting as a reliability test.

Overall, Atlas.ti seems a waterdown compromise between the usability and speed of annotations and the robust backend of RQDA. Unfortunately is not free or open.  The make the killer app you will need a combination of the Annotations front-end with the RQDA backend. This would certainly would disrupt the entire CAQDAS market, because using RQDA would mean that the app would have to be open. I hope that Christian Klutz (Annotations) and Huang Ronggui (RQDA) would sit together and make this **happen**.

-------


**Methods**
I compared the three solutions in four areas:  Coding Experience, Coding Exporting,  Analysis Tools and Inter-coder Reliability Support. First, I use the term coding experience to refer the usability of the software to code text and create codes (i.e., tags). I used the Keystroke-level (KL) model to quantify coding experience. The KL model predicts how long it will take an expert user to accomplish a routine task without errors[^klm]. Second, I use the term Coding Exporting to refer to the option to export the coded/tagged text into other formats or applications. I ranked each application's exporting capabilities based on whether they could export in to a Web/ISO standard exchange format and whether the exporting language was available in a computer interpretable form. Third, Analysis tools refer to the availability of tools for coded text. Specifically, whether the tools a quantitative tools and how many analysis they can be performed. Fourth, I used the term Intercoder Reliability Support to refer features the application provide to support two or more independent coders to evaluate the same data/text.
{: style="background-color:white; font-size: 80%; text-align: justify;"}


-----------

[^woods]:  Woods, Megan, Rob Macklin, and Gemma K. Lewis. 2015. “Researcher Reflexivity: Exploring the Impacts of CAQDAS Use.” International Journal of Social Research Methodology 0 (0): 1–19. doi:10.1080/13645579.2015.1023964.
[^klm]:http://courses.csail.mit.edu/6.831/2009/handouts/ac18-predictive-evaluation/klm.shtml
[^hwang]: Hwang, Sungsoo. 2008. “Utilizing Qualitative Data Analysis Software: A Review of Atlas.ti.” Social Science Computer Review, February. doi:10.1177/0894439307312485.
[^lewis]: Lewins, Ann, and Christina Silver. 2009. “Choosing a CAQDAS Package.” Working Paper. Guildford, UK: University of Surrey. http://caqdas.soc.surrey.ac.uk/PDF/2009ChoosingaCAQDASPackage.pdf.
[^scho]: Schönfelder, Walter. 2011. “CAQDAS and Qualitative Syllogism Logic—NVivo 8 and MAXQDA 10 Compared.” Forum Qualitative Sozialforschung / Forum: Qualitative Social Research 12 (1). http://www.qualitative-research.net/index.php/fqs/article/view/1514.
[^rqda]: HUANG Ronggui (2014). RQDA: R-based Qualitative Data Analysis. R package version 0.2-7. http://rqda.r-forge.r-project.org/
