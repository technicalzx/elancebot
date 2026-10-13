/**
 * Deterministic, dependency-free audit helpers.
 *
 * These functions intentionally evaluate only the data supplied to them. They do
 * not fetch marketplace data, infer search rank, or manufacture performance
 * metrics. Keeping this logic separate from the Worker makes the scoring rules
 * easy to test, explain, and evolve with versioned criteria.
 */

export const AUDIT_VERSION = "1.0.0";

const VALUE_LANGUAGE = /\b(help|build|grow|improve|increase|reduce|save|convert|deliver|speciali[sz]e|expert|results?)\b/i;
const OUTCOME_LANGUAGE = /(?:\b\d+(?:[.,]\d+)?\s?%\b|\b\d+\+?\s+(?:clients?|projects?|campaigns?|sales|leads|years?)\b|\b(?:increased|reduced|grew|saved|generated|delivered)\b)/i;
const CTA_LANGUAGE = /\b(contact|message|reach out|let'?s talk|book(?: a)? call|available for|work with me|get in touch)\b/i;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value, maxLength = 4_000) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function firstText(input, keys, maxLength) {
  for (const key of keys) {
    const value = cleanText(input[key], maxLength);
    if (value) return value;
  }
  return "";
}

function asList(value, maxItems = 24) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\n;|]/) : [];
  const seen = new Set();
  const result = [];

  for (const item of values) {
    const normalized = cleanText(typeof item === "string" ? item : isRecord(item) ? item.title ?? item.name ?? item.url : "", 180);
    const key = normalized.toLocaleLowerCase();
    if (normalized && !seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
    if (result.length >= maxItems) break;
  }
  return result;
}

function countWords(text) {
  return cleanText(text, 8_000).split(" ").filter(Boolean).length;
}

function includesKeyword(text, keywords) {
  const haystack = text.toLocaleLowerCase();
  return keywords.some((keyword) => {
    const normalized = keyword.toLocaleLowerCase();
    return normalized.length > 2 && haystack.includes(normalized);
  });
}

function criterion(id, label, score, maxScore, evidence) {
  return {
    id,
    label,
    score: Math.min(maxScore, Math.max(0, Math.round(score))),
    maxScore,
    evidence: evidence.filter(Boolean),
  };
}

function scoreBand(score) {
  if (score >= 85) return "Strong foundation";
  if (score >= 65) return "Ready to improve";
  if (score >= 40) return "Needs focused work";
  return "Needs foundational work";
}

function recommendation(id, title, action, impact, effort, priority, criterionId) {
  return { id, title, action, impact, effort, priority, criterionId };
}

function profileSource(input) {
  const supplied = cleanText(input.source, 40).toLocaleLowerCase();
  if (supplied === "imported") {
    return {
      source: "Imported user-supplied data",
      liveData: false,
      note: "The import was supplied by the user. No platform connection was used by this audit.",
    };
  }
  return {
    source: "User-provided data",
    liveData: false,
    note: "No live platform, ranking, competitor, or performance data was accessed.",
  };
}

/**
 * Audit a manually supplied profile, gig, service, or competitor description.
 * @param {unknown} rawInput
 */
export function auditProfile(rawInput = {}) {
  const input = isRecord(rawInput) ? rawInput : {};
  const title = firstText(input, ["headline", "title", "gigTitle", "serviceTitle", "name"], 240);
  const overview = firstText(input, ["overview", "about", "description", "bio", "summary"], 8_000);
  const services = asList(input.services ?? input.offerings ?? input.deliverables);
  const skills = asList(input.skills ?? input.tags ?? input.specialties);
  const portfolio = asList(input.portfolio ?? input.workSamples ?? input.caseStudies, 12);
  const keywords = asList(input.keywords ?? input.targetKeywords, 20);
  const location = firstText(input, ["location", "region", "market"], 140);
  const profileUrl = firstText(input, ["profileUrl", "url", "website"], 500);
  const testimonials = asList(input.testimonials ?? input.reviews, 8);
  const titleWords = countWords(title);
  const overviewWords = countWords(overview);
  const hasOutcomeLanguage = OUTCOME_LANGUAGE.test(`${overview} ${portfolio.join(" ")}`);
  const hasCta = CTA_LANGUAGE.test(overview);
  const hasValueLanguage = VALUE_LANGUAGE.test(`${title} ${overview}`);
  const titleHasKeyword = includesKeyword(title, keywords);

  let positioningScore = 0;
  if (titleWords >= 6 && titleWords <= 14) positioningScore += 10;
  else if (titleWords > 0) positioningScore += 5;
  if (overviewWords >= 120) positioningScore += 10;
  else if (overviewWords >= 40) positioningScore += 7;
  else if (overviewWords > 0) positioningScore += 3;
  if (services.length > 0) positioningScore += 5;

  let completenessScore = 0;
  if (overviewWords >= 100) completenessScore += 8;
  else if (overviewWords >= 40) completenessScore += 5;
  if (skills.length >= 6) completenessScore += 7;
  else if (skills.length >= 3) completenessScore += 4;
  if (hasCta) completenessScore += 4;
  if (location) completenessScore += 3;
  if (keywords.length >= 5) completenessScore += 3;

  let serviceClarityScore = 0;
  if (services.length >= 3) serviceClarityScore += 8;
  else if (services.length >= 1) serviceClarityScore += 4;
  if (hasValueLanguage) serviceClarityScore += 4;
  if (keywords.length >= 3) serviceClarityScore += 4;
  if (hasOutcomeLanguage) serviceClarityScore += 4;

  let evidenceScore = 0;
  if (portfolio.length >= 2) evidenceScore += 8;
  else if (portfolio.length >= 1) evidenceScore += 5;
  if (hasOutcomeLanguage) evidenceScore += 8;
  if (testimonials.length >= 1) evidenceScore += 4;

  let discoverabilityScore = 0;
  if (keywords.length >= 5) discoverabilityScore += 4;
  else if (keywords.length >= 2) discoverabilityScore += 2;
  if (titleHasKeyword) discoverabilityScore += 4;
  if (profileUrl) discoverabilityScore += 2;

  const criteria = [
    criterion("positioning", "Positioning", positioningScore, 25, [
      title ? `A ${titleWords}-word headline/title was supplied.` : "No headline/title was supplied.",
      overview ? `The overview contains ${overviewWords} words.` : "No overview was supplied.",
      services.length ? `${services.length} service offering(s) were supplied.` : "No service offerings were supplied.",
    ]),
    criterion("completeness", "Profile completeness", completenessScore, 25, [
      skills.length ? `${skills.length} skill or tag value(s) were supplied.` : "No skills or tags were supplied.",
      hasCta ? "A contact-oriented call to action was detected." : "No clear call to action was detected.",
      location ? "A location/market field was supplied." : "No location/market field was supplied.",
    ]),
    criterion("service-clarity", "Service clarity", serviceClarityScore, 20, [
      hasValueLanguage ? "Value-oriented language was detected." : "Value/outcome language was not detected.",
      keywords.length ? `${keywords.length} target keyword(s) were supplied.` : "No target keywords were supplied.",
      hasOutcomeLanguage ? "Specific outcome language was detected." : "No concrete outcome language was detected.",
    ]),
    criterion("proof", "Proof of work", evidenceScore, 20, [
      portfolio.length ? `${portfolio.length} work sample(s) or case study entries were supplied.` : "No work samples or case studies were supplied.",
      hasOutcomeLanguage ? "A quantitative or outcome claim was found in supplied content." : "No quantitative outcome claim was found in supplied content.",
      testimonials.length ? `${testimonials.length} testimonial/review entry(s) were supplied.` : "No testimonial/review entries were supplied.",
    ]),
    criterion("discoverability", "Discoverability inputs", discoverabilityScore, 10, [
      titleHasKeyword ? "At least one supplied keyword appears in the headline/title." : "No supplied keyword was found in the headline/title.",
      profileUrl ? "A profile or website URL was supplied." : "No profile or website URL was supplied.",
    ]),
  ];

  const score = criteria.reduce((total, item) => total + item.score, 0);
  const recommendations = [];
  if (titleWords < 6 || titleWords > 14) {
    recommendations.push(recommendation("headline", "Refine the headline", "Use a concise 6–14-word headline that names the audience, specialty, and outcome you help deliver.", "high", "low", 1, "positioning"));
  }
  if (overviewWords < 40) {
    recommendations.push(recommendation("overview", "Add a focused overview", "Explain the problem you solve, your method, and the next action a prospective client should take.", "high", "low", 2, "positioning"));
  }
  if (services.length === 0) {
    recommendations.push(recommendation("services", "List concrete services", "Add one to three clearly named services with a short deliverable or outcome for each.", "high", "low", 3, "service-clarity"));
  }
  if (skills.length < 3) {
    recommendations.push(recommendation("skills", "Add relevant skills or tags", "Add only skills that match your actual services and target work; avoid generic keyword stuffing.", "medium", "low", 4, "completeness"));
  }
  if (portfolio.length === 0) {
    recommendations.push(recommendation("proof", "Add proof of work", "Add a case study or work sample that states the context, your contribution, and a verifiable outcome.", "high", "medium", 5, "proof"));
  }
  if (!hasOutcomeLanguage) {
    recommendations.push(recommendation("outcomes", "Make outcomes specific", "Replace broad claims with concrete scope, before/after context, or measurable results you can substantiate.", "high", "medium", 6, "proof"));
  }
  if (!hasCta) {
    recommendations.push(recommendation("cta", "Add a next step", "End the overview with a clear, low-friction invitation such as requesting a brief, message, or discovery call.", "medium", "low", 7, "completeness"));
  }
  if (keywords.length < 2 || !titleHasKeyword) {
    recommendations.push(recommendation("keywords", "Align keywords with the offer", "Choose a small set of phrases your ideal clients use and place one naturally in the headline/title.", "medium", "low", 8, "discoverability"));
  }

  const strengths = criteria
    .filter((item) => item.score / item.maxScore >= 0.7)
    .map((item) => ({ criterionId: item.id, title: item.label, detail: item.evidence.find((entry) => !entry.startsWith("No ") && !entry.includes("not detected")) ?? "The supplied data covers this criterion." }));
  const gaps = criteria
    .filter((item) => item.score / item.maxScore < 0.5)
    .map((item) => ({ criterionId: item.id, title: item.label, detail: item.evidence.find((entry) => entry.startsWith("No ") || entry.includes("not detected")) ?? "The supplied data does not yet demonstrate this criterion." }));

  return {
    auditVersion: AUDIT_VERSION,
    auditType: cleanText(input.auditType, 80) || "profile-audit",
    score,
    band: scoreBand(score),
    deterministic: true,
    criteria,
    strengths,
    gaps,
    recommendations,
    checklist: recommendations.map((item) => ({ id: item.id, action: item.action, completed: false })),
    dataProvenance: profileSource(input),
    inputSummary: {
      headlineWords: titleWords,
      overviewWords,
      services: services.length,
      skills: skills.length,
      portfolioItems: portfolio.length,
      keywords: keywords.length,
    },
    limitations: [
      "This is a deterministic content-completeness audit, not a live marketplace, search-engine, or competitor ranking measurement.",
      "Recommendations are based only on the supplied fields and should be reviewed for accuracy before publishing.",
    ],
  };
}

/**
 * Evaluate constrained metadata extracted from an HTTPS page that the user has
 * attested they own. It is intentionally an on-page metadata audit, not a
 * statement about search rankings, indexing state, traffic, or backlinks.
 * @param {unknown} rawMetadata
 */
export function auditUrlMetadata(rawMetadata = {}) {
  const metadata = isRecord(rawMetadata) ? rawMetadata : {};
  const title = cleanText(metadata.title, 500);
  const description = cleanText(metadata.description, 1_000);
  const h1 = cleanText(metadata.h1, 500);
  const canonical = cleanText(metadata.canonical, 1_000);
  const lang = cleanText(metadata.lang, 80);
  const robots = cleanText(metadata.robots, 300).toLocaleLowerCase();
  const hasViewport = Boolean(metadata.hasViewport);
  const hasStructuredData = Boolean(metadata.hasStructuredData);
  const titleLength = title.length;
  const descriptionLength = description.length;
  const noindex = /(^|[,\s])noindex([,\s]|$)/i.test(robots);

  const metadataScore = (titleLength >= 15 && titleLength <= 60 ? 15 : titleLength ? 7 : 0) + (descriptionLength >= 70 && descriptionLength <= 160 ? 15 : descriptionLength ? 7 : 0);
  const onPageScore = (h1 ? 12 : 0) + (lang ? 4 : 0) + (hasViewport ? 4 : 0);
  const technicalScore = (canonical ? 12 : 0) + (hasStructuredData ? 8 : 0);
  const indexabilityScore = noindex ? 0 : 20;
  const criteria = [
    criterion("metadata", "Title and description", metadataScore, 30, [
      title ? `A ${titleLength}-character title was found.` : "No title was found.",
      description ? `A ${descriptionLength}-character meta description was found.` : "No meta description was found.",
    ]),
    criterion("on-page", "On-page clarity", onPageScore, 20, [
      h1 ? "A primary heading was found." : "No primary heading was found.",
      lang ? `The document language is declared as ${lang}.` : "No document language was declared.",
      hasViewport ? "A viewport meta tag was found." : "No viewport meta tag was found.",
    ]),
    criterion("technical", "Canonical and structured metadata", technicalScore, 20, [
      canonical ? "A canonical URL was found." : "No canonical URL was found.",
      hasStructuredData ? "Structured data markup was detected." : "No structured data markup was detected.",
    ]),
    criterion("crawl-directives", "Declared crawl directives", indexabilityScore, 20, [
      noindex ? "A noindex directive was found." : robots ? "A robots directive was found without noindex." : "No robots directive was found; indexing status is not verified.",
    ]),
    criterion("content-structure", "Content structure", h1 && title ? 10 : h1 || title ? 5 : 0, 10, [
      h1 && title ? "Both a title and a primary heading were found." : h1 || title ? "Only one of title or primary heading was found." : "Neither a title nor a primary heading was found.",
    ]),
  ];
  const score = criteria.reduce((total, item) => total + item.score, 0);
  const recommendations = [];
  if (!(titleLength >= 15 && titleLength <= 60)) recommendations.push(recommendation("page-title", "Improve the page title", "Write a unique, human-readable title around 15–60 characters that describes this page’s purpose.", "high", "low", 1, "metadata"));
  if (!(descriptionLength >= 70 && descriptionLength <= 160)) recommendations.push(recommendation("meta-description", "Improve the meta description", "Add a concise description around 70–160 characters that accurately summarizes the page.", "medium", "low", 2, "metadata"));
  if (!h1) recommendations.push(recommendation("h1", "Add one primary heading", "Add a clear H1 that matches the page’s visible topic and is useful to visitors.", "high", "low", 3, "on-page"));
  if (!canonical) recommendations.push(recommendation("canonical", "Set a canonical URL", "Set a canonical URL for this preferred page version after checking that it is the correct public URL.", "medium", "low", 4, "technical"));
  if (!hasViewport) recommendations.push(recommendation("viewport", "Declare the viewport", "Add a responsive viewport meta tag so mobile browsers render the page as intended.", "medium", "low", 5, "on-page"));
  if (!lang) recommendations.push(recommendation("language", "Declare page language", "Set the HTML lang attribute to the primary language of the page.", "low", "low", 6, "on-page"));
  if (noindex) recommendations.push(recommendation("noindex", "Review the noindex directive", "Confirm that noindex is intentional before expecting this page to be eligible for indexing.", "high", "low", 7, "crawl-directives"));

  return {
    auditVersion: AUDIT_VERSION,
    auditType: "url-metadata-audit",
    score,
    band: scoreBand(score),
    deterministic: true,
    criteria,
    recommendations,
    dataProvenance: {
      source: "Metadata fetched from a user-attested URL",
      liveData: false,
      note: "This audit evaluates the fetched page metadata only. It does not query search engines, traffic analytics, backlinks, rankings, or marketplace data.",
    },
    limitations: [
      "A metadata audit cannot verify indexing, rankings, crawl frequency, traffic, backlink quality, or search-engine treatment.",
      "The server response may differ by location, device, authentication, or later page changes.",
    ],
  };
}

