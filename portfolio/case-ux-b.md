---
layout: blocks
title: Kristian Garza - Case B
date: 2022-01-22T23:00:00.000+00:00
type: "design"
page_sections:
- template: content-feature
  block: hero-1
  slug: intro
  heading: Innovating Data Usage Processing Services
- template: content-feature
  block: one-column-1
  slug: context
  content:  |
    We identified a problem where the usage processing metrics were seeing very low adoption by repository administrators, who use this service to capture metrics according to the COUNTER Code of Practice.
     My Role: UX Researcher and Product Designer
  # image:
  #   image: "/uploads/2022/02/19/designsprint-eosc Medium.png"
  #   alt_text: Product Shot
  background_image: "/uploads/2018/06/21/hero-2-bg Medium.png"
- template: content-feature
  block: feature-no-image
  # media_alignment: right
  slug: research-methodology
  headline: Research Methodology
  content: |
    We initiated the project with a survey, conducted among key stakeholders, to ascertain the main difficulties associated with the current usage processing service, and to gauge the technical capabilities within the stakeholder groups. The survey, distributed across multiple networks and mediums, garnered 85 responses.
  # media:
  #   image: "/uploads/2022/02/19/survey-web-tracker Medium.png"
  #   alt_text: Discovery
- template: content-feature
  block: feature-no-image
  media_alignment: Right
  slug: research-methodology-2
  headline: Research Methodology (2)
  content: |
    Based on the survey results, I drafted a potential design solution addressing the issues revealed by the survey. I then used a Request for Comments (RFC) feedback collection method via Productboard to gain feedback on the initial solution from DataCite's community members.
    Analysis of both the survey results and RFC feedback enabled us to generate an MVP. An Expert Walkthrough was later conducted to validate the interaction design of the web tracker, with participation from 10 experts.

  # media:
  #   image: "/uploads/2022/02/19/designsprint-eosc Medium.png"
  #   alt_text: Idea Validation
# - template: content-feature
#   block: media-1
#   slug: media-tracker
#   image: "/uploads/2022/02/19/gherkin-web-tracker Medium.png"
#   caption: Design
- template: content-feature
  block: media-1
  slug: survey-results
  image: "https://i.imgur.com/VdEpClk.png"
  caption: Survey Results
- template: content-feature
  block: stats-column-1
  slug: findings
  headline: Findings
  col_1:
    headline: 01 Resourcing
    content: Cost of implementation was the main factor behind the lack of adoption
  col_2:
    headline: 02 Readiness 
    content: The organisation have low technical capabilities. A solution analogous to Google analytics would be welcomed.
  col_3:
    headline: 03 Projected Adoption 
    content: The RFC indicated that we could augment the adoption rate of our usage service by a factor of five.




- template: content-feature
  block: feature-no-image
  media_alignment: Right
  slug: insights-recommendations
  headline:  Insights and Recommendations 
  content: | 
    1. Development of a JavaScript web tracker, offering ease of implementation through a simple copy-paste mechanism.
    2. Inclusion of a series of validation checks to discourage misuse and enhance the system's robustness.
    3. Integration of the new solution with DataCite's existing user management system, Fabrica, to expedite user adoption.
    
  # media:
  #   image: "/uploads/2022/02/19/gherkin-web-tracker Medium.png"
  #   alt_text: Design
# - template: content-feature
#   block: media-1
#   slug: media-tracker
#   image: "/uploads/2022/02/19/gherkin-web-tracker Medium.png"
#   caption: Design
- template: content-feature
  block: feature-no-image
  media_alignment: Right
  slug:  ideation-implementation
  headline:  Ideation and Implementation
  content: | 
    1. I crafted a collection of wireframes in Figma for the prototype. Since the service is primarily developer-centric, I outlined a series of operational flows for the web tracker.
    2. I also conceived JavaScript interface snippets to provide a frictionless Developer Experience.
    3. The final deliverable comprised a Figma file and product specifications in Gherkin syntax, seamlessly transferred to the development team..
  # media:
  #   image: "/uploads/2022/02/19/figma-web-tracker Medium.png"
  #   alt_text: Solution Validation
- template: content-feature
  block: media-1
  slug: code
  image: "https://i.imgur.com/3J83ius.png"
  caption: code
- template: content-feature
  block: stats-column-1
  slug: Impact
  headline: Impact
  col_1:
    headline: 18% ⬇ HANDOVER
    content: The adoption of Gherkin syntax for product specification effectively reduced the handover time facilitating the developers' transition to Test-Driven Development (TDD).
  col_2:
    headline: ""
    content: ""
  col_3:
    headline: 3x sign-ins
    content: The refined process resulted in a threefold increase in user sign-ups for the new services.
- template: content-feature
  block: feature-no-image
  media_alignment: Right
  slug:  reflections
  headline:  Reflections
  content: | 
    Employing Gherkin for standardizing specifications proved immensely advantageous for our ongoing collaboration with the development team.
    Furthermore, the RFC methodology yielded valuable insights from community members, despite them not being direct users of the service, thus enriching our understanding of our broader user community.
  # media:
  #   image: "/uploads/2022/02/19/figma-web-tracker Medium.png"
  #   alt_text: Solution Validation
- template: content-feature
  block: cta-1
  slug: next
  content: "Go to Documentation"
  link: "https://support.datacite.org/docs/datacite-usage-tracker#processing-views-and-downloads"
- template: content-feature
  block: next-1
  slug: next
  headline: "Next Case Study"
  content: "Dashboard ➔"
  link: "/portfolio/case-ux-c.html"
---