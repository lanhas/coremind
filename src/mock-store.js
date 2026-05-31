import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createKnowledgeEntry } from "./knowledge-entry.js";

export async function loadMockStore(rootDir = process.cwd()) {
  const raw = await readFile(join(rootDir, "mock-data", "hfkb-mock-data.json"), "utf8");
  const data = JSON.parse(raw);

  return {
    rag: data.rag.map((entry) => ({
      ...createKnowledgeEntry(entry),
      id: entry.id,
      source: entry.source
    })),
    external: data.external,
    users: data.users
  };
}

export function filterAccessibleExternal(externalItems, userId) {
  return externalItems.filter((item) => item.allowedUsers?.includes(userId));
}
