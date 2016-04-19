---
layout: post
category : pages
title: "Merge RQDA and Annotations to make the killer app"
tags : [review, CAQDAS, RQDA, Annotations]
---




> There is not a perfect #CAQDAS but #RQDA and #Annotations are leading the way.

<br><br>  

![Coding Interviews](http://i.imgur.com/LSv0PEm.png = 20x)

One of the experiences I loathe during my research was coding interview transcripts. The process was confusing, mechanical, and required a good deal of organisation for which I was not ready. I tend to throw technical solutions at problems and so I did with this one. I used the CAQDAS application RQDA[^rqda]. RQDA is an R package with a GUI that can be used to analyse textual data.  Unfortunately, my CAQDAS selection turned out to be not a great decision but not because RQDA was not perfect but because currently there is no perfect CAQDAS solution.

I wish I had been more analytical on the tool selection and checked a few options. Because, unfortunately, reviews are not a great source of help, as they mostly list the features of each CAQDAS solution (e.g. Woods, Macklin, and Lewis 2015[^woods], Schönfelder 2011[^scho], Hwang 2008[^hwang], Lewins and Silver 2009[^lewis]). If I could have something different I would have taken a few of these CAQDAS solutions used for a bit and compared them. That is what I have retrospectively made in this post. I took three CAQDAS solutions (i.e. [**RQDA**](http://rqda.r-forge.r-project.org/), [**Annotations** ](http://www.annotationsapp.com/)and [**Atlas.ti**](http://atlasti.com/)) and compared them in four simple aspects: Coding Experience, Coding Exporting, Analysis Tools and Intercoder Reliability Support. The results are in the table below:

<br><br>    

|---
| **Solution** | **Coding Experience** | **Coding Exporting** | **Analysis Tools** | **Inter-coder Reliability Support** | **License** |
|:===|:===|:===|:===|:===|:===|
| RQDA | CT:  7.5sec &nbsp; &nbsp;  &nbsp; &nbsp;  CC: 13.42sec | *2* | *Multitude of packages* | *Multiple coders* | Free |
| Atlas.ti | CT:  6.82sec  &nbsp; &nbsp;  &nbsp; &nbsp;  CC: 7.10sec | 1 | Word Crucher and Concurrency Table  | Multiple coders | Proprietary |
| Annotations | CT:  *5.1sec*  &nbsp; &nbsp;  &nbsp; &nbsp;   CC:  *6.99sec* | 0 | No support | No support | Proprietary |
|=====
|
{: rules="groups"}

Time is   given in seconds
**CT**: Time   to code/tag text
**CC**: Time   to create a new code/tag


<br><br>


In terms of coding experience, Annotations is the best and fastest coding experience. Atlas.ti comes close but Annotations is still a bit ahead in terms of speed. This could be mostly related to Annotation's auto pop-up tagging menu, which appears every time you select a piece of text. RQDA trails way behind the other two solutions mostly due to the lack of autocomplete search for codes; a feature both Atlas.ti and Annotations have built-in.

However, RQDA offers advantages in other dimensions. The backend of Annotations and to some extend Atlas.ti are in shambles when compared with RQDA. RQDA can handle almost any standard data exchange format [^formats] , which comes very useful to exchange your coded text with other applications, R scripts, or even publishing your data. Atlas.ti at least can output the coded text in XML but Annotations can only expert plain text on HTML.

In terms of analysis tools, RQDA has a number of tools included in the package like a code concurrency table; but it can be hooked up with many other R libraries to conduct Sentiment Analysis, Text Mining, Visualisation, etc [^rpack]. Atlas.ti also supports a concurrency table and a word cruncher. On the other hand, Annotations no analysis tools. The lack of analysis tools could stem from the perspective that doing a quantitative analysis of qualitative data does not lead to reliable inferences. In essence, RQDA’s backend robustness is superior to the other two solutions.

A worrying issue is the absence of support of Intercoder reliability in all these packages. RQDA and Atlas.ti both support multiple coders but no tool is provided to check reliability among them. The lack of support in this area could be related to the same reason as with the lack of analysis tools (i.e., quantitative analysis of qualitative data.). If that is the case, then the software should support other types of analysis tools. For example, support card sorting as a reliability test [^cards].

Overall, **Atlas.ti** seems a decent compromise between the usability and speed of **Annotations** and the backend of **RQDA**. Unfortunately, Atlas.ti is not free or open. I think that to make the killer app you will need a combination of the Annotations front-end with the RQDA backend. This would certainly disrupt the entire CAQDAS market because using RQDA would mean that the app has to be open. I can only wish that Christian Klutz (Annotations) and Huang Ronggui (RQDA) would sit together and make this happen.


-------


**Methods**
I compared the three solutions in four areas: Coding Experience, Coding Exporting, Analysis Tools and Intercoder Reliability Support. First, I use the term coding experience to refer the usability of the software to code text and create codes (i.e., tags). I used the Keystroke-level (KL) model to quantify coding experience. The KL model predicts how long it will take an expert user to accomplish a routine task without errors [^klm] . Second, I use the term Coding Exporting to refer to the options to export the coded/tagged text into other formats or applications. I ranked each application's exporting capabilities based on whether or not they could export into a Web/ISO standard exchange format and whether the exporting language was available in a computer interpretable form [^formats]. Third, Analysis tools refer to the availability of tools for text coding. Specifically, to a number of analyses they can be performed. Fourth, I used the term Intercoder Reliability Support to refer features the application provides to support two or more independent coders  evaluate the same data/text.
{: style="background-color:white; font-size: 80%; text-align: justify;"}


-----------

[^woods]:  Woods, Megan, Rob Macklin, and Gemma K. Lewis. 2015. “Researcher Reflexivity: Exploring the Impacts of CAQDAS Use.” International Journal of Social Research Methodology 0 (0): 1–19. doi:10.1080/13645579.2015.1023964.
[^klm]:http://courses.csail.mit.edu/6.831/2009/handouts/ac18-predictive-evaluation/klm.shtml
[^hwang]: Hwang, Sungsoo. 2008. “Utilizing Qualitative Data Analysis Software: A Review of Atlas.ti.” Social Science Computer Review, February. doi:10.1177/0894439307312485.
[^lewis]: Lewins, Ann, and Christina Silver. 2009. “Choosing a CAQDAS Package.” Working Paper. Guildford, UK: University of Surrey. http://caqdas.soc.surrey.ac.uk/PDF/2009ChoosingaCAQDASPackage.pdf.
[^scho]: Schönfelder, Walter. 2011. “CAQDAS and Qualitative Syllogism Logic—NVivo 8 and MAXQDA 10 Compared.” Forum Qualitative Sozialforschung / Forum: Qualitative Social Research 12 (1). http://www.qualitative-research.net/index.php/fqs/article/view/1514.
[^rqda]: HUANG Ronggui (2014). RQDA: R-based Qualitative Data Analysis. R package version 0.2-7. http://rqda.r-forge.r-project.org/
[^cards]: Stephen C. Bowden , Kylie S. Fowler , Richard C. Bell , Gregory Whelan ,Christine C. Clifford , Alison J. Ritter & Caroline M. Long (1998) The Reliability and Internal Validity of the Wisconsin Card Sorting Test, Neuropsychological Rehabilitation, 8:3, 243-254, DOI: 10.1080/713755573
[^formats]: https://en.wikipedia.org/wiki/Data_exchange
[^rpack]: http://rpackages.ianhowson.com/all/
