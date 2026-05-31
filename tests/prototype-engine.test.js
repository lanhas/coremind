import assert from "node:assert/strict";
import test from "node:test";
import {
  answerPrototypeQuestion,
  draftConfluenceUpdate,
  loadPrototypeStore,
  searchPrototypeExternal,
  summarizePrototypeItem
} from "../src/prototype-engine.js";

const store = await loadPrototypeStore();

test("filters inaccessible external search results and reports filtered count", () => {
  const result = searchPrototypeExternal(store, {
    query: "rollout.percent",
    platform: "github",
    userId: "u-bob"
  });

  assert.equal(result.results.length, 0);
  assert.equal(result.filteredCount, 1);
});

test("summarizes accessible links with status segments", () => {
  const result = summarizePrototypeItem(store, {
    url: "https://confluence.example.local/display/PAY/2026-05-payment-rollout",
    userId: "u-alice"
  });

  assert.equal(result.ok, true);
  assert.equal(result.source.type, "confluence");
  assert.ok(result.segments.some((step) => step.label === "Permission check" && step.status === "done"));
});

test("external-only answer does not pull rag evidence", () => {
  const result = answerPrototypeQuestion(store, {
    question: "What should I check for the payment configuration canary?",
    mode: "external-only",
    selectedExternalIds: ["confluence-payment-rollout"],
    userId: "u-alice"
  });

  assert.equal(result.mode, "external-only");
  assert.ok(result.sources.length > 0);
  assert.ok(result.sources.every((source) => source.type !== "rag"));
});

test("confluence update preview requires maintainer permission", () => {
  const blocked = draftConfluenceUpdate(store, {
    sourceId: "confluence-payment-rollout",
    userId: "u-bob"
  });
  const allowed = draftConfluenceUpdate(store, {
    sourceId: "confluence-payment-rollout",
    userId: "u-alice"
  });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.errorType, "edit-permission-denied");
  assert.equal(allowed.ok, true);
  assert.equal(allowed.auditPreview.requiresConfirmation, true);
});
