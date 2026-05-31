# CoreMind User Guide

CoreMind is a prototype workspace for trusted internal knowledge Q&A, source tracing, and knowledge operations.

## Main Navigation

### Chat
Use this page for daily Q&A. Ask a question in the composer, review the answer, and check citations in the right-side source drawer.

The `+` button beside the composer lets you:
- choose answer scope: Auto, RAG only, Current context only, or RAG + current context
- add context by summarizing a link
- search external sources

### Knowledge
Use this page to manage curated internal knowledge. It shows RAG document coverage, accessible source counts, knowledge collections, and content-quality settings such as citation requirements and stale-knowledge warnings.

### Data Sources
Use this page to manage external systems. It shows connected source status for Confluence, GitHub, and JIRA, plus a search preview for checking what the current user can access.

### Ingestion
Use this page to review the knowledge ingestion pipeline. It represents parsing, chunking, embedding, indexing, and link summarization before content enters the knowledge base.

### Governance
Use this page for permissions, audit, and controlled update previews. It demonstrates read/write checks, hidden private sources, and a Confluence diff preview that requires maintainer permission.

## Suggested Demo Flow

1. Open `Chat` and ask: `What should I check for the payment configuration canary?`
2. Show the answer and citations in `Sources`.
3. Click `+`, choose an answer scope, or jump to source search.
4. Open `Data Sources` and search `payment rollout`.
5. Add a result to chat context.
6. Open `Ingestion` and summarize a sample link.
7. Open `Governance`, generate a Confluence preview as Alice, then switch to Bob to show permission blocking.
