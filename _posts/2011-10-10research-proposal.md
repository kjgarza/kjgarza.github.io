How can Social Semantic Web Enable Collective Intelligence and improve Knowledge Discovery Strategies in a Heliophysics Virtual Observatory

Kristian Garza

kj.garza[at]gmail[dot]com
Introduction

Heliophysics is an environmental science that analyses the connections between the Sun, solar wind, planetary space environments, and our place in the Galaxy, in an attempt to uncover the fundamental physical processes that occur throughout the Universe  (NASA, 2011). Heliophysics has experienced an exponential growth in the amount and variety of data collected. The community has responded to this challenge with the development of Virtual Heliophysics Observatories linking databases from all over the world  (Martens, 2010). Although Virtual Observatories (VxOs) efficiently link data from many research centres, they are mostly used to overcome infrastructure barriers. Most of their services are domain-specific and their data models do not value links created by user interaction with the data objects in the Virtual Observatory (i.e. has data-set A been analysed with program D? Who has published something about data-set A? Who is analysing data-set A or an ontologically related data-set?) .  At the same time, research has been conducted, which holds the view that to achieve the potential of e-Science implementations; the social aspect of research must be taken into consideration. This proposal seeks to discover the principles under which Social Networking and Semantic Web Technology can improve Knowledge Discovery strategies in a Virtual Organisation for the Heliophysics community. Specifically, I use an ontology to annotate the user’s activities and groundwork within the Virtual Observatory to expose them to other users, who might be interested. I intend to develop this work on top of the Heliophysics Integrated Observatory (HELIO)[1].

This work seeks to uncover and find a way to overcome the challenges for Social Semantic Web within Virtual Observatories to aid the research of Heliophysics. It particularly, seeks to define a service architecture for Social Semantic Web Services that would enable Collective Intelligence, efficiently leverage knowledge discovery and manage expertise. The hypothesis that semantically targeting user behaviour and interactions with data objects can improve knowledge discovery strategies in a Virtual Observatory will be tested. It will set out to answer how socially embedded applications based on semantic web technology impact the research activities of users in a Virtual Observatory.

Despite the fact that Virtual Observatories have considered using Semantic Web technology in the past, only recently has this formally been attempted. The field of Heliophysics presents both challenges and opportunities for the Semantic Web and the Virtual Observatory. Combining data from five fields of physical science (Solar, Heliospheric, Planetary, Iono/Magnetospheric and Astronomical data) including 43 space missions, around 153 instruments each with many own data products, the Heliophysics Integrated Observatory represents a challenge in data heterogeneity. HELIO will associate data from observations in all above-mentioned fields of science for the first time  (Bentley, 2009). Being attentive to this development opens the opportunity to link this cloud of data with many more other related objects on the World Wide Web. Such objects include publications, algorithms, patents and workflows.

The main goal of this research is to develop a foundation for Social Semantic Web tools in other Virtual Observatories as a means of improving knowledge discovery, as well as assess the advantages and disadvantages of this approach to enable Collective Intelligence.

On a wider note, tracking data user interaction and targeting it to other users within an e-infrastructure such as HELIO, may well trigger knowledge discovery in a more serendipitous fashion.
Literature Review

The concept of The Virtual Observatory (VxO) has been described as the astronomy community’s response to the challenge of analysing and processing astronomical data sets (Djorgovski & Williams, 2005), (Lawrence, 2002), (Quin, 2003). These data sets are growing in volume and complexity at staggering speed . In principle, VxOs are openly distributed research environments that provide astronomers with massive and complex data sets. It assembles data archives and services, as well as data exploration and analysis tools.

Djorgovski states  (Djorgovski & Williams, 2005) that a Virtual Observatory follows two main discovery strategies. Firstly, covering a large volume of parametric space. Secondly, by connecting as many different types of observations as possible so as to increase the potential of discovery as a function of the number of connections.

Early Virtual Observatory implementations use the architecture defined by The International Virtual Observatory Alliance (IVOA) in  (Williams, 2004). The IVOA architecture has successfully provided transparent access to databases and repositories around the world. For instance, the National Virtual Observatory maps databases from hundreds of research centres for the Astronomy Community, and AstroGrid connects most of UK’s scientific data centres  (AstroGrid Team, 2001).  The IVOA Knowledge Discovery in Databases Interest Group (KDD-IG) defines in  (Longo, 2011) the use of data mining as an effort to enrich their Knowledge Discovery strategy. This approach seeks to discover patterns, associations, changes, anomalies, and statistically significant structures and events in data in a semi-automatic manner. Some examples of this approach are the DAME project  (Brescia et al., 2010) and the AMDA project (Genot et al., 2010).

In  (Borne, 2003) Borne presents four directions users can take to carry out data mining in a Virtual Observatory. Two of these directions are Known Events/Known Algorithms and Known Events/Unknown Algorithms and they require users to input models from known phenomena in order to drive data mining.

One recent VxO implementation uses Semantic Web Technology to improve the efficiency and interoperability in comparison with traditional architectures. In (Fox et al., 2009), Peter Fox proposes architecture based on ontology, whose primary objective is to connect as many different types of observation as possible.  In  (Fox et al., 2007), Fox indicates that scientists have a liking for the partial exposure of the ontology in a Virtual Observatory. Primarily because this exposure gives them some insight about the data they are retrieving. I believe this contributes to the Knowledge Discovery strategy of this implementation. Fox also argues  (Fox et al., 2007) that Semantic Web could realize the VxO potential in the areas of collaborative research, and impact of a wide range of interdisciplinary scientific research.

Current Virtual Observatory implementations do not completely fulfil the objectives of the second discovery strategy by not including the users’ interactions with the VxO objects (data). Although VxOs implementations are evolving their knowledge discovery strategies with the use of pattern recognition and data mining, the need for identifying phenomena before using this technology opens the door for other approaches. At the same time, in the VxO interoperability with the WWW is still a pending issue, and using users’ information to provide that link could very well help to close that loop.

In  (Roure, 2008) De Roure argues that to facilitate the discovery and interpretation of knowledge it is necessary to develop technologies that assist collaboration.

Adding a Social Facet to the VxO would augment its knowledge discovery strategy by increasing the amount of useful connections significantly. The Virtual Observatory already deals with object of social interest for the scientific community: scientific data. These objects are rich in meta-data and in a Semantic Web Virtual Observatory they also have a high degree of interoperability. However, scientists add other types of meta-data when they retrieve, analyse, or process these data objects. This meta-data can provide scientists with insight about the events they are analysing. This meta-data could answer questions such as: Who has been consulting these data? What applications have other users implemented­­ to analyse these data?, Who has published something based on these data?

An example of this data notation is the Science Collaboration Framework platform (Das et al., 2009), which allows scientists to attach scientific discourse to publications. In this framework ontologies, such as  the Semantic Web Applications in Neuromedicine (SWAN) Ontology (Ciccarese et al., 2008), are used to attach scientific discourse as metadata.

Borner suggests, in  (Borner, 2006), that in a highly collaborative, network-based and data intensive field, such as Astronomy, interlinking scientific services, documents from the web and expertise  could be used to improve scholarly knowledge and expertise management. In (Borner, 2006), it is proposed that users logging into the system could be assigned an URI and meta-data would be assigned automatically to their activities. Oberle  (Oberle et al., 2003) shows a framework with formal semantics based on ontology for tracking users’ behaviour on a website. His method claims to be advantageous over Mobasher et al.  (Mobasher et al., 2000) (Mobasher, 2001), and Berendt and Spiliopoulou (Berendt et al., 2000) (Berendt, 2002) , as it ensures that it retains full information on each user request and claims to be more suitable for dynamically generated web pages, such as those in a Virtual Observatory.

Targeting interesting links to validate users could help to improve the user experience on knowledge discovery and changing the way users employ the Virtual Observatory. In (André et al., 2009), it is claimed that semantic targeting would increase serendipitous knowledge discovery rather than reducing it. Berendt suggests  (Berendt et al., 2002) that semantic web usage mining can for instance be performed on log files that register the user’s behaviour in terms of ontology. These log files can then be mined, for example, to cluster users who view/fetch ontologically related events/observations/data-sets from a different instrument and targeted to users who fetch/view ontologically related events.

Currently, upon logging into the Virtual Observatory users need to know which data object they wish to fetch, which algorithm they will use to process it and which graph engine to display it. By semantically targeting interesting links from other users performing these activities, one could be exposed to the more pertinent algorithms used on the data object of their interest, the different available engines to display this object, which users have fetched data objects ontologically related to the data period at hand and what work have they developed on these data objects.

A similar approach to the one proposed here is used in Stellaris  (Hogqvist & Reinefeld, 2007). Stellaris is metadata service that enables users to share resources such as robotic telescopes. Moreover, this research would contribute to the vision of the Virtual Observatory posed by Williams  (Williams et al., 2003), in which peer-reviewed publications that explain well enough what the data means are attached to the data as metadata.
Methodology

I will attempt to measure changes of knowledge discovery while increasing the amount of data links by including links made by users. The impact on knowledge discovery might vary if the links created by users connect one or more nodes with different kinds of objects (publications, algorithms, display engines, etc.). Therefore interoperability (intervening variable) of the user-generated links will be an influential factor in the changes in the measurements.

In a Virtual Observatory users (the subjects of study) are very different (i.e. students, pot-docs, scientists, etc.) and can experience the VxO in different ways. For instance, students might not be able to identify the potential knowledge discovery traits in the provided links. On the other hand experienced researchers might find the same links obvious and unnecessary. In addition, designing treatments for experienced scientist or post-docs in order to prompt knowledge discovery would be a massively complicated task. Therefore, I propose to have two experiments.

First, a Pre-test Post-test controlled trial strategy. Using this method will allow us to control differences in the groups. Moreover, it will help us to define concise treatments for the experiment.

The subjects will be undergraduate/graduate students of Solar Physics. Students in each treatment will be classified according to their level of knowledge. The product will consist in exercises to be carried out using the HELIO Portal. Subjects will be asked to conduct the knowledge discovery activities using the product.

Treatment 1 will be considered as control group and the subjects will conduct an exercise using the HELIO portal without the Social Facet. In treatment 2, the subjects will receive the same exercise content as in treatment 1 but will be allowed to use Social Facet of HELIO.

The second experiment will consist of a Post-test-only randomized controlled trial. As the HELIO portal is accessible online from anywhere in the world, we could use a varied range of users (randomized trial). This time, the treatment will not include exercises. The users will have the chance of using the system in a more natural way.

We will take advantage of the activity logging capabilities of the system to collect data. At the same time interviews will be a good way to capture users' reactions to the tool and also to find out whether the objects they discover with the tool helped them with their research.

The second experiment would also give us the opportunity to measure log data sharing frequency between users. This variable can contribute significantly to enable Collective Intelligence.

A recent study (Piwowar & Chapman, 2010), discusses several variables that can contribute to data sharing between scientists. The study found an association between ‘author experience’ and data sharing frequency that could be encouraging for our project. Still, it would be needed to explore whether these associations are applicable to our study in the Virtual Observatory.

It would be particularly interesting to find relationships between the types of links the users found useful and the user demographic.

In order to enrich the metadata database and to add practical scientific value on the system, data-related publications and algorithms will be notated into the system.
Timeline

There is a list of six milestones to complete this project. First, a longitudinal literature survey will have to be carried out during the first six months and will involve identifying and reviewing literature on other socially-driven research portals, semantic web services development, privacy concerns, semantic targeting, semantic advertising and most importantly the HELIO architecture and ontology.

I will then focus on the design, development and testing of the ontology needed to support the system. I am aiming to re-use other ontologies instead of developing a new one. This is expected to be an iterative activity, with an average duration of four months.

Seven months will then be assigned to design, develop and test the framework to interact with the ontology involved.

Thereafter, I will need to identify and collect suitable data for the analysis. There will be the need to focus on a specific segment of Heliophysics in which current research is flourishing and is accessible so we can supply the database with all the connections needed. Four moths will be allowed for this objective.

Following the above, the evaluation stage will take place and will last six months. Finally, four months will be allocated for writing up the thesis report.
Works Cited

Williams, R., 2004. Virtual Observatory Architecture Overview. [Online] Available at: http://www.ivoa.net/Documents/Notes/IVOArch/IVOArch-20040615.html [Accessed February 2011].

Williams, R., Moore, & Hanisch, , 2003. A Virtual Observatory Vision based on Published and Virtual Data. Caltech CACR.

André, P., Teevan, J. & Dumais, S.T., 2009. From X-Rays to Silly Putty via Uranus: Serendipity and its Role in Web Search. In 27th international conference on Human factors in computing systems. Boston, 2009.

AstroGrid Team, 2001. The Virtual Observatory Concept. [Online] Available at: http://www.astrogrid.org/wiki/Home/AboutTheVO [Accessed April 2011].

Bentley, B., 2009. Building a Virtual Observatory for Heliophysics. EARTH, MOON, AND PLANETS, 104(1-4), pp.87-91. International Heliophysical Year 2007: Second European General Assembly, Italy | Third UN/ESA/NASA Workshop, Japan.

Berendt, B., 2002. Using site semantics to analyze, visualize and support navigation. Data Mining and Knowledge Discovery. DATA MINING AND KNOWLEDGE DISCOVERY, 6(1), pp.37-59.

Berendt, B., Hotho, & Stumme, , 2002. Towards Semantic Web Minning. THE SEMANTIC WEB — ISWC 2002, 2342, pp.264-278.

Berendt, B., Spiliopoulou, & Sprin, , 2000. Analysing navigation behaviour in web sites integrating multiple information systems. THE VLDB JOURNAL, 9(1), pp.56-75.

Borne, K., 2003. Distributed Data Mining in the National Virtual Observatory. In Data Mining and Knowledge Discovery: Theory, Tools, and Technology V. Orlando, 2003. Proc. SPIE.

Borner, K., 2006. Semantic Association Networking using Semantic Web Technology to improve scholarly knowledge and expertise management. In Geroimenko, V. Visualizing the Semantic Web XML-Based Internet and Information Visualization. Springer-Verlag. pp.183-98.

Brescia, M. et al., 2010. DAME: a Web Oriented Infrastructure for Scientific Data Mining & Exploration. Instrumentation and Methods for Astrophysics (astro-ph.IM).

Ciccarese, P. et al., 2008. The SWAN Biomedical Discourse Ontology. Biomed Informatics, (41), pp.739-51.

Das, S. et al., 2009. Building Biomedical Web Communities Using A Semantically-Aware Content Management System. Briefings in Bioinformatics, 10, pp.129-38.

Djorgovski, G. & Williams, R., 2005. Virtual Observatory: From Concept to Implementation. From Clark Lake to the Long Wavelength Array: Bill Erickson's Radio Science ASP Conference Series, 345, p.517.

Fox, P. et al., 2007. Semantic Web Services for Interdisciplinary Scientific Data Query and Retrieval. In Proceedings of the Semantic eScience Workshop co-located with the Association for the Advancement of Artificial Intelligence Conference., 2007. AAAI.

Fox, P. et al., 2009. Ontology-supported scientific data frameworks: The virtual solar-terrestrial observatory experience. Computers & Geosciences, 35(4), pp.724-38.

Fox, P. et al., 2007. The VIRTUAL SOLAR-TERRESTRIAL OBSERVATORY: interdisciplinary data-driven science. In IAU XXVI General Assembly., 2007. Highlights of Astronomy.

Genot, V. et al., 2010. Space Weather Application AMDA. Advances in Space Research, 45(9), pp.1145-55.

Hogqvist, M. & Reinefeld, A., 2007. Stellaris: An RDF-based Information Service for AstroGrid-D. In German e-Science conference., 2007.

Lawrence, A., 2002. AstroGrid : powering the Virtual Observatory. Proceedings of SPIE, 4846, pp.6-12.

Longo, G., 2011. IVOA Knowledge Discovery in Databases. [Online] Available at: http://www.ivoa.net/cgi-bin/twiki/bin/view/IVOA/IvoaKDD [Accessed May 2011].

NASA, 2011. Heliophysics. [Online] Available at: http://science.nasa.gov/heliophysics/ [Accessed May 2011].

Martens, P., 2010. Heliophysics Data Environment: What's next? In American Geophysical Union Fall Meeting., 2010.

Mobasher, B., 2001. Using ontologies to discover domain-level web usage proﬁles. In 2nd Workshop on Semantic Web Mining., 2001.

Mobasher, B., Luo, T., Dai, H. & Sun, Y., 2000. Integrating web usage and content mining for more effective personalization. Lecture Notes in Computer Science, 1875, pp.165-76.

Oberle, D., Berendt, B., Hotho, A. & Gonzalez, J., 2003. Conceptual User Tracking. In Proc. of the Atlantic Web Intelligence Conference., 2003.

Quin, P., 2003. EUROPEAN VIRTUAL OBSERVATORY. [Online] Available at: reuna.cl [Accessed March 2011].

Piwowar , H. & Chapman, W.W., 2010. Public sharing of research datasets: A pilot study of associations. Journal of Informetrics, 4(2), pp.148-56.

Roure, D.C.D., 2008. The New e-Science. [Online] IEEE Available at: http://www.slideshare.net/dder/the-new-science-bangalore-edition [Accessed January 2011].


[1] The Heliophysics Integrated Observatory is a new European e-Infrastructure funded by the 7th framework program. The program started in June 2009, and will last 36 months. It addresses the needs of scientists of understanding, modeling and predicting the inﬂuence of solar activity on the solar system as a whole. Bob Bentley from the Mullard Space Science Laboratory leads HELIO.

Creative Commons License
This work is licensed under a Creative Commons Attribution-NonCommercial-NoDerivs 3.0 Unported License.
