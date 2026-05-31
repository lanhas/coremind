import { fileURLToPath } from "node:url";
import { createKnowledgeEntry } from "./knowledge-entry.js";
import { loadMockStore } from "./mock-store.js";

const ROOT_DIR = fileURLToPath(new URL("../", import.meta.url));
const ANSWER_MODES = new Set(["auto", "rag-only", "external-only", "rag-plus-external"]);

const EXTRA_RAG = [
  {
    id: "rag-payment-callback-slo",
    title: "Payment Callback SLO and Alert Policy",
    body: "The payment callback path requires P95 latency below 1200ms. If callback timeout approaches 3000ms, check downstream response time, retry queue backlog, and rollout traffic percentage. Alert handling must reference a JIRA change ticket and release batch.",
    owner: "SRE Platform",
    updatedAt: "2026-05-30",
    status: "active",
    tags: ["payment", "callback", "slo", "jira"],
    source: {
      type: "rag",
      title: "Payment Callback SLO and Alert Policy",
      url: "mock://rag/payment-callback-slo",
      location: "mock-data/knowledge/payment-callback-slo.md",
      updatedAt: "2026-05-30"
    }
  },
  {
    id: "rag-release-risk-policy",
    title: "Canary Release Risk Handling",
    body: "During a canary release, pause traffic expansion if a core success rate drops beyond the threshold. Preserve monitoring screenshots and request samples, then roll back to the previous version according to the release plan. Payment, login, and permission configuration changes require owner and on-call SRE confirmation.",
    owner: "Release Governance",
    updatedAt: "2026-05-26",
    status: "active",
    tags: ["release", "risk", "rollback"],
    source: {
      type: "rag",
      title: "Canary Release Risk Handling",
      url: "mock://rag/release-risk-policy",
      location: "mock-data/knowledge/release-risk-policy.md",
      updatedAt: "2026-05-26"
    }
  }
];

const EXTRA_EXTERNAL = [
  {
    id: "jira-pay-2481",
    platform: "jira",
    title: "PAY-2481: Payment Retry Configuration Canary",
    url: "https://jira.example.local/browse/PAY-2481",
    owner: "Payment Platform",
    updatedAt: "2026-05-31",
    content: "PAY-2481 tracks the payment retry configuration change. Acceptance criteria require payment.retry.max_attempts=3, risk.mode=strict, payment success rate drop below 0.5%, and callback P95 below 1200ms during canary.",
    allowedUsers: ["u-alice", "u-bob"]
  },
  {
    id: "github-payment-callback-yaml",
    platform: "github",
    title: "payment-service config/payment.yaml",
    url: "https://github.example.local/org/payment-service/blob/main/config/payment.yaml",
    owner: "Payment Platform",
    updatedAt: "2026-05-31",
    content: "retry.max_attempts: 3\nrisk.mode: strict\ncallback.timeout_ms: 3000\nrollout.region: cn-east-1\nrollout.percent: 10",
    allowedUsers: ["u-alice"]
  },
  {
    id: "confluence-payment-incident-private",
    platform: "confluence",
    title: "Private Payment Incident Review Draft",
    url: "https://confluence.example.local/display/PAY/private-payment-incident-draft",
    owner: "Payment Platform",
    updatedAt: "2026-05-31",
    content: "This draft contains unpublished incident analysis and sensitive customer-impact scope. It is visible only to the incident review group.",
    allowedUsers: ["u-bob"]
  }
];

export async function loadPrototypeStore(rootDir = ROOT_DIR) {
  const base = await loadMockStore(rootDir);
  const rag = [
    ...base.rag.map(localizeBaseRag),
    ...EXTRA_RAG.map((entry) => ({
      ...createKnowledgeEntry(entry),
      id: entry.id,
      source: entry.source
    }))
  ];

  return {
    ...base,
    rag,
    external: [...base.external.map(localizeBaseExternal), ...EXTRA_EXTERNAL],
    users: base.users.map((user) => ({
      ...user,
      displayRole: user.roles.includes("knowledge-maintainer") ? "Knowledge maintainer" : "Member"
    }))
  };
}

function localizeBaseRag(entry) {
  const overrides = {
    "rag-vpn-troubleshooting": {
      title: "VPN Troubleshooting Runbook",
      body:
        "When a member cannot connect to VPN, check account status, MFA status, client version, and local network first. AUTH-401 usually means account or MFA validation failed. NET-timeout usually points to local network, proxy, or egress firewall policy. Never paste VPN tokens, temporary verification codes, or full client logs into chats or tickets.",
      source: {
        ...entry.source,
        title: "VPN Troubleshooting Runbook"
      }
    },
    "rag-payment-config": {
      title: "Payment Service Configuration",
      body:
        "Core payment service settings include payment.retry.max_attempts, payment.risk.mode, and payment.callback.timeout_ms. Production defaults are max_attempts=3, risk.mode=strict, and callback.timeout_ms=3000. Configuration changes must go through canary release and reference a JIRA change ticket.",
      source: {
        ...entry.source,
        title: "Payment Service Configuration"
      }
    },
    "rag-confluence-update-policy": {
      title: "Controlled Confluence Update Policy",
      body:
        "AI may draft Confluence updates, but it must not modify a page without permission checks, a diff preview, explicit user confirmation, and an audit record. Allowed changes are low-risk text edits on pages created by the user, owned by the user, or explicitly delegated by the page owner. Page deletion, moves, permission changes, bulk edits, and overwriting concurrent edits are not allowed.",
      source: {
        ...entry.source,
        title: "Controlled Confluence Update Policy"
      }
    }
  };

  return {
    ...entry,
    ...(overrides[entry.id] || {})
  };
}

function localizeBaseExternal(item) {
  const overrides = {
    "confluence-payment-rollout": {
      title: "Payment Service 2026-05 Canary Release Notes",
      content:
        "This canary release changes payment.retry.max_attempts from 2 to 3 and keeps payment.risk.mode=strict. Canary scope is 10% traffic in cn-east-1. Rollback criteria are payment success rate dropping more than 0.5% or callback P95 exceeding 1200ms."
    },
    "confluence-vpn-faq": {
      title: "VPN Frequently Asked Questions",
      content:
        "VPN AUTH-401 errors are usually related to account lock, MFA failure, or missing membership in the vpn-users group. NET-timeout errors are usually related to local network, proxy, or egress firewall settings."
    },
    "github-payment-readme": {
      title: "payment-service README",
      content:
        "payment-service handles payment callbacks, retry behavior, and risk-mode selection. Configuration is managed in config/payment.yaml. Callback timeout defaults to 3000ms. Releases must reference a JIRA change ticket."
    },
    "github-vpn-client-pr": {
      title: "vpn-client PR #128: Improve MFA Error Message",
      content:
        "PR #128 changes the AUTH-401 message to ask users to check account status and MFA push notifications, and adds request_id to client logs for troubleshooting."
    }
  };

  return {
    ...item,
    ...(overrides[item.id] || {})
  };
}

export function createDemoSessions() {
  return [
    {
      id: "session-payment-rollout",
      title: "Payment canary review",
      updatedAt: "2026-05-31T20:18:00+08:00",
      userId: "u-alice",
      messages: [
        {
          role: "user",
          content: "What should I check for the payment configuration canary?",
          createdAt: "20:18"
        },
        {
          role: "assistant",
          content: "Check retry.max_attempts, risk.mode, callback P95, rollback thresholds, and the JIRA change ticket. The answer should cite both curated RAG knowledge and the Confluence canary notes.",
          createdAt: "20:18",
          sources: ["rag-payment-config", "confluence-payment-rollout"]
        }
      ]
    },
    {
      id: "session-vpn-auth",
      title: "VPN AUTH-401",
      updatedAt: "2026-05-31T19:42:00+08:00",
      userId: "u-alice",
      messages: [
        {
          role: "user",
          content: "How should I handle VPN AUTH-401?",
          createdAt: "19:42"
        },
        {
          role: "assistant",
          content: "Check account status, MFA, vpn-users membership, and client version first. Do not paste tokens or full logs.",
          createdAt: "19:42",
          sources: ["rag-vpn-troubleshooting", "confluence-vpn-faq"]
        }
      ]
    }
  ];
}

export function normalizeAnswerMode(mode = "auto") {
  const value = String(mode || "auto").trim().toLowerCase();
  return ANSWER_MODES.has(value) ? value : "auto";
}

export function searchPrototypeRag(store, query) {
  const terms = tokenize(query);

  if (terms.length === 0) {
    return [];
  }

  return store.rag
    .map((entry) => ({
      entry,
      score: scoreKnowledgeEntry(entry, terms),
      snippet: buildSnippet(`${entry.title} ${entry.body}`, terms)
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
}

export function searchPrototypeExternal(store, { query, platform = "all", userId = "u-alice" }) {
  const terms = tokenize(query);
  const wantedPlatform = normalizePlatform(platform);

  if (terms.length === 0) {
    return {
      results: [],
      filteredCount: 0,
      queryTerms: []
    };
  }

  const candidates = store.external
    .filter((item) => wantedPlatform === "all" || item.platform === wantedPlatform)
    .map((item) => ({
      item,
      score: scoreExternalItem(item, terms),
      accessible: canReadExternal(item, userId)
    }))
    .filter((result) => result.score > 0);

  const results = candidates
    .filter((result) => result.accessible)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .map(({ item, score }) => decorateExternalResult(item, score, terms));

  return {
    results,
    filteredCount: candidates.filter((result) => !result.accessible).length,
    queryTerms: terms
  };
}

export function summarizePrototypeItem(store, { id, url, userId = "u-alice" }) {
  const item = findExternalItem(store, { id, url });

  if (!item) {
    return unsupportedExternalResult(url);
  }

  if (!canReadExternal(item, userId)) {
    return {
      ok: false,
      errorType: "permission-denied",
      title: item.title,
      platform: item.platform,
      message: "The current user cannot read this source. The system will not show snippets or place the content into model context.",
      segments: [
        statusStep("Source detected", "done", platformLabel(item.platform)),
        statusStep("Permission check", "blocked", "Read permission is missing; processing stopped")
      ]
    };
  }

  const sentences = splitSentences(item.content);
  const keyPoints = sentences.slice(0, 4);
  const risks = buildRisks(item.content);

  return {
    ok: true,
    source: sourceFromExternal(item),
    summary: {
      overview: `${platformLabel(item.platform)} "${item.title}" mainly states: ${sentences[0] || item.content}`,
      keyPoints,
      risks,
      suggestedQuestions: buildSuggestedQuestions(item)
    },
    item: decorateExternalResult(item, 1, tokenize(item.title)),
    segments: [
      statusStep("Source detected", "done", platformLabel(item.platform)),
      statusStep("Permission check", "done", `${userId} can read this source`),
      statusStep("Page read", "done", "Title, body, updated time, and owner loaded"),
      statusStep("Chunk summary", "done", `${Math.max(1, keyPoints.length)} key point(s) generated`)
    ]
  };
}

export function answerPrototypeQuestion(
  store,
  { question, mode = "auto", selectedExternalIds = [], userId = "u-alice", conversationId }
) {
  const answerMode = normalizeAnswerMode(mode);
  const selected = selectAccessibleExternal(store, selectedExternalIds, userId);
  const deniedSelectedCount = selectedExternalIds.length - selected.length;
  const ragMatches = answerMode === "external-only" ? [] : searchPrototypeRag(store, question).slice(0, 3);
  const externalMatches = chooseExternalEvidence(store, {
    answerMode,
    question,
    selectedExternal: selected,
    userId,
    ragMatches
  });
  const ragSources = ragMatches.map(({ entry, snippet, score }) => sourceFromRag(entry, snippet, score));
  const externalSources = externalMatches.map((item) => sourceFromExternal(item));
  const sources = [...ragSources, ...externalSources];
  const timeline = buildRetrievalTimeline({
    answerMode,
    ragMatches,
    externalMatches,
    selected,
    deniedSelectedCount,
    question
  });

  if (sources.length === 0) {
    return {
      ok: true,
      conversationId,
      mode: answerMode,
      confidence: "low",
      answer: "No reliable evidence was found. Try another keyword, select an accessible external result, or allow the assistant to combine curated RAG knowledge.",
      sections: [
        {
          title: "Answer",
          body: "No citable source is available, so the prototype refuses to provide a definitive business answer."
        }
      ],
      sources: [],
      warnings: ["No reliable source was found; no definitive business conclusion was generated."],
      retrievalTimeline: timeline
    };
  }

  const warnings = buildWarnings(ragMatches, externalMatches, deniedSelectedCount);
  const sections = buildAnswerSections(question, ragMatches, externalMatches, answerMode);

  return {
    ok: true,
    conversationId,
    mode: answerMode,
    confidence: sources.length >= 2 ? "high" : "medium",
    answer: sections.map((section) => `${section.title}：${section.body}`).join("\n"),
    sections,
    sources,
    warnings,
    retrievalTimeline: timeline
  };
}

export function draftConfluenceUpdate(
  store,
  { sourceId = "confluence-payment-rollout", instruction = "", userId = "u-alice" }
) {
  const user = store.users.find((candidate) => candidate.id === userId);
  const item = store.external.find((candidate) => candidate.id === sourceId);

  if (!item || item.platform !== "confluence") {
    return {
      ok: false,
      errorType: "target-not-supported",
      message: "Select a Confluence page to generate a controlled update preview."
    };
  }

  const canRead = canReadExternal(item, userId);
  const canEdit = canRead && user?.roles.includes("knowledge-maintainer");

  if (!canEdit) {
    return {
      ok: false,
      errorType: "edit-permission-denied",
      message: "The current user does not have low-risk edit permission for this page. The write path is blocked and only the audit hint is kept.",
      target: sourceFromExternal(item),
      checks: [
        statusStep("Read permission", canRead ? "done" : "blocked", canRead ? "Page can be read" : "No read permission"),
        statusStep("Edit permission", "blocked", "Missing knowledge-maintainer role or page delegation")
      ]
    };
  }

  const normalizedInstruction =
    instruction.trim() || "Add rollback criteria to the payment rollout page: success rate drop over 0.5% or callback P95 over 1200ms.";

  return {
    ok: true,
    target: sourceFromExternal(item),
    instruction: normalizedInstruction,
    checks: [
      statusStep("Read permission", "done", "The current user can read the page"),
      statusStep("Edit permission", "done", "Knowledge maintainer role passed"),
      statusStep("Version check", "done", "Page version is unchanged; preview can be generated"),
      statusStep("Submit guard", "pending", "Waiting for user confirmation; the prototype will not write to the external system")
    ],
    draft: {
      title: item.title,
      before: "Rollback criteria are payment success rate dropping more than 0.5% or callback P95 exceeding 1200ms.",
      after: "Rollback criteria are payment success rate dropping more than 0.5% or callback P95 exceeding 1200ms; before submit, confirm PAY-2481 is still in the canary window.",
      diff: [
        "- Rollback criteria are payment success rate dropping more than 0.5% or callback P95 exceeding 1200ms.",
        "+ Rollback criteria are payment success rate dropping more than 0.5% or callback P95 exceeding 1200ms; before submit, confirm PAY-2481 is still in the canary window."
      ]
    },
    auditPreview: {
      operator: user?.name || userId,
      action: "confluence.update.preview",
      riskLevel: "low",
      requiresConfirmation: true
    }
  };
}

function chooseExternalEvidence(store, { answerMode, question, selectedExternal, userId, ragMatches }) {
  if (answerMode === "rag-only") {
    return [];
  }

  if (answerMode === "external-only") {
    return selectedExternal;
  }

  if (answerMode === "rag-plus-external") {
    return selectedExternal.length > 0
      ? selectedExternal
      : searchPrototypeExternal(store, { query: question, userId }).results.slice(0, 2).map((item) => item.raw);
  }

  if (selectedExternal.length > 0) {
    return selectedExternal;
  }

  if (shouldTriggerExternal(question, ragMatches)) {
    return searchPrototypeExternal(store, { query: question, userId }).results.slice(0, 3).map((item) => item.raw);
  }

  return [];
}

function shouldTriggerExternal(question, ragMatches) {
  if (ragMatches.length === 0) {
    return true;
  }

  const normalized = String(question || "").toLowerCase();
  return /latest|current|realtime|real-time|jira|github|confluence|pr|issue|page|link|canary|rollout|release|payment/.test(
    normalized
  );
}

function buildRetrievalTimeline({ answerMode, ragMatches, externalMatches, selected, deniedSelectedCount, question }) {
  const timeline = [];

  if (answerMode === "external-only") {
    timeline.push(statusStep("RAG search", "skipped", "Answer scope is current context only"));
  } else {
    timeline.push(
      statusStep(
        "RAG search",
        ragMatches.length > 0 ? "done" : "empty",
        ragMatches.length > 0 ? `${ragMatches.length} curated item(s) matched` : "No usable curated chunk matched"
      )
    );
  }

  if (answerMode === "rag-only") {
    timeline.push(statusStep("External search", "skipped", "Answer scope is RAG only"));
  } else if (selected.length > 0) {
    timeline.push(statusStep("External context", "done", `${selected.length} selected external result(s) used`));
  } else if (externalMatches.length > 0) {
    timeline.push(statusStep("External search", "done", `${externalMatches.length} authorized live source(s) added`));
  } else {
    timeline.push(
      statusStep(
        "External search",
        "empty",
        shouldTriggerExternal(question, ragMatches)
          ? "No accessible external result found"
          : "RAG evidence was sufficient; fallback was not triggered"
      )
    );
  }

  timeline.push(
    statusStep(
      "Permission filter",
      deniedSelectedCount > 0 ? "blocked" : "done",
      deniedSelectedCount > 0
        ? `${deniedSelectedCount} inaccessible source(s) removed`
        : "Only content accessible to the current user was used"
    )
  );

  return timeline;
}

function buildAnswerSections(question, ragMatches, externalMatches, answerMode) {
  const topic = inferTopic(question, ragMatches, externalMatches);
  const evidenceLabels = [
    ...ragMatches.map(({ entry }) => `RAG "${entry.title}"`),
    ...externalMatches.map((item) => `${platformLabel(item.platform)} "${item.title}"`)
  ];

  const conclusionByTopic = {
    payment:
      "Use max_attempts=3, risk.mode=strict, and callback.timeout_ms=3000 as the current payment configuration baseline. During canary, watch payment success rate and callback P95, and keep the JIRA change ticket traceable.",
    vpn:
      "For VPN AUTH-401, check account status, MFA, vpn-users membership, and client version first. For NET-timeout, focus on local network, proxy, and egress firewall policy.",
    confluence:
      "Confluence updates must go through a controlled preview: check permissions, generate a draft and diff, require user confirmation, then record an audit trail before any write.",
    generic:
      "The answer is based on the evidence currently accessible to this user. For fresher external context, use Auto or RAG + current context."
  };

  const nextByTopic = {
    payment:
      "For a demo, ask about the configuration first, add the Confluence rollout page or GitHub config file as context, then show the JIRA source in citations.",
    vpn:
      "Have the user self-check against the FAQ and keep request_id for IT Support. Do not paste tokens, verification codes, or full logs into the chat.",
    confluence:
      "Use maintainer Alice to generate the diff preview, then switch to Bob to show edit permission blocking.",
    generic:
      "Add more specific keywords or select an external result to improve citations and summary quality."
  };

  return [
    {
      title: "Answer",
      body: conclusionByTopic[topic]
    },
    {
      title: "Evidence",
      body: `This answer used ${evidenceLabels.join(", ")}. Scope is "${modeLabel(answerMode)}"; unauthorized content is excluded.`
    },
    {
      title: "Next step",
      body: nextByTopic[topic]
    }
  ];
}

function buildWarnings(ragMatches, externalMatches, deniedSelectedCount) {
  const warnings = [];

  if (deniedSelectedCount > 0) {
    warnings.push("Some selected sources were inaccessible and removed from the answer context.");
  }

  if (ragMatches.some(({ entry }) => entry.status === "expired")) {
    warnings.push("Some curated knowledge is stale; treat the answer as time-sensitive.");
  }

  if (externalMatches.length === 0 && ragMatches.length === 1) {
    warnings.push("Only one source supports this answer. Add an external result or more keywords for stronger evidence.");
  }

  return warnings;
}

function inferTopic(question, ragMatches, externalMatches) {
  const haystack = [
    question,
    ...ragMatches.map(({ entry }) => `${entry.title} ${entry.body}`),
    ...externalMatches.map((item) => `${item.title} ${item.content}`)
  ]
    .join(" ")
    .toLowerCase();

  if (/payment|callback|retry|canary|rollout|pay-/.test(haystack)) {
    return "payment";
  }

  if (/vpn|auth-401|mfa|net-timeout/.test(haystack)) {
    return "vpn";
  }

  if (/confluence|update|draft|diff|audit/.test(haystack)) {
    return "confluence";
  }

  return "generic";
}

function selectAccessibleExternal(store, selectedExternalIds, userId) {
  const selected = new Set(selectedExternalIds || []);
  return store.external.filter((item) => selected.has(item.id) && canReadExternal(item, userId));
}

function findExternalItem(store, { id, url }) {
  if (id) {
    return store.external.find((item) => item.id === id);
  }

  if (url) {
    const normalized = String(url).trim().replace(/\/+$/, "");
    return store.external.find((item) => item.url.replace(/\/+$/, "") === normalized);
  }

  return null;
}

function unsupportedExternalResult(url) {
  const value = String(url || "").trim();
  const looksSupported = /confluence|github|jira/.test(value);

  return {
    ok: false,
    errorType: looksSupported ? "not-in-demo-data" : "unsupported-link",
    message: looksSupported
      ? "This link type is supported, but the current mock data does not include this page. Use a sample link or a source search result."
      : "This prototype currently supports Confluence, GitHub, and JIRA-style links.",
    segments: [statusStep("Source detected", looksSupported ? "empty" : "blocked", value || "No link provided")]
  };
}

function sourceFromRag(entry, snippet = entry.body, score = 1) {
  return {
    id: entry.id,
    type: "rag",
    label: "RAG",
    title: entry.title,
    url: entry.source?.url || `mock://rag/${entry.id}`,
    location: entry.source?.location || entry.id,
    updatedAt: entry.updatedAt,
    owner: entry.owner,
    score,
    excerpt: snippet
  };
}

function sourceFromExternal(item) {
  return {
    id: item.id,
    type: item.platform,
    label: platformLabel(item.platform),
    title: item.title,
    url: item.url,
    location: item.id,
    updatedAt: item.updatedAt,
    owner: item.owner,
    excerpt: buildSnippet(item.content, tokenize(item.title)),
    raw: item
  };
}

function decorateExternalResult(item, score, terms) {
  return {
    id: item.id,
    platform: item.platform,
    platformLabel: platformLabel(item.platform),
    title: item.title,
    url: item.url,
    owner: item.owner,
    updatedAt: item.updatedAt,
    score,
    snippet: buildSnippet(item.content, terms),
    raw: item
  };
}

function canReadExternal(item, userId) {
  return item.allowedUsers?.includes(userId);
}

function scoreKnowledgeEntry(entry, terms) {
  const title = normalize(entry.title);
  const body = normalize(entry.body);
  const tags = (entry.tags || []).map(normalize);

  return terms.reduce((score, term) => {
    if (title.includes(term)) score += 5;
    if (tags.some((tag) => tag.includes(term))) score += 3;
    if (body.includes(term)) score += 1;
    return score;
  }, 0);
}

function scoreExternalItem(item, terms) {
  const title = normalize(item.title);
  const body = normalize(item.content);
  const platform = normalize(item.platform);

  return terms.reduce((score, term) => {
    if (title.includes(term)) score += 5;
    if (platform.includes(term)) score += 2;
    if (body.includes(term)) score += 1;
    return score;
  }, 0);
}

function tokenize(query) {
  const normalized = normalize(query);
  const terms = normalized
    .split(/[\s/._:#-]+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const cjkTerms = [...normalized.matchAll(/[\p{Script=Han}]{2,}/gu)]
    .flatMap((match) => cjkBigrams(match[0]));

  return [...new Set([...terms, ...cjkTerms])];
}

function cjkBigrams(value) {
  const chars = [...value];

  if (chars.length <= 2) {
    return [value];
  }

  return chars.slice(0, -1).map((char, index) => `${char}${chars[index + 1]}`);
}

function buildSnippet(value, terms) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  const firstTerm = terms.find((term) => text.toLowerCase().includes(term.toLowerCase()));

  if (!firstTerm) {
    return truncate(text, 150);
  }

  const index = text.toLowerCase().indexOf(firstTerm.toLowerCase());
  const start = Math.max(0, index - 48);
  return `${start > 0 ? "..." : ""}${truncate(text.slice(start), 150)}`;
}

function splitSentences(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？.!?])\s+|[。！？]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildRisks(content) {
  const text = String(content || "");
  const risks = [];

  if (/rollback|drop|exceed|failure|threshold|canary/i.test(text)) {
    risks.push("Release or stability thresholds are present; keep rollback criteria visible.");
  }

  if (/token|verification|sensitive|permission|private|internal/i.test(text)) {
    risks.push("The content may involve permissions or sensitive data; show it only according to the current user's access.");
  }

  if (/must|never|not allowed|required|forbidden/i.test(text)) {
    risks.push("This source contains hard constraints that should be clearly cited.");
  }

  return risks.length > 0 ? risks : ["No obvious risk found, but source freshness still matters."];
}

function buildSuggestedQuestions(item) {
  if (item.platform === "github") {
    return ["Does this file match the curated RAG configuration?", "Which JIRA change ticket is required for release?"];
  }

  if (item.platform === "confluence") {
    return ["What risks should I verify on this page?", "How should I act when combining this page with curated RAG?"];
  }

  return ["What is the current status?", "Which sources are traceable?"];
}

function normalizePlatform(platform) {
  const value = normalize(platform || "all");
  return ["confluence", "github", "jira"].includes(value) ? value : "all";
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function truncate(value, maxLength) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function platformLabel(platform) {
  return {
    rag: "RAG",
    confluence: "Confluence",
    github: "GitHub",
    jira: "JIRA"
  }[platform] || platform;
}

function modeLabel(mode) {
  return {
    auto: "Auto",
    "rag-only": "RAG only",
    "external-only": "Current context only",
    "rag-plus-external": "RAG + current context"
  }[mode] || mode;
}

function statusStep(label, status, detail) {
  return { label, status, detail };
}
