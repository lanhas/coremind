const VIEW_META = {
  chat: ["Assistant", "Ask anything with trusted sources."],
  knowledge: ["Knowledge", "Manage curated team knowledge."],
  sources: ["Data Sources", "Connect and search external systems."],
  ingestion: ["Ingestion", "Review sync jobs and summarize links."],
  governance: ["Governance", "Control permissions, previews, and audit trails."]
};

const state = {
  userId: "u-alice",
  activeView: "chat",
  activeDrawer: "sources",
  users: [],
  sessions: [],
  metrics: {},
  examples: { questions: [], links: [] },
  selectedMode: "auto",
  selectedExternal: new Map(),
  activeSessionId: null,
  currentMessages: []
};

const elements = {
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  viewEyebrow: document.querySelector("#viewEyebrow"),
  viewTitle: document.querySelector("#viewTitle"),
  userSelect: document.querySelector("#userSelect"),
  userRole: document.querySelector("#userRole"),
  sessionList: document.querySelector("#sessionList"),
  newSessionButton: document.querySelector("#newSessionButton"),
  healthPill: document.querySelector("#healthPill"),
  answerPanel: document.querySelector("#answerPanel"),
  selectedContext: document.querySelector("#selectedContext"),
  questionInput: document.querySelector("#questionInput"),
  askButton: document.querySelector("#askButton"),
  questionExamples: document.querySelector("#questionExamples"),
  contextMenuButton: document.querySelector("#contextMenuButton"),
  contextMenu: document.querySelector("#contextMenu"),
  sourceList: document.querySelector("#sourceList"),
  retrievalTimeline: document.querySelector("#retrievalTimeline"),
  drawerTabs: document.querySelectorAll(".drawer-tab"),
  metricGrid: document.querySelector("#metricGrid"),
  knowledgeTable: document.querySelector("#knowledgeTable"),
  sourceConfigGrid: document.querySelector("#sourceConfigGrid"),
  pipelineList: document.querySelector("#pipelineList"),
  auditList: document.querySelector("#auditList"),
  linkInput: document.querySelector("#linkInput"),
  summarizeButton: document.querySelector("#summarizeButton"),
  linkExamples: document.querySelector("#linkExamples"),
  summaryBox: document.querySelector("#summaryBox"),
  platformSelect: document.querySelector("#platformSelect"),
  searchInput: document.querySelector("#searchInput"),
  searchButton: document.querySelector("#searchButton"),
  searchNote: document.querySelector("#searchNote"),
  resultList: document.querySelector("#resultList"),
  updateInstruction: document.querySelector("#updateInstruction"),
  previewUpdateButton: document.querySelector("#previewUpdateButton"),
  updatePreview: document.querySelector("#updatePreview")
};

await init();

async function init() {
  bindEvents();
  await checkHealth();
  await loadBootstrap();
  renderAll();
  await runInitialSearch();
}

function bindEvents() {
  elements.navItems.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  elements.drawerTabs.forEach((button) => {
    button.addEventListener("click", () => setDrawer(button.dataset.drawer));
  });

  elements.userSelect.addEventListener("change", async () => {
    state.userId = elements.userSelect.value;
    state.selectedExternal.clear();
    state.activeSessionId = null;
    state.currentMessages = [];
    await loadBootstrap();
    renderAll();
    await runInitialSearch();
  });

  elements.contextMenuButton.addEventListener("click", () => {
    const isOpen = !elements.contextMenu.hidden;
    elements.contextMenu.hidden = isOpen;
    elements.contextMenuButton.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = elements.contextMenu.contains(event.target);
    const clickedButton = elements.contextMenuButton.contains(event.target);

    if (!clickedInsideMenu && !clickedButton) {
      closeContextMenu();
    }
  });

  elements.contextMenu.addEventListener("click", (event) => {
    const modeButton = event.target.closest("[data-mode]");
    const toolButton = event.target.closest("[data-open-tool]");

    if (modeButton) {
      state.selectedMode = modeButton.dataset.mode;
      renderModeOptions();
      renderSelectedContext();
      return;
    }

    if (toolButton) {
      setView(toolButton.dataset.openTool === "link" ? "ingestion" : "sources");
      closeContextMenu();
    }
  });

  elements.askButton.addEventListener("click", askQuestion);
  elements.questionInput.addEventListener("input", autoSizeComposer);
  elements.questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askQuestion();
    }
  });

  elements.searchButton.addEventListener("click", searchExternal);
  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchExternal();
    }
  });

  elements.summarizeButton.addEventListener("click", () => summarizeLink());
  elements.previewUpdateButton.addEventListener("click", previewUpdate);
  elements.newSessionButton.addEventListener("click", () => {
    state.activeSessionId = null;
    state.currentMessages = [];
    renderSessions();
    renderMessages();
    clearEvidencePanels();
    setView("chat");
    elements.questionInput.focus();
  });
}

async function checkHealth() {
  try {
    const health = await api("/health");
    elements.healthPill.textContent = health.ok ? "Mock service online" : "Service degraded";
    elements.healthPill.classList.add("ok");
  } catch {
    elements.healthPill.textContent = "Service offline";
    elements.healthPill.classList.remove("ok");
  }
}

async function loadBootstrap() {
  const payload = await api(`/api/bootstrap?userId=${encodeURIComponent(state.userId)}`);
  state.users = payload.users;
  state.sessions = payload.sessions;
  state.metrics = payload.metrics;
  state.examples = payload.examples;
}

function renderAll() {
  renderView();
  renderUsers();
  renderSessions();
  renderMessages();
  renderSelectedContext();
  renderModeOptions();
  renderExamples();
  renderManagementPages();
}

function setView(view) {
  state.activeView = view;
  renderView();
}

function renderView() {
  const [eyebrow, title] = VIEW_META[state.activeView] || VIEW_META.chat;
  elements.viewEyebrow.textContent = eyebrow;
  elements.viewTitle.textContent = title;
  elements.navItems.forEach((button) => button.classList.toggle("active", button.dataset.view === state.activeView));
  elements.views.forEach((view) => view.classList.toggle("active", view.id === `${state.activeView}View`));
}

function setDrawer(drawer) {
  state.activeDrawer = drawer;
  elements.drawerTabs.forEach((button) => button.classList.toggle("active", button.dataset.drawer === drawer));
  elements.sourceList.classList.toggle("active", drawer === "sources");
  elements.retrievalTimeline.classList.toggle("active", drawer === "activity");
}

function closeContextMenu() {
  elements.contextMenu.hidden = true;
  elements.contextMenuButton.setAttribute("aria-expanded", "false");
}

function renderUsers() {
  elements.userSelect.innerHTML = state.users
    .map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`)
    .join("");
  elements.userSelect.value = state.userId;
  const user = state.users.find((candidate) => candidate.id === state.userId);
  elements.userRole.textContent = user ? `${user.displayRole} · ${user.roles.join(", ")}` : "";
}

function renderSessions() {
  if (state.sessions.length === 0) {
    elements.sessionList.innerHTML = `<p class="muted-copy">No chats yet.</p>`;
    return;
  }

  elements.sessionList.innerHTML = state.sessions
    .map(
      (session) => `
        <button class="session-item ${session.id === state.activeSessionId ? "active" : ""}" data-session-id="${escapeHtml(session.id)}">
          <strong>${escapeHtml(session.title)}</strong>
          <span>${escapeHtml(formatDate(session.updatedAt))} · ${session.messages.length} messages</span>
        </button>
      `
    )
    .join("");

  elements.sessionList.querySelectorAll(".session-item").forEach((button) => {
    button.addEventListener("click", async () => {
      await loadSession(button.dataset.sessionId);
      setView("chat");
    });
  });
}

async function loadSession(id) {
  const payload = await api(`/api/sessions/${encodeURIComponent(id)}?userId=${encodeURIComponent(state.userId)}`);
  state.activeSessionId = payload.session.id;
  state.currentMessages = payload.session.messages;
  renderSessions();
  renderMessages();
  const latestAssistant = [...state.currentMessages].reverse().find((message) => message.role === "assistant");

  if (latestAssistant) {
    renderTimeline(latestAssistant.retrievalTimeline || []);
    renderSources(latestAssistant.sources || []);
  }
}

function renderModeOptions() {
  elements.contextMenu.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.selectedMode);
  });
}

function renderExamples() {
  elements.questionExamples.innerHTML = state.examples.questions
    .map((question) => `<button data-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`)
    .join("");
  elements.questionExamples.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      elements.questionInput.value = button.dataset.question;
      autoSizeComposer();
      askQuestion();
    });
  });

  elements.linkExamples.innerHTML = state.examples.links
    .map((link, index) => `<button data-link="${escapeHtml(link)}">Sample ${index + 1}</button>`)
    .join("");
  elements.linkExamples.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      elements.linkInput.value = button.dataset.link;
      summarizeLink(button.dataset.link);
    });
  });
}

function renderSelectedContext() {
  const mode = modeLabel(state.selectedMode);

  if (state.selectedExternal.size === 0) {
    elements.selectedContext.innerHTML = `<span>${escapeHtml(mode)}</span><span>No external context selected</span>`;
    return;
  }

  const chips = [...state.selectedExternal.values()]
    .map(
      (item) => `
        <span class="selected-chip" title="${escapeHtml(item.title)}">
          ${escapeHtml(item.platformLabel || platformLabel(item.platform))} · ${escapeHtml(item.title)}
        </span>
      `
    )
    .join("");
  elements.selectedContext.innerHTML = `<span>${escapeHtml(mode)}</span><div>${chips}</div>`;
}

function renderMessages() {
  if (state.currentMessages.length === 0) {
    elements.answerPanel.innerHTML = `
      <div class="welcome-card">
        <h2>How can I help?</h2>
        <p>Ask a team knowledge question. Add links or scoped sources only when you need them.</p>
        <div class="quick-actions">${state.examples.questions
          .map((question) => `<button data-question="${escapeHtml(question)}">${escapeHtml(question)}</button>`)
          .join("")}</div>
      </div>
    `;
    elements.answerPanel.querySelectorAll("[data-question]").forEach((button) => {
      button.addEventListener("click", () => {
        elements.questionInput.value = button.dataset.question;
        autoSizeComposer();
        askQuestion();
      });
    });
    return;
  }

  elements.answerPanel.innerHTML = state.currentMessages.map(renderMessage).join("");
  elements.answerPanel.scrollTop = elements.answerPanel.scrollHeight;
}

function renderMessage(message) {
  if (message.role === "user") {
    return `
      <article class="message user">
        <div class="avatar">U</div>
        <div>
          <div class="message-header"><span>You</span><span>${escapeHtml(message.createdAt || "")}</span></div>
          <p>${escapeHtml(message.content)}</p>
        </div>
      </article>
    `;
  }

  const sections = message.sections?.length
    ? message.sections
        .map(
          (section) => `
            <section class="answer-section">
              <strong>${escapeHtml(section.title)}</strong>
              <p>${escapeHtml(section.body)}</p>
            </section>
          `
        )
        .join("")
    : `<p>${escapeHtml(message.content || "")}</p>`;

  const warnings = message.warnings?.length
    ? `<div class="warning-list">${message.warnings.map((warning) => `<div class="warning">${escapeHtml(warning)}</div>`).join("")}</div>`
    : "";

  return `
    <article class="message assistant">
      <div class="avatar assistant-avatar">S</div>
      <div>
        <div class="message-header">
          <span>CoreMind · ${escapeHtml(modeLabel(message.mode))} · ${escapeHtml(message.confidence || "mock")}</span>
          <span>${escapeHtml(message.createdAt || "")}</span>
        </div>
        ${sections}
        ${warnings}
      </div>
    </article>
  `;
}

async function askQuestion() {
  const question = elements.questionInput.value.trim();

  if (!question) {
    elements.questionInput.focus();
    return;
  }

  elements.askButton.disabled = true;
  closeContextMenu();
  appendLocalMessage({ role: "user", content: question, createdAt: currentTime() });
  appendLocalMessage({
    role: "assistant",
    content: "Searching trusted sources...",
    sections: [{ title: "Working", body: "Checking curated RAG first, then adding authorized external evidence when needed." }],
    createdAt: currentTime(),
    mode: state.selectedMode,
    confidence: "pending"
  });
  elements.questionInput.value = "";
  autoSizeComposer();

  try {
    const payload = await api("/api/answer", {
      method: "POST",
      body: {
        question,
        mode: state.selectedMode,
        selectedExternalIds: [...state.selectedExternal.keys()],
        userId: state.userId,
        conversationId: state.activeSessionId
      }
    });

    state.activeSessionId = payload.conversationId;
    state.currentMessages = payload.session.messages;
    state.sessions = [payload.session, ...state.sessions.filter((session) => session.id !== payload.session.id)];
    renderSessions();
    renderMessages();
    renderTimeline(payload.retrievalTimeline || []);
    renderSources(payload.sources || []);
  } catch (error) {
    replaceLastAssistantWithError(error.message);
  } finally {
    elements.askButton.disabled = false;
  }
}

function appendLocalMessage(message) {
  state.currentMessages = [...state.currentMessages, message];
  renderMessages();
}

function replaceLastAssistantWithError(message) {
  const messages = [...state.currentMessages];
  const index = messages.findLastIndex((item) => item.role === "assistant");

  if (index >= 0) {
    messages[index] = {
      role: "assistant",
      content: message,
      sections: [{ title: "Request failed", body: message }],
      warnings: ["Check that the local prototype service is still running."],
      createdAt: currentTime(),
      mode: state.selectedMode,
      confidence: "low"
    };
  }

  state.currentMessages = messages;
  renderMessages();
}

async function searchExternal() {
  const query = elements.searchInput.value.trim() || "payment rollout";
  elements.searchInput.value = query;
  elements.resultList.innerHTML = `<div class="loading">Searching authorized external sources...</div>`;
  const payload = await api(
    `/api/search?q=${encodeURIComponent(query)}&platform=${encodeURIComponent(elements.platformSelect.value)}&userId=${encodeURIComponent(state.userId)}`
  );

  elements.searchNote.textContent =
    payload.filteredCount > 0
      ? `${payload.filteredCount} result${payload.filteredCount > 1 ? "s" : ""} hidden by permissions.`
      : `${payload.results.length} accessible result${payload.results.length === 1 ? "" : "s"}.`;
  renderSearchResults(payload.results);
}

async function runInitialSearch() {
  elements.searchInput.value = "payment rollout";
  elements.platformSelect.value = "all";
  await searchExternal();
}

function renderSearchResults(results) {
  if (results.length === 0) {
    elements.resultList.innerHTML = `<p class="muted-copy">No accessible results found.</p>`;
    return;
  }

  elements.resultList.innerHTML = results.map(renderResultCard).join("");
  elements.resultList.querySelectorAll("[data-action='select']").forEach((button) => {
    button.addEventListener("click", () => {
      const item = parseJsonDataset(button.dataset.item);
      state.selectedExternal.set(item.id, item);
      renderSelectedContext();
      setView("chat");
    });
  });
  elements.resultList.querySelectorAll("[data-action='summarize']").forEach((button) => {
    button.addEventListener("click", () => summarizeLink(null, button.dataset.id));
  });
}

function renderResultCard(item) {
  return `
    <article class="result-card">
      <div class="badge-row">
        <span class="badge ${escapeHtml(item.platform)}">${escapeHtml(item.platformLabel)}</span>
        <span class="badge">Score ${escapeHtml(item.score)}</span>
      </div>
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.snippet)}</span>
      <span>${escapeHtml(item.owner)} · ${escapeHtml(item.updatedAt)}</span>
      <a href="${escapeAttribute(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.url)}</a>
      <div class="result-actions">
        <button data-action="select" data-item="${escapeAttribute(JSON.stringify(item))}">Add to chat</button>
        <button data-action="summarize" data-id="${escapeAttribute(item.id)}">Summarize</button>
      </div>
    </article>
  `;
}

async function summarizeLink(linkOverride, id) {
  const link = linkOverride || elements.linkInput.value.trim();
  const query = id ? `id=${encodeURIComponent(id)}` : `url=${encodeURIComponent(link)}`;

  if (!id && !link) {
    elements.linkInput.focus();
    return;
  }

  elements.summaryBox.innerHTML = `<div class="loading">Checking permissions and reading the page...</div>`;

  try {
    const payload = await api(`/api/summarize?${query}&userId=${encodeURIComponent(state.userId)}`);
    renderSummary(payload);

    if (payload.ok && payload.item) {
      state.selectedExternal.set(payload.item.id, payload.item);
      renderSelectedContext();
      renderTimeline(payload.segments || []);
      renderSources([payload.source]);
    }
  } catch (error) {
    elements.summaryBox.innerHTML = `<div class="summary-card error-card"><strong>Summary failed</strong><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function renderSummary(payload) {
  if (!payload.ok) {
    elements.summaryBox.innerHTML = `
      <div class="summary-card error-card">
        <h3>${escapeHtml(payload.errorType || "Unavailable")}</h3>
        <p>${escapeHtml(payload.message || "The page could not be summarized.")}</p>
      </div>
      ${renderMiniTimeline(payload.segments || [])}
    `;
    return;
  }

  elements.summaryBox.innerHTML = `
    <div class="summary-card">
      <div class="badge-row">
        <span class="badge ${escapeHtml(payload.source.type)}">${escapeHtml(payload.source.label)}</span>
        <span class="badge">${escapeHtml(payload.source.updatedAt)}</span>
      </div>
      <h3>${escapeHtml(payload.source.title)}</h3>
      <p>${escapeHtml(payload.summary.overview)}</p>
      <ul>
        ${payload.summary.keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
      </ul>
      <div class="warning-list">
        ${payload.summary.risks.map((risk) => `<div class="warning">${escapeHtml(risk)}</div>`).join("")}
      </div>
    </div>
    ${renderMiniTimeline(payload.segments || [])}
  `;
}

async function previewUpdate() {
  elements.updatePreview.innerHTML = `<div class="loading">Checking edit rights and generating a diff...</div>`;

  try {
    const preferredSource = [...state.selectedExternal.keys()].find((id) => id.startsWith("confluence")) || "confluence-payment-rollout";
    const payload = await api("/api/update-preview", {
      method: "POST",
      body: {
        userId: state.userId,
        sourceId: preferredSource,
        instruction: elements.updateInstruction.value
      }
    });
    renderUpdatePreview(payload);
  } catch (error) {
    elements.updatePreview.innerHTML = `<div class="update-card error-card"><strong>Preview failed</strong><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function renderUpdatePreview(payload) {
  if (!payload.ok) {
    elements.updatePreview.innerHTML = `
      <div class="update-card error-card">
        <h3>${escapeHtml(payload.errorType || "Blocked")}</h3>
        <p>${escapeHtml(payload.message)}</p>
      </div>
      ${renderMiniTimeline(payload.checks || [])}
    `;
    return;
  }

  elements.updatePreview.innerHTML = `
    <div class="update-card">
      <div class="badge-row">
        <span class="badge confluence">Confluence</span>
        <span class="badge">Confirmation required</span>
        <span class="badge">Low-risk text change</span>
      </div>
      <h3>${escapeHtml(payload.target.title)}</h3>
      <p>${escapeHtml(payload.instruction)}</p>
      <pre>${escapeHtml(payload.draft.diff.join("\n"))}</pre>
    </div>
    ${renderMiniTimeline(payload.checks || [])}
  `;
}

function renderTimeline(steps) {
  elements.retrievalTimeline.innerHTML = steps.length
    ? steps.map(renderTimelineStep).join("")
    : `<p class="muted-copy">No activity yet.</p>`;
}

function renderMiniTimeline(steps) {
  return `<div class="summary-card"><div class="timeline">${steps.map(renderTimelineStep).join("")}</div></div>`;
}

function renderTimelineStep(step) {
  const sign = step.status === "done" ? "✓" : step.status === "blocked" ? "!" : "·";
  return `
    <div class="timeline-step">
      <span class="dot ${escapeHtml(step.status)}">${sign}</span>
      <div>
        <strong>${escapeHtml(step.label)}</strong>
        <span>${escapeHtml(step.detail)}</span>
      </div>
    </div>
  `;
}

function renderSources(sources) {
  elements.sourceList.innerHTML = sources.length
    ? sources.map(renderSourceCard).join("")
    : `<p class="muted-copy">Sources will appear after an answer.</p>`;
}

function renderSourceCard(source) {
  return `
    <article class="source-card">
      <div class="badge-row">
        <span class="badge ${escapeHtml(source.type)}">${escapeHtml(source.label || platformLabel(source.type))}</span>
        <span class="badge">${escapeHtml(source.updatedAt || "")}</span>
      </div>
      <strong>${escapeHtml(source.title)}</strong>
      <span>${escapeHtml(source.owner || "")} · ${escapeHtml(source.location || "")}</span>
      <span>${escapeHtml(source.excerpt || "")}</span>
      <a href="${escapeAttribute(source.url || "#")}" target="_blank" rel="noreferrer">Open source</a>
    </article>
  `;
}

function clearEvidencePanels() {
  renderTimeline([]);
  renderSources([]);
}

function renderManagementPages() {
  renderMetrics();
  renderKnowledgeTable();
  renderSourceConfigGrid();
  renderPipelineList();
  renderAuditList();
}

function renderMetrics() {
  const cards = [
    ["RAG documents", state.metrics.ragDocuments],
    ["Accessible sources", state.metrics.externalItems],
    ["Confluence pages", state.metrics.confluenceItems],
    ["GitHub / JIRA", `${state.metrics.githubItems}/${state.metrics.jiraItems}`]
  ];
  elements.metricGrid.innerHTML = cards
    .map(
      ([label, value]) => `
        <div class="metric">
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      `
    )
    .join("");
}

function renderKnowledgeTable() {
  const rows = [
    ["Payment Platform", "Active", "5 docs", "Owner review due Jun 3"],
    ["VPN Support", "Active", "3 docs", "PII guard enabled"],
    ["Confluence Update Policy", "Governed", "1 policy", "Diff preview required"]
  ];
  elements.knowledgeTable.innerHTML = rows.map(renderTableRow).join("");
}

function renderSourceConfigGrid() {
  const sources = [
    ["Confluence", "Connected", "PAY and IT spaces", "User-token read"],
    ["GitHub", "Connected", "payment-service, vpn-client", "Path allowlist"],
    ["JIRA", "Preview", "PAY project", "Read-only issues"]
  ];
  elements.sourceConfigGrid.innerHTML = sources
    .map(
      ([name, status, scope, policy]) => `
        <article class="config-card">
          <strong>${escapeHtml(name)}</strong>
          <span>${escapeHtml(status)}</span>
          <p>${escapeHtml(scope)}</p>
          <small>${escapeHtml(policy)}</small>
        </article>
      `
    )
    .join("");
}

function renderPipelineList() {
  const jobs = [
    ["Parse", "Complete", "Markdown and Confluence pages normalized"],
    ["Chunk", "Complete", "Title-aware chunks with owner metadata"],
    ["Embed", "Running", "Mock vectors generated for demo collections"],
    ["Index", "Queued", "RAGFlow dataset sync pending Docker baseline"]
  ];
  elements.pipelineList.innerHTML = jobs
    .map(
      ([step, status, detail]) => `
        <div class="pipeline-row">
          <span>${escapeHtml(step)}</span>
          <strong>${escapeHtml(status)}</strong>
          <p>${escapeHtml(detail)}</p>
        </div>
      `
    )
    .join("");
}

function renderAuditList() {
  const rows = [
    ["Read allowed", "Alice summarized a Confluence rollout page"],
    ["Write blocked", "Bob tried a Confluence update preview without maintainer rights"],
    ["Source hidden", "One private incident draft hidden by permissions"],
    ["Answer guarded", "No-citation answers are marked uncertain"]
  ];
  elements.auditList.innerHTML = rows
    .map(
      ([event, detail]) => `
        <div class="audit-row">
          <strong>${escapeHtml(event)}</strong>
          <span>${escapeHtml(detail)}</span>
        </div>
      `
    )
    .join("");
}

function renderTableRow(row) {
  return `
    <div class="table-row">
      ${row.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}
    </div>
  `;
}

function autoSizeComposer() {
  elements.questionInput.style.height = "auto";
  elements.questionInput.style.height = `${Math.min(elements.questionInput.scrollHeight, 180)}px`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body ? { "content-type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || payload.error || `HTTP ${response.status}`);
  }

  return payload;
}

function modeLabel(mode) {
  return {
    auto: "Auto",
    "rag-only": "RAG only",
    "external-only": "Current context only",
    "rag-plus-external": "RAG + current context"
  }[mode] || mode || "Auto";
}

function platformLabel(platform) {
  return {
    rag: "RAG",
    confluence: "Confluence",
    github: "GitHub",
    jira: "JIRA"
  }[platform] || platform || "Source";
}

function currentTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function parseJsonDataset(value) {
  return JSON.parse(value || "{}");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
