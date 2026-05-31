const VALID_STATUSES = new Set(["draft", "active", "archived"]);

export function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) {
    throw new TypeError("tags must be an array");
  }

  return [
    ...new Set(
      tags
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean)
    )
  ].sort();
}

export function createKnowledgeEntry(input) {
  const entry = {
    title: String(input?.title ?? "").trim(),
    body: String(input?.body ?? "").trim(),
    owner: String(input?.owner ?? "").trim(),
    updatedAt: String(input?.updatedAt ?? "").trim(),
    status: String(input?.status ?? "draft").trim().toLowerCase(),
    tags: normalizeTags(input?.tags ?? [])
  };

  validateKnowledgeEntry(entry);
  return Object.freeze(entry);
}

export function validateKnowledgeEntry(entry) {
  const errors = [];

  if (!entry || typeof entry !== "object") {
    throw new TypeError("entry must be an object");
  }

  if (!entry.title) {
    errors.push("title is required");
  }

  if (!entry.body) {
    errors.push("body is required");
  }

  if (!entry.owner) {
    errors.push("owner is required");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.updatedAt ?? "")) {
    errors.push("updatedAt must use YYYY-MM-DD");
  }

  if (!VALID_STATUSES.has(entry.status)) {
    errors.push(`status must be one of: ${[...VALID_STATUSES].join(", ")}`);
  }

  if (!Array.isArray(entry.tags)) {
    errors.push("tags must be an array");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return true;
}
