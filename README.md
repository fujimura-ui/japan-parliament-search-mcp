# Japan Parliament Search MCP — 国会会議録検索

**Give your AI agent access to every word spoken in Japan's National Diet since 1947.**

This MCP server searches the official National Diet Library record system — ministerial statements, committee Q&A, and policy debates — the primary source for understanding Japanese government policy. Built for policy research, journalism, government-affairs, and compliance AI agents.

## Why this server?

Japanese policy signals appear in Diet debates months before they become law or regulation. This data is public but effectively invisible to AI agents: Japanese-only, verbose, and buried in a legacy search interface. This server makes it queryable in one tool call.

## Tools

### `search_speeches`
Full-text search across all Diet speeches (1947–present). Filter by speaker, house (衆議院/参議院), meeting name, and date range. Returns speaker, position, party, date, an excerpt (or full text with `full_text=true`), and an official citation URL.

### `search_meetings`
Find which plenary sessions and committees discussed a topic, and when — the bird's-eye view before drilling into individual speeches.

## Example queries your agent can now answer

- 「生成AIについて文部科学大臣は国会でどう答弁している？直近のものを引用して」
- "When did the Diet last debate semiconductor subsidies, and in which committee?"
- 「インボイス制度に関する財務省side答弁を2026年に絞って要約して」

## Data source & freshness

Official National Diet Library (国立国会図書館) Kokkai Kaigiroku API, fetched live on every call. Records go back to 1947 and include the most recent published sessions.

## Pricing

Pay per tool call. One speech search or one meeting search = one event. No subscription, no minimum.

---

### 日本語

国会会議録（1947年〜最新）の答弁・質疑をAIエージェントから全文検索できるMCPサーバーです。発言者・院・委員会・期間での絞り込み、出典URL付き。政策調査・報道・渉外・コンプライアンス系AIに最適です。

## Get started

This is a hosted (remote) MCP server, available on Apify Store:

👉 **https://apify.com/e-asakura/japan-parliament-search-mcp**

The store page includes setup instructions for Claude, ChatGPT, Cursor, and any MCP-compatible client. Pay-as-you-go: $0.02 per tool call, no subscription.

---
*Built by [Edward Asakura](https://apify.com/e-asakura) — Japanese data infrastructure for AI agents. Part of the SEKISHO series: [subsidies](https://apify.com/e-asakura/japan-subsidy-search-mcp) / [laws](https://apify.com/e-asakura/japan-law-search-mcp) / [parliament](https://apify.com/e-asakura/japan-parliament-search-mcp).*
