# CoreMind Demo Script

Target length: under 2 minutes.

## Script

Today I will introduce **CoreMind**, then show a short demo.

The main problem is that team knowledge is scattered across many places: documents, tickets, code, and decisions. People spend too much time searching, and sometimes the answer is outdated or has no clear source.

The main users are engineers, QA and Ops, product teams, and knowledge owners. Engineers need business context and code details. QA and Ops need runbooks and release information. Product teams need requirements and decisions. Knowledge owners need to manage stale content and audit updates.

CoreMind gives them one trusted AI entry point. The workflow is simple: ask a question, search internal RAG first, add external evidence only when needed, and return an answer with citations. The AI stack uses RAGFlow for parsing, chunking, embedding, indexing, retrieval, and citations, with enterprise-approved LLM and embedding models.

The next support we need is pilot knowledge scope, source system API access, approved model and data boundaries, plus security, audit, and rollout approval.

Now let me show the demo.

First, I open **Chat** and ask: “What should I check for the payment configuration canary?” CoreMind returns a structured answer with the answer, evidence, and next step.

On the right side, **Sources** shows where the answer comes from. This is the key trust layer: the user can trace the answer back to the original source.

Then I open **Activity**. It shows RAG search, external search, and permission filtering. So the system is not just chatting; it is searching, filtering, and then answering.

Next, I click the **plus button** near the input box. Here the user can choose the answer scope, such as Auto, RAG only, current context only, or RAG plus current context.

Then I go to **Data Sources** and search `payment rollout`. The system only shows results this user can access. I can add one result to the chat context or summarize it.

In **Ingestion**, I show how content enters the knowledge base: parse, chunk, embed, and index. I can also summarize a link with permission checks.

In **Knowledge**, I show curated RAG coverage, citation rules, and stale knowledge warnings.

Finally, in **Governance**, I show a controlled Confluence update. Alice can generate a diff preview, but Bob is blocked because he does not have edit permission.

So CoreMind is more than a chatbot. It helps teams find trusted answers, verify sources, control scope, manage knowledge, and avoid permission risks.
