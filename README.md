# CoreMind Prototype

This is a local demo prototype for the CoreMind AI knowledge QA workflow. It is intentionally mock-backed so it can run without waiting for Docker images, RAGFlow dependencies, or real Confluence/GitHub/JIRA credentials.

## What It Demonstrates

- RAG-first question answering with source citations.
- External platform search across Confluence, GitHub, and JIRA mock data.
- Link summary with permission checks and processing status.
- Answer scope switching: auto, RAG only, external only, RAG plus external.
- Session history for the current user.
- Confluence update preview with edit-permission blocking and audit-friendly diff.

## Run

```bash
cd coremind
npm start
```

Then open:

```text
http://127.0.0.1:4590
```

## Suggested Recording Flow

1. Ask `What should I check for the payment configuration canary?`.
2. Show mixed citations from RAG, Confluence, JIRA, and GitHub.
3. Use link summary with the Confluence sample link.
4. Add an external result to context and switch answer scope to `RAG + current context`.
5. Generate the Confluence update preview as Alice.
6. Switch to Bob and show inaccessible search results hidden plus update preview blocked.

## Tests

```bash
npm test
```
