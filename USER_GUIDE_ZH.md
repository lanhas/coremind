# CoreMind 中文用户使用说明

CoreMind 是一个企业内部知识问答与知识运营原型，用来演示“统一问答入口、RAG 优先、外部实时检索、来源追溯、权限控制、链接总结、知识入库、受控更新和审计治理”等核心能力。

## 1. 页面总览

| 页面 | 主要用途 | 适合讲解的能力 |
| --- | --- | --- |
| Chat | 日常 AI 问答入口 | 自然语言问答、回答范围控制、多轮会话、来源引用、检索状态 |
| Knowledge | 自建知识库管理 | RAG 知识覆盖、知识集合、引用要求、过期知识提示 |
| Data Sources | 外部数据源管理 | Confluence/GitHub/JIRA 接入、权限搜索、外部结果选择 |
| Ingestion | 知识入库流程 | 解析、分块、Embedding、索引、链接总结 |
| Governance | 权限与审计治理 | 权限拦截、Confluence 更新预览、审计记录 |

## 2. Chat：统一问答入口

### 功能定位
Chat 是普通用户最常用的入口。用户像使用 ChatGPT 或 Claude 一样输入业务问题，CoreMind 返回结构化答案，并展示答案依据和来源。

### 用户怎么用
1. 打开 `Chat`。
2. 在底部输入框输入问题，例如：`What should I check for the payment configuration canary?`
3. 点击 `Send`。
4. 查看回答中的 `Answer`、`Evidence`、`Next step`。
5. 查看右侧 `Sources`，确认答案引用了哪些 RAG、Confluence、GitHub、JIRA 来源。
6. 切换右侧 `Activity`，查看检索过程，例如 RAG 检索、外部检索、权限过滤。

### 讲解重点
- 这是统一问答入口，用户不需要分别打开 Confluence、GitHub、JIRA。
- 系统默认先查内部 RAG 知识库。
- 如果问题涉及最新状态、JIRA、GitHub、页面或发布信息，系统会按权限补充外部来源。
- 回答不是纯模型生成，而是带引用、带检索轨迹、带权限控制的可信回答。

## 3. `+` 菜单：回答范围与上下文控制

### 功能定位
`+` 菜单把高级控制收起来，避免 Chat 页面像后台配置页一样复杂。

### 用户怎么用
1. 在 Chat 输入框左侧点击 `+`。
2. 在 `Answer scope` 中选择回答范围：
   - `Auto`：默认模式，RAG 优先，必要时检索外部来源。
   - `RAG only`：只使用内部知识库，不读取外部平台。
   - `Current context only`：只基于当前选中的外部页面或搜索结果回答。
   - `RAG + current context`：同时使用当前外部内容和内部 RAG 知识。
3. 在 `Add context` 中选择：
   - `Summarize a link`：跳转到链接总结。
   - `Search sources`：跳转到外部来源搜索。

### 讲解重点
- 回答范围是用户可控的，不是系统黑盒决定。
- 当用户只想看稳定知识时选 `RAG only`。
- 当用户只想追问某个页面、PR、Issue 时选 `Current context only`。
- 当用户想把外部页面和组内背景结合分析时选 `RAG + current context`。

## 4. Sources：来源标注与可追溯回答

### 功能定位
右侧 `Sources` 展示每个答案引用的来源，解决“答案从哪里来”的问题。

### 用户怎么用
1. 在 Chat 提问并等待回答。
2. 查看右侧 `Sources`。
3. 每个来源会展示：
   - 来源类型：RAG、Confluence、GitHub、JIRA
   - 标题
   - 更新时间
   - Owner 或负责人
   - 引用片段
   - 原始链接

### 讲解重点
- 来源可追溯是本系统和普通聊天机器人最大的区别。
- 用户可以点击原始链接回到 Confluence、GitHub 或 JIRA。
- 如果没有可靠来源，系统应拒答或提示不确定，而不是编造答案。

## 5. Activity：检索状态与决策过程

### 功能定位
`Activity` 展示系统如何得出答案，帮助用户理解 RAG 和外部检索是否被触发。

### 用户怎么用
1. 在 Chat 提问。
2. 点击右侧 `Activity`。
3. 查看检索步骤：
   - `RAG search`
   - `External search`
   - `External context`
   - `Permission filter`

### 讲解重点
- 系统不是直接把问题丢给模型，而是先检索、再过滤、再生成。
- 当 RAG 命中不足时，会触发外部实时检索。
- 所有外部内容进入答案前都会经过权限过滤。

## 6. Recent chats：历史会话

### 功能定位
左侧 `Recent chats` 用于保存和继续历史问答。

### 用户怎么用
1. 提问后，系统自动在左侧生成一条会话记录。
2. 点击历史会话，可以回看之前的问题和回答。
3. 在历史上下文基础上继续追问。

### 讲解重点
- 会话历史包含问题、回答、引用来源和检索策略。
- 用户刷新页面后仍能看到已有会话。
- 后续真实系统中，历史引用再次打开时需要重新校验权限。

## 7. Knowledge：自建 RAG 知识库管理

### 功能定位
Knowledge 页面用于讲解内部知识库如何被管理，以及哪些知识会进入 RAG。

### 用户怎么用
1. 打开 `Knowledge`。
2. 查看顶部指标：
   - RAG documents
   - Accessible sources
   - Confluence pages
   - GitHub / JIRA
3. 查看知识集合，例如 Payment Platform、VPN Support、Confluence Update Policy。
4. 查看右侧 `Content tuning`：
   - Require citation before answer
   - Warn on stale knowledge
   - Allow maintainer draft edits

### 讲解重点
- RAG 知识库是系统优先回答的基础。
- 入库文档需要保留标题、负责人、更新时间、可见范围等元数据。
- 过期知识仍可引用时，需要提示时效风险。
- 可以通过配置要求答案必须带引用，降低幻觉风险。

## 8. Data Sources：外部平台搜索与结果选择

### 功能定位
Data Sources 页面用于管理和搜索外部系统，包括 Confluence、GitHub、JIRA。

### 用户怎么用
1. 打开 `Data Sources`。
2. 查看已接入来源：
   - Confluence
   - GitHub
   - JIRA
3. 在 `Search preview` 输入关键词，例如 `payment rollout`。
4. 选择平台范围：All、Confluence、GitHub、JIRA。
5. 点击 `Search`。
6. 查看搜索结果中的标题、摘要片段、Owner、更新时间、链接和相关度。
7. 点击 `Add to chat`，将结果加入当前 Chat 上下文。
8. 点击 `Summarize`，对该结果做摘要。

### 讲解重点
- 用户不知道具体链接时，可以先按平台搜索。
- 搜索结果必须按当前用户权限过滤。
- 无权限结果不会展示，也不会进入模型上下文。
- 用户选择结果后，可以回到 Chat 继续围绕该结果提问。

## 9. Ingestion：知识入库与链接总结

### 功能定位
Ingestion 页面用于讲解内容如何进入知识库，以及链接如何被实时读取和总结。

### 用户怎么用
1. 打开 `Ingestion`。
2. 查看入库流程：
   - Parse：解析文档
   - Chunk：分块
   - Embed：向量化
   - Index：索引
3. 在 `Link summary` 中粘贴 Confluence、GitHub 或 JIRA 链接。
4. 点击 `Summarize`。
5. 查看页面摘要、关键点、风险提示和处理状态。

### 讲解重点
- 入库不是简单存文件，而是要解析、清洗、分块、向量化和索引。
- 链接总结前必须识别来源类型并校验权限。
- 长页面需要分段读取和摘要，避免遗漏关键信息。
- 链接总结后的结果可以作为当前 Chat 上下文。

## 10. Governance：权限、审计与受控更新

### 功能定位
Governance 页面用于讲解企业场景最关键的安全能力：不能越权、不能静默写入、必须可审计。

### 用户怎么用
1. 打开 `Governance`。
2. 查看 `Access and audit` 中的审计事件：
   - Read allowed
   - Write blocked
   - Source hidden
   - Answer guarded
3. 在右侧 `Confluence update preview` 输入更新指令。
4. 使用 Alice 生成预览，可以看到权限校验、版本校验、差异预览和提交保护。
5. 切换到 Bob 再生成预览，会看到编辑权限不足被拦截。

### 讲解重点
- AI 不能直接改 Confluence。
- 必须先校验用户是否有编辑权限。
- 必须生成草稿和 diff，让用户确认。
- 必须记录审计信息。
- 无权限用户不能看到、不能引用、不能修改受限内容。

## 11. 权限控制演示

### 演示方式
1. 左侧 `Workspace user` 选择 Alice。
2. 在 Data Sources 搜索 `payment rollout`，展示可访问结果。
3. 到 Governance 生成 Confluence 更新预览，展示 Alice 有维护者权限。
4. 切换用户为 Bob。
5. 再次搜索或生成更新预览，展示部分结果被隐藏，更新预览被拦截。

### 讲解重点
- 权限控制贯穿搜索、摘要、回答、引用和更新。
- 用户看不到的内容不会进入模型上下文。
- 历史引用在真实系统中也需要重新校验权限。

## 12. 异常与拒答能力

### 原型中体现的场景
- 无权限来源会被隐藏。
- 无编辑权限会阻止 Confluence 更新。
- 无可靠来源时，系统应提示无法给出确定性答案。
- 不支持或不存在的链接会给出明确错误说明。

### 讲解重点
- 企业知识问答系统不能只演示成功路径。
- 更重要的是失败时不越权、不编造、不静默写入。

## 13. 推荐完整录屏讲解顺序

1. 先介绍 CoreMind：企业内部可信知识问答与知识运营系统。
2. 进入 `Chat`，提问 `What should I check for the payment configuration canary?`
3. 讲解回答结构：Answer、Evidence、Next step。
4. 展示右侧 `Sources`，说明来源追溯。
5. 切换 `Activity`，说明 RAG 优先、外部补充、权限过滤。
6. 点击输入框 `+`，讲解 4 种回答范围。
7. 进入 `Data Sources`，搜索 `payment rollout`，加入一个结果到 Chat。
8. 进入 `Ingestion`，用示例链接做总结，讲解链接识别、权限校验、分段摘要。
9. 进入 `Knowledge`，讲解 RAG 文档、知识集合、引用要求和过期知识提示。
10. 进入 `Governance`，用 Alice 生成 Confluence diff 预览。
11. 切换 Bob，展示无权限拦截。
12. 收尾强调：CoreMind 解决“找得到、答得准、看得见来源、不能越权”。

## 14. 当前原型与正式系统的关系

当前原型主要用于演示产品能力和交互链路：

- mock 了 RAG、Confluence、GitHub、JIRA 数据。
- mock 了权限校验和审计事件。
- mock 了 Confluence 更新差异预览。
- 尚未连接真实企业认证、真实外部 API、真实向量库和真实写入流程。

正式系统落地时，需要接入：

- 企业统一身份认证。
- Confluence/GitHub/JIRA 用户授权。
- RAGFlow 或等价 RAG 服务。
- 向量索引与文档入库任务。
- 审计日志与权限策略存储。
