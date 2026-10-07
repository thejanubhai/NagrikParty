import type { APIRoute } from "astro";
import { createClient } from '@/lib/supabase';
import { resolveRuntimeEnv, envOf as pickEnv } from "@/lib/worker-env";

export const prerender = false;

const CRIME_FEEDS: Array<{ crime_type: string; feedUrl: string }> = [
  { crime_type: "Rape", feedUrl: "https://news.google.com/rss/search?q=Delhi%20rape%20case%20when%3A7d&hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { crime_type: "Murder", feedUrl: "https://news.google.com/rss/search?q=Delhi%20murder%20case%20when%3A7d&hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { crime_type: "Kidnapping", feedUrl: "https://news.google.com/rss/search?q=Delhi%20kidnapping%20case%20when%3A7d&hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { crime_type: "Robbery", feedUrl: "https://news.google.com/rss/search?q=Delhi%20robbery%20case%20when%3A7d&hl=en-IN&gl=IN&ceid=IN%3Aen" },
  { crime_type: "Extortion", feedUrl: "https://news.google.com/rss/search?q=Delhi%20extortion%20case%20when%3A7d&hl=en-IN&gl=IN&ceid=IN%3Aen" },
];

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
}

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function tagValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

// Dependency-free RSS/Atom parsing: avoids CJS parser libs that break on Workers.
function parseFeedItems(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];
  for (const block of blocks) {
    const title = tagValue(block, "title");
    let link = tagValue(block, "link");
    if (!link) {
      const href = block.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? href[1] : "";
    }
    const pubDate = tagValue(block, "pubDate") || tagValue(block, "published") || tagValue(block, "updated");
    if (link) items.push({ title, link, pubDate });
  }
  return items;
}

function stableId(text: string): string {
  // Deterministic 32-hex hash (no node:crypto dependency in edge runtime)
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

export const POST: APIRoute = async ({ request }) => {
  const runtimeEnv = await resolveRuntimeEnv();
  const envOf = (k: string) => pickEnv(runtimeEnv, k);

  const secret = request.headers.get("x-cron-secret") || new URL(request.url).searchParams.get("secret");
  const expected = envOf("CRON_SECRET");
  if (!expected || secret !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabaseUrl = envOf("PUBLIC_SUPABASE_URL");
  const serviceKey = envOf("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Supabase service credentials not configured" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Mode 1: pre-parsed items from the scheduled fetcher (GitHub Actions).
  // Mode 2 (fallback): fetch feeds server-side when the caller sends no body.
  let payloadItems: Array<{ crime_type: string; title: string; source_url: string; incident_date: string }> = [];
  let serverFetch = true;

  try {
    const raw = await request.text();
    if (raw) {
      const body = JSON.parse(raw);
      if (Array.isArray(body?.items) && body.items.length > 0) {
        payloadItems = body.items;
        serverFetch = false;
      }
    }
  } catch {
    // empty or invalid body → fall back to server-side fetching
  }

  if (serverFetch) {
    for (const { crime_type, feedUrl } of CRIME_FEEDS) {
      try {
        const res = await fetch(feedUrl, { headers: { "User-Agent": "NagrikPartyCivicBot/1.0" } });
        if (!res.ok) {
          errors.push(`${crime_type}: feed responded ${res.status}`);
          continue;
        }
        const xml = await res.text();
        for (const item of parseFeedItems(xml)) {
          const sourceUrl = item.link.trim();
          // Title fallback chain: kabhi blank save mat karo
          const title = item.title.trim() || `Verified ${crime_type} incident, Delhi NCR`;
          const parsed = item.pubDate ? new Date(item.pubDate) : new Date();
          if (!sourceUrl) {
            skipped++;
            continue;
          }
          payloadItems.push({
            crime_type,
            title,
            source_url: sourceUrl,
            incident_date: isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
          });
        }
      } catch (e) {
        errors.push(`${crime_type}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // Deduplicate by source_url (both modes can produce overlapping items)
  const seen = new Set<string>();
  const uniqueItems = payloadItems.filter((it) => {
    const key = it.source_url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const item of uniqueItems) {
    const sourceUrl = item.source_url.trim();
    if (!sourceUrl) {
      skipped++;
      continue;
    }
    // Title fallback chain: kabhi blank save mat karo
    const title = (item.title || "").trim() || `Verified ${item.crime_type} incident, Delhi NCR`;
    const parsed = item.incident_date ? new Date(item.incident_date) : new Date();
    const { error } = await supabase.from("crimes").upsert(
      {
        id: stableId(sourceUrl),
        crime_type: item.crime_type,
        title,
        source_url: sourceUrl,
        incident_date: isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) {
      errors.push(`${item.crime_type}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  await supabase.from("data_runs").insert({
    run_type: "CRIME_RSS_SYNC",
    status: errors.length > 0 && inserted === 0 ? "FAILED" : "COMPLETED",
    completed_at: new Date().toISOString(),
    items_processed: inserted + skipped,
    items_matched: inserted,
    triggered_by: "CRON",
    log_summary: `Crime RSS daily sync: ${inserted} upserted, ${skipped} skipped. ${errors.length} errors.`,
  });

  return new Response(JSON.stringify({ success: true, inserted, skipped, errors }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// Manual trigger via GET allowed only with same secret (admin/cron debugging)
export const GET: APIRoute = async (ctx) => POST(ctx);