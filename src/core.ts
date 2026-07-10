/**
 * kokkai-mcp コアロジック
 * データソース: 国立国会図書館 国会会議録検索システムAPI（認証不要・無料）
 *   https://kokkai.ndl.go.jp/api.html
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const API_BASE = "https://kokkai.ndl.go.jp/api";

export const SERVER_INFO = { name: "kokkai-mcp", version: "0.1.0" };

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`国会会議録APIエラー: HTTP ${res.status}（URL: ${url}）`);
  }
  return res.json();
}

function buildParams(base: Record<string, string | number | undefined>): URLSearchParams {
  const params = new URLSearchParams({ recordPacking: "json" });
  for (const [k, v] of Object.entries(base)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  return params;
}

function cleanSpeech(s: string | null | undefined): string {
  return (s ?? "").replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * @param onToolCall 課金など、ツール実行前に呼ぶフック（Apify版で使用。省略可）
 */
export function registerTools(
  server: McpServer,
  onToolCall?: (toolName: string) => Promise<void>
): void {
  server.registerTool(
    "search_speeches",
    {
      title: "国会答弁・発言を検索",
      description:
        "日本の国会会議録（1947年〜最新）から発言を全文検索する。大臣答弁・質疑・政府見解の一次資料を、" +
        "発言者・院・会議名・期間で絞り込める。政策調査・報道・ロビイング・コンプライアンス確認に有用。" +
        "デフォルトは発言の冒頭抜粋を返す。full_text=trueで発言全文を取得（長い場合がある）。",
      inputSchema: {
        query: z.string().min(1).describe("検索語（例: 生成AI / インボイス / 防衛費）"),
        speaker: z.string().optional().describe("発言者名で絞り込み（例: 岸田文雄）"),
        house: z.enum(["衆議院", "参議院"]).optional().describe("院で絞り込み"),
        meeting: z.string().optional().describe("会議名で絞り込み（例: 予算委員会）"),
        from: z.string().optional().describe("開始日 YYYY-MM-DD"),
        until: z.string().optional().describe("終了日 YYYY-MM-DD"),
        max_results: z.number().int().min(1).max(10).default(5).describe("最大件数（1〜10）"),
        full_text: z.boolean().default(false).describe("trueで発言全文を返す（既定は400字抜粋）"),
      },
    },
    async ({ query, speaker, house, meeting, from, until, max_results, full_text }) => {
      await onToolCall?.("search_speeches");
      const params = buildParams({
        any: query,
        speaker,
        nameOfHouse: house,
        nameOfMeeting: meeting,
        from,
        until,
        maximumRecords: max_results,
      });
      const json = await fetchJson(`${API_BASE}/speech?${params}`);
      const records = (json.speechRecord ?? []).map((r: any) => {
        const speech = cleanSpeech(r.speech);
        return {
          speech_id: r.speechID,
          date: r.date,
          house: r.nameOfHouse,
          meeting: `${r.nameOfMeeting} ${r.issue ?? ""}`.trim(),
          speaker: r.speaker,
          speaker_position: r.speakerPosition ?? null,
          speaker_party: r.speakerGroup ?? null,
          speech: full_text ? speech.slice(0, 15000) : speech.slice(0, 400) + (speech.length > 400 ? "…" : ""),
          source_url: r.speechURL,
        };
      });
      const payload = {
        query: { query, speaker: speaker ?? null, house: house ?? null, meeting: meeting ?? null, from: from ?? null, until: until ?? null },
        total_found: json.numberOfRecords ?? 0,
        returned: records.length,
        results: records,
        hint:
          records.length === 0
            ? "ヒットなし。検索語を短くするか、期間・発言者の条件を外して再検索してください。"
            : full_text
              ? "source_urlは国会会議録の公式ページです。引用時の出典として利用できます。"
              : "全文が必要な場合は full_text=true で再検索してください。",
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    }
  );

  server.registerTool(
    "search_meetings",
    {
      title: "国会の会議（委員会・本会議）を検索",
      description:
        "キーワードを含む国会の会議（本会議・委員会）単位で検索する。どの委員会でいつ議論されたかの全体像を掴むのに使う。" +
        "個別の発言内容はsearch_speechesで取得する。",
      inputSchema: {
        query: z.string().min(1).describe("検索語（例: 生成AI / 補助金）"),
        house: z.enum(["衆議院", "参議院"]).optional().describe("院で絞り込み"),
        from: z.string().optional().describe("開始日 YYYY-MM-DD"),
        until: z.string().optional().describe("終了日 YYYY-MM-DD"),
        max_results: z.number().int().min(1).max(10).default(5).describe("最大件数（1〜10）"),
      },
    },
    async ({ query, house, from, until, max_results }) => {
      await onToolCall?.("search_meetings");
      const params = buildParams({
        any: query,
        nameOfHouse: house,
        from,
        until,
        maximumRecords: max_results,
      });
      const json = await fetchJson(`${API_BASE}/meeting_list?${params}`);
      const records = (json.meetingRecord ?? []).map((r: any) => ({
        issue_id: r.issueID,
        date: r.date,
        house: r.nameOfHouse,
        meeting: `${r.nameOfMeeting} ${r.issue ?? ""}`.trim(),
        session: r.session,
        speech_count: (r.speechRecord ?? []).length,
        source_url: `https://kokkai.ndl.go.jp/txt/${r.issueID}`,
      }));
      const payload = {
        query: { query, house: house ?? null, from: from ?? null, until: until ?? null },
        total_found: json.numberOfRecords ?? 0,
        returned: records.length,
        results: records,
        hint:
          records.length === 0
            ? "ヒットなし。検索語を短くするか期間条件を外してください。"
            : "特定の会議の発言内容は、search_speechesにmeeting（会議名）とfrom/until（日付）を渡して取得できます。",
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    }
  );
}
