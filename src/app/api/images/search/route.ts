import { NextResponse } from "next/server";

type DuckImageResult = {
  image?: string;
  thumbnail?: string;
  title?: string;
  url?: string;
  source?: string;
  width?: number;
  height?: number;
};

type CoverResult = {
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  sourceUrl: string;
  source: string;
  width: number | null;
  height: number | null;
};

function getVqdToken(html: string) {
  const quoted = html.match(/vqd=['"]([^'"]+)['"]/i)?.[1];
  if (quoted) return quoted;
  const unquoted = html.match(/vqd=([0-9-]+)/i)?.[1];
  return unquoted ?? "";
}

function compactQuery(query: string) {
  return query.replace(/\s+/g, " ").trim();
}

function queryVariants(query: string) {
  const base = compactQuery(query);
  const stripped = compactQuery(
    base
      .replace(/\b(portada|producto|celulares|notebook|notebooks)\b/gi, "")
      .replace(/[^\w\sáéíóúñü-]/gi, " "),
  );
  return Array.from(new Set([base, stripped].filter((q) => q.length > 0)));
}

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function dedupeResults(results: CoverResult[]) {
  const seen = new Set<string>();
  return results.filter((r) => {
    if (!r.imageUrl || seen.has(r.imageUrl)) return false;
    seen.add(r.imageUrl);
    return true;
  });
}

async function searchDuckDuckGo(query: string, limit: number, ua: string) {
  const searchRes = await fetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    {
      headers: {
        "user-agent": ua,
        accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    },
  );
  if (!searchRes.ok) throw new Error("duck_search_failed");

  const html = await searchRes.text();
  const vqd = getVqdToken(html);
  if (!vqd) throw new Error("duck_token_failed");

  const apiUrl = new URL("https://duckduckgo.com/i.js");
  apiUrl.searchParams.set("l", "ar-es");
  apiUrl.searchParams.set("o", "json");
  apiUrl.searchParams.set("q", query);
  apiUrl.searchParams.set("vqd", vqd);
  apiUrl.searchParams.set("f", ",,,");

  const imagesRes = await fetch(apiUrl, {
    headers: {
      "user-agent": ua,
      referer: "https://duckduckgo.com/",
      accept: "application/json,text/plain,*/*",
      "x-requested-with": "XMLHttpRequest",
    },
    cache: "no-store",
  });
  if (!imagesRes.ok) throw new Error("duck_results_failed");

  const data = (await imagesRes.json()) as { results?: DuckImageResult[] };
  return (data.results ?? [])
    .filter((r) => typeof r.image === "string" && Boolean(r.image))
    .slice(0, limit)
    .map((r) => ({
      imageUrl: r.image ?? "",
      thumbnailUrl: r.thumbnail ?? r.image ?? "",
      title: r.title ?? "",
      sourceUrl: r.url ?? "",
      source: r.source ?? "duckduckgo",
      width: r.width ?? null,
      height: r.height ?? null,
    }));
}

async function searchBing(query: string, limit: number, ua: string) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC3`;
  const res = await fetch(url, {
    headers: {
      "user-agent": ua,
      accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("bing_search_failed");

  const html = decodeHtmlEntities(await res.text());
  const results: CoverResult[] = [];

  const jsonLikeMatches = html.matchAll(/"murl":"([^"]+)".*?"turl":"([^"]+)".*?"t":"([^"]*)"/g);
  for (const m of jsonLikeMatches) {
    results.push({
      imageUrl: m[1],
      thumbnailUrl: m[2] || m[1],
      title: m[3] || "",
      sourceUrl: "",
      source: "bing",
      width: null,
      height: null,
    });
    if (results.length >= limit) break;
  }

  if (results.length === 0) {
    const attrMatches = html.matchAll(/murl":"([^"]+)".*?turl":"([^"]+)"/g);
    for (const m of attrMatches) {
      results.push({
        imageUrl: m[1],
        thumbnailUrl: m[2] || m[1],
        title: "",
        sourceUrl: "",
        source: "bing",
        width: null,
        height: null,
      });
      if (results.length >= limit) break;
    }
  }

  return dedupeResults(results).slice(0, limit);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 8), 1), 20);

  if (!q) {
    return NextResponse.json({ error: "Falta parámetro q" }, { status: 400 });
  }

  const ua =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

  try {
    const queries = queryVariants(q);
    let results: CoverResult[] = [];

    for (const query of queries) {
      try {
        results = await searchDuckDuckGo(query, limit, ua);
      } catch {
        results = [];
      }
      if (results.length > 0) break;
    }

    if (results.length === 0) {
      for (const query of queries) {
        try {
          results = await searchBing(query, limit, ua);
        } catch {
          results = [];
        }
        if (results.length > 0) break;
      }
    }

    return NextResponse.json({ results: dedupeResults(results).slice(0, limit) });
  } catch {
    return NextResponse.json(
      { error: "Error al buscar imágenes de portada" },
      { status: 500 },
    );
  }
}
