import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  answerPrototypeQuestion,
  createDemoSessions,
  draftConfluenceUpdate,
  loadPrototypeStore,
  searchPrototypeExternal,
  searchPrototypeRag,
  summarizePrototypeItem
} from "./prototype-engine.js";

const PORT = Number(process.env.PORT || 4590);
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = fileURLToPath(new URL("../public/", import.meta.url));
const store = await loadPrototypeStore();
const sessions = createDemoSessions();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/health") {
      return json(response, 200, {
        ok: true,
        service: "coremind",
        mode: "ragflow-inspired-mock",
        repository: "https://github.com/lanhas/coremind"
      });
    }

    if (request.method === "GET" && url.pathname === "/api/bootstrap") {
      const userId = url.searchParams.get("userId") || "u-alice";
      return json(response, 200, {
        users: store.users,
        sessions: visibleSessions(userId),
        metrics: buildMetrics(userId),
        examples: buildExamples()
      });
    }

    if (request.method === "GET" && url.pathname === "/api/sessions") {
      const userId = url.searchParams.get("userId") || "u-alice";
      return json(response, 200, { sessions: visibleSessions(userId) });
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/sessions/")) {
      const userId = url.searchParams.get("userId") || "u-alice";
      const id = decodeURIComponent(url.pathname.slice("/api/sessions/".length));
      const session = visibleSessions(userId).find((candidate) => candidate.id === id);
      return json(response, session ? 200 : 404, session ? { session } : { error: "session not found" });
    }

    if (request.method === "GET" && url.pathname === "/api/rag") {
      const query = url.searchParams.get("q") || "";
      const results = searchPrototypeRag(store, query).slice(0, 6).map(({ entry, score, snippet }) => ({
        id: entry.id,
        title: entry.title,
        owner: entry.owner,
        updatedAt: entry.updatedAt,
        tags: entry.tags,
        score,
        snippet,
        source: entry.source
      }));
      return json(response, 200, { results });
    }

    if (request.method === "GET" && url.pathname === "/api/search") {
      const payload = searchPrototypeExternal(store, {
        query: url.searchParams.get("q") || "",
        platform: url.searchParams.get("platform") || "all",
        userId: url.searchParams.get("userId") || "u-alice"
      });
      return json(response, 200, payload);
    }

    if (request.method === "GET" && url.pathname === "/api/summarize") {
      const result = summarizePrototypeItem(store, {
        id: url.searchParams.get("id"),
        url: url.searchParams.get("url"),
        userId: url.searchParams.get("userId") || "u-alice"
      });
      return json(response, result.ok ? 200 : 403, result);
    }

    if (request.method === "POST" && url.pathname === "/api/answer") {
      const body = await readJson(request);
      const result = answerPrototypeQuestion(store, body);
      const session = upsertSession({
        userId: body.userId || "u-alice",
        conversationId: body.conversationId,
        question: body.question || "",
        result
      });
      return json(response, 200, {
        ...result,
        conversationId: session.id,
        session
      });
    }

    if (request.method === "POST" && url.pathname === "/api/update-preview") {
      const body = await readJson(request);
      const result = draftConfluenceUpdate(store, body);
      return json(response, result.ok ? 200 : 403, result);
    }

    return serveStatic(request, response, url.pathname);
  } catch (error) {
    return json(response, 500, {
      error: error.message
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`CoreMind listening on http://${HOST}:${PORT}`);
});

function visibleSessions(userId) {
  return sessions
    .filter((session) => session.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function upsertSession({ userId, conversationId, question, result }) {
  let session = sessions.find((candidate) => candidate.id === conversationId && candidate.userId === userId);

  if (!session) {
    session = {
      id: `session-${Date.now().toString(36)}`,
      title: question.slice(0, 32) || "New chat",
      userId,
      updatedAt: new Date().toISOString(),
      messages: []
    };
    sessions.push(session);
  }

  const createdAt = new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  session.messages.push(
    {
      role: "user",
      content: question,
      createdAt
    },
    {
      role: "assistant",
      content: result.answer,
      sections: result.sections,
      sources: result.sources,
      warnings: result.warnings,
      retrievalTimeline: result.retrievalTimeline,
      mode: result.mode,
      confidence: result.confidence,
      createdAt
    }
  );
  session.updatedAt = new Date().toISOString();
  session.title = session.title || question.slice(0, 32) || "New chat";

  return session;
}

function buildMetrics(userId) {
  const accessibleExternal = store.external.filter((item) => item.allowedUsers?.includes(userId));
  return {
    ragDocuments: store.rag.length,
    externalItems: accessibleExternal.length,
    confluenceItems: accessibleExternal.filter((item) => item.platform === "confluence").length,
    githubItems: accessibleExternal.filter((item) => item.platform === "github").length,
    jiraItems: accessibleExternal.filter((item) => item.platform === "jira").length,
    sessions: visibleSessions(userId).length,
    sourceCoverage: "mock 100%"
  };
}

function buildExamples() {
  return {
    questions: [
      "What should I check for the payment configuration canary?",
      "How should I handle VPN AUTH-401?",
      "Why can't Confluence updates be submitted directly?",
      "What are the current acceptance criteria for PAY-2481?"
    ],
    links: [
      "https://confluence.example.local/display/PAY/2026-05-payment-rollout",
      "https://github.example.local/org/payment-service/blob/main/config/payment.yaml",
      "https://jira.example.local/browse/PAY-2481"
    ]
  };
}

async function serveStatic(request, response, pathname) {
  const safePathname = pathname === "/" ? "/index.html" : pathname;
  const filePath = join(PUBLIC_DIR, normalize(safePathname).replace(/^(\.\.[/\\])+/, ""));
  const rel = relative(PUBLIC_DIR, filePath);

  if (rel.startsWith("..") || rel === "") {
    return json(response, 404, { error: "not found" });
  }

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      return json(response, 404, { error: "not found" });
    }

    response.writeHead(200, {
      "content-type": contentType(filePath),
      "cache-control": "no-store"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    json(response, 404, { error: "not found" });
  }
}

function contentType(filePath) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  }[extname(filePath)] || "application/octet-stream";
}

function json(response, status, payload) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
