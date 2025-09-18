// deno-lint-ignore-file no-explicit-any
// Deno KV API with per-location GET token, and snapshot storage for GM + events.
// /playground script - ikke flere filer. Kun man kan redigere på nettsidene til deno.com playground
// Run locally: deno run -A main.ts
// Deploy: upload to Deno Deploy.
export {}; // Make this a module for TypeScript
//
// Endpoints
//   POST   /items               -> accepts single object or array
//       Payload fields:
//         mode?: "gm" | "event" | (default append "item")
//         name: string          // script/app name (@name)
//         location: string      // unique location bucket (e.g., hostname or city)
//         datetime?: string ISO
//         event?: string        // required when mode === "event"
//         data: any             // for gm -> full GM_info, event/log payload, etc.
//       Behavior:
//         - mode=gm:   set key ["gm", locationLower, nameLower] (OVERWRITE snapshot; no duplicates)
//         - mode=event:set key ["event", locationLower, eventLower] (OVERWRITE latest per event)
//         - default:   append as ["item", uuid] (historical; you can skip using it if you want snapshots only)
//       Returns: for any item with location: a locationToken (created-if-missing) in response when single payload
//
//   GET    /items               -> list items (requires token; must include ?location=...)
//            ?location=...&name=...&from=ISO&to=ISO&today=true&tz=Europe/Oslo&token=... (or header x-location-token)
//   DELETE /items               -> delete ALL appended items (snapshot keys unaffected)
//
//   GET    /gm                  -> get GM snapshot(s) for a location (requires token)
//            ?location=...&name=...&token=...
//            - with &name       -> single snapshot
//            - without &name    -> list all GM snapshots under location
//
//   GET    /events              -> list latest events for a location (requires token)
//            ?location=...&token=... [&prefix=console]  // optional prefix filter for event name
//
//   GET    /logs                -> get logs by session token OR location token
//            ?token=SESSION_TOKEN  // get logs for specific session (from tracer.js)
//            ?location=...&token=LOCATION_TOKEN  // get all logs for location
//
//   GET    /items/:id           -> get appended item by id (no token)
//   DELETE /items/:id           -> delete appended item by id (no token)

interface Item {
  id: string;
  name: string;
  location?: string;
  datetime: string; // ISO
  data?: any;
  createdAt: string; // ISO
}

type GMRecord = {
  mode: "gm";
  name: string;
  location: string;
  datetime: string;
  data: any;           // full GM_info inside data.gm
  sessionToken?: string; // from tracer.js
  updatedAt: string;
};

type EventRecord = {
  mode: "event";
  event: string;
  name: string;
  location: string;
  datetime: string;
  data: any;
  sessionToken?: string; // from tracer.js
  updatedAt: string;
};

const kv = await Deno.openKv();

function json(res: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(res, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    },
    ...init,
  });
}

function notFound(msg = "Not found") {
  return json({ error: msg }, { status: 404 });
}

async function readBody<T = any>(req: Request): Promise<T | null> {
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await req.json();
    const text = await req.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    return null;
  }
}

function parseDateISOOrNow(v?: string): string {
  if (!v) return new Date().toISOString();
  const d = new Date(v);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function dayRangeForTimezone(dateLike: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(dateLike).map(p => [p.type, p.value]));
  const y = Number(parts.year), m = Number(parts.month), d = Number(parts.day);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  return { start, end };
}

async function listAllItems(): Promise<Item[]> {
  const out: Item[] = [];
  const iter = kv.list<Item>({ prefix: ["item"] });
  for await (const e of iter) out.push(e.value);
  out.sort((a, b) => b.datetime.localeCompare(a.datetime));
  return out;
}

async function getOrCreateLocationToken(location: string): Promise<string> {
  const key = ["locToken", location.toLowerCase()] as const;
  const existing = await kv.get<string>(key);
  if (existing.value) return existing.value;
  const token = crypto.randomUUID();
  await kv.set(key, token);
  return token;
}

async function getLocationToken(location: string): Promise<string | null> {
  const key = ["locToken", location.toLowerCase()] as const;
  const existing = await kv.get<string>(key);
  return existing.value ?? null;
}

function filterItems(items: Item[], params: URLSearchParams): Item[] {
  const name = params.get("name")?.toLowerCase() || null;
  const location = params.get("location")?.toLowerCase() || null;
  const fromISO = params.get("from");
  const toISO = params.get("to");
  const todayFlag = params.get("today");
  const tz = params.get("tz") || "Europe/Oslo";

  let from: Date | null = null;
  let to: Date | null = null;

  if (todayFlag === "true" || todayFlag === "1") {
    const { start, end } = dayRangeForTimezone(new Date(), tz);
    from = start; to = end;
  } else {
    if (fromISO) { const d = new Date(fromISO); if (!isNaN(d.getTime())) from = d; }
    if (toISO)   { const d = new Date(toISO);   if (!isNaN(d.getTime())) to = d; }
  }

  return items.filter((it) => {
    if (name && it.name.toLowerCase() !== name) return false;
    if (location && (it.location || "").toLowerCase() !== location) return false;
    if (from && new Date(it.datetime) < from) return false;
    if (to && new Date(it.datetime) > to) return false;
    return true;
  });
}

function ok() { return json({ ok: true }); }

function getProvidedToken(req: Request, params: URLSearchParams): string | null {
  return (
    req.headers.get("x-location-token") ||
    params.get("token") ||
    null
  );
}

async function requireLocationToken(req: Request, params: URLSearchParams): Promise<{ location: string, token: string } | Response> {
  const location = (params.get("location") || "").trim();
  if (!location) {
    return json({ error: "GET requires ?location=... and a valid token (header x-location-token or ?token=...)" }, { status: 400 });
  }
  const provided = getProvidedToken(req, params);
  if (!provided) return json({ error: "Missing token: provide header x-location-token or query ?token=..." }, { status: 401 });
  const expected = await getLocationToken(location);
  if (!expected) return json({ error: `Unknown location '${location}' or no token initialized yet. Create an item with this location using POST first to establish a token.` }, { status: 404 });
  if (provided !== expected) return json({ error: "Invalid token for this location" }, { status: 401 });
  return { location, token: provided };
}

// --- Snapshot setters ---
async function setGMSnapshot(payload: any): Promise<GMRecord> {
  const name = String(payload.name || "").trim();
  const location = String(payload.location || "").trim();
  if (!name || !location) throw new Error("mode=gm requires 'name' and 'location'");
  const nameLower = name.toLowerCase();
  const locationLower = location.toLowerCase();
  const rec: GMRecord = {
    mode: "gm",
    name,
    location,
    datetime: parseDateISOOrNow(payload.datetime),
    data: payload.data, // full GM object is expected in data.gm
    sessionToken: payload.sessionToken, // from tracer.js
    updatedAt: new Date().toISOString(),
  };
  await kv.set(["gm", locationLower, nameLower], rec);
  
  // Also store session token mapping for quick lookup
  if (payload.sessionToken) {
    await kv.set(["sessionToken", payload.sessionToken], {
      location,
      name,
      mode: "gm",
      createdAt: new Date().toISOString()
    });
  }
  
  return rec;
}

async function setEventSnapshot(payload: any): Promise<EventRecord> {
  const name = String(payload.name || "").trim();
  const location = String(payload.location || "").trim();
  const event = String(payload.event || "").trim();
  if (!name || !location || !event) throw new Error("mode=event requires 'name', 'location' and 'event'");
  const eventLower = event.toLowerCase();
  const locationLower = location.toLowerCase();
  const rec: EventRecord = {
    mode: "event",
    event,
    name,
    location,
    datetime: parseDateISOOrNow(payload.datetime),
    data: payload.data,
    sessionToken: payload.sessionToken, // from tracer.js
    updatedAt: new Date().toISOString(),
  };
  await kv.set(["event", locationLower, eventLower], rec);
  
  // Also store session token mapping for quick lookup
  if (payload.sessionToken) {
    await kv.set(["sessionToken", payload.sessionToken], {
      location,
      name,
      mode: "event",
      event,
      createdAt: new Date().toISOString()
    });
  }
  
  return rec;
}

async function appendItem(payload: any): Promise<Item> {
  if (!payload || typeof payload.name !== "string" || !payload.name.trim()) {
    throw new Error("'name' is required and must be a non-empty string");
  }
  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const item: Item = {
    id,
    name: payload.name.trim(),
    location: typeof payload.location === "string" && payload.location.trim() ? payload.location.trim() : undefined,
    datetime: parseDateISOOrNow(payload.datetime),
    data: payload.data,
    createdAt: nowIso,
  };
  await kv.set(["item", id], item);
  return item;
}

async function handlePostSingle(obj: any) {
  // Create or return token if location present
  let locationToken: string | undefined;
  if (obj.location) locationToken = await getOrCreateLocationToken(String(obj.location));

  const mode = String(obj.mode || "").toLowerCase();
  if (mode === "gm") {
    const rec = await setGMSnapshot(obj);
    return { ...rec, locationToken };
  }
  if (mode === "event") {
    const rec = await setEventSnapshot(obj);
    return { ...rec, locationToken };
  }
  // default: append (optional)
  const item = await appendItem(obj);
  return { ...item, locationToken };
}

async function listGMSnapshots(location: string): Promise<GMRecord[]> {
  const out: GMRecord[] = [];
  const iter = kv.list<GMRecord>({ prefix: ["gm", location.toLowerCase()] });
  for await (const e of iter) out.push(e.value);
  return out;
}

async function getGMSnapshot(location: string, name: string): Promise<GMRecord | null> {
  const res = await kv.get<GMRecord>(["gm", location.toLowerCase(), name.toLowerCase()]);
  return res.value ?? null;
}

async function getEventSnapshot(location: string, event: string): Promise<EventRecord | null> {
  const res = await kv.get<EventRecord>(["event", location.toLowerCase(), event.toLowerCase()]);
  return res.value ?? null;
}

async function listEventSnapshots(location: string, prefix?: string): Promise<EventRecord[]> {
  const basePrefix: (string | undefined)[] = ["event", location.toLowerCase()];
  const out: EventRecord[] = [];
  const iter = kv.list<EventRecord>({ prefix: basePrefix as any });
  for await (const e of iter) {
    if (prefix) {
      if (e.value.event.toLowerCase().startsWith(prefix.toLowerCase())) out.push(e.value);
    } else {
      out.push(e.value);
    }
  }
  // newest first
  out.sort((a,b) => b.datetime.localeCompare(a.datetime));
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return ok();

  const url = new URL(req.url);
  const { pathname, searchParams } = url;

  try {
    if (pathname === "/" && req.method === "GET") {
      return json({
        service: "Deno KV API (snapshots for GM & events)",
        note: "POST creates/updates per-location snapshots; GET requires location token.",
        curlExample: "curl -s \"https://leinad-log.deno.dev/items?location=oslo&today=true&tz=Europe/Oslo&token=YOUR_TOKEN\"",
        endpoints: {
          post: { method: "POST", path: "/items", body: "single object OR array; see 'mode'" },
          itemsGet: { method: "GET", path: "/items", query: ["location*", "name", "from", "to", "today", "tz", "token*"] },
          gmGet: { method: "GET", path: "/gm", query: ["location*", "name", "token*"] },
          eventsGet: { method: "GET", path: "/events", query: ["location*", "prefix", "token*"] },
          deleteAllItems: { method: "DELETE", path: "/items" },
          getItemById: { method: "GET", path: "/items/:id" },
          deleteItemById: { method: "DELETE", path: "/items/:id" },
        },
      });
    }

    // POST /items  (single or array)
    if (pathname === "/items" && req.method === "POST") {
      const body = await readBody<any>(req);
      if (!body) return json({ error: "Invalid JSON body" }, { status: 400 });

      if (Array.isArray(body)) {
        const results = [];
        for (const obj of body) {
          try {
            results.push(await handlePostSingle(obj));
          } catch (err) {
            results.push({ error: (err as Error).message });
          }
        }
        return json({ results }, { status: 207 }); // Multi-Status-ish
      } else {
        try {
          const res = await handlePostSingle(body);
          return json(res, { status: 201 });
        } catch (err) {
          return json({ error: (err as Error).message }, { status: 400 });
        }
      }
    }

    // GET /items (requires token + ?location) — still returns appended items (if you use them)
    if (pathname === "/items" && req.method === "GET") {
      const auth = await requireLocationToken(req, searchParams);
      if (auth instanceof Response) return auth;

      const all = await listAllItems();
      const filtered = filterItems(all, searchParams);
      const restricted = filtered.filter(i => (i.location || "").toLowerCase() === auth.location.toLowerCase());
      return json({ count: restricted.length, items: restricted });
    }

    // DELETE /items (append-only store)
    if (pathname === "/items" && req.method === "DELETE") {
      let count = 0;
      const iter = kv.list<Item>({ prefix: ["item"] });
      for await (const e of iter) { await kv.delete(e.key); count++; }
      return json({ deleted: count });
    }

    // GET /gm  (requires token + ?location) ; optional ?name
    if (pathname === "/gm" && req.method === "GET") {
      const auth = await requireLocationToken(req, searchParams);
      if (auth instanceof Response) return auth;

      const loc = auth.location;
      const name = searchParams.get("name")?.trim();

      if (name) {
        const one = await getGMSnapshot(loc, name);
        return one ? json(one) : notFound("GM snapshot not found");
      } else {
        const list = await listGMSnapshots(loc);
        return json({ count: list.length, items: list });
      }
    }

    // GET /events (requires token + ?location) ; optional ?prefix=console
    if (pathname === "/events" && req.method === "GET") {
      const auth = await requireLocationToken(req, searchParams);
      if (auth instanceof Response) return auth;

      const loc = auth.location;
      const prefix = searchParams.get("prefix") || undefined;
      const list = await listEventSnapshots(loc, prefix || undefined);
      return json({ count: list.length, items: list });
    }

    // GET /logs (supports both location token and session token)
    if (pathname === "/logs" && req.method === "GET") {
      const sessionToken = searchParams.get("token");
      
      if (sessionToken) {
        // Session token lookup
        const sessionData = await kv.get(["sessionToken", sessionToken]);
        if (!sessionData.value) {
          return json({ error: "Session token not found" }, { status: 404 });
        }
        
        const { location, name, mode, event } = sessionData.value as any;
        const logs: any[] = [];
        
        // Get GM snapshots for this session
        if (mode === "gm" || !mode) {
          const gmData = await getGMSnapshot(location, name);
          if (gmData && gmData.sessionToken === sessionToken) {
            logs.push(gmData);
          }
        }
        
        // Get event snapshots for this session  
        if (mode === "event" && event) {
          const eventData = await getEventSnapshot(location, event);
          if (eventData && eventData.sessionToken === sessionToken) {
            logs.push(eventData);
          }
        } else if (!mode) {
          // Get all events for location and filter by sessionToken
          const allEvents = await listEventSnapshots(location);
          const sessionEvents = allEvents.filter(e => e.sessionToken === sessionToken);
          logs.push(...sessionEvents);
        }
        
        return json({ 
          sessionToken, 
          location, 
          name, 
          count: logs.length, 
          logs 
        });
      } else {
        // Fallback to location token requirement
        const auth = await requireLocationToken(req, searchParams);
        if (auth instanceof Response) return auth;

        const loc = auth.location;
        const nameFilter = searchParams.get("name") || undefined;
        
        // Combine GM and Event snapshots
        const logs: any[] = [];
        
        if (nameFilter) {
          const gmData = await getGMSnapshot(loc, nameFilter);
          if (gmData) logs.push(gmData);
        } else {
          const gmList = await listGMSnapshots(loc);
          logs.push(...gmList);
        }
        
        const eventList = await listEventSnapshots(loc);
        logs.push(...eventList);
        
        return json({ location: loc, count: logs.length, logs });
      }
    }

    // /items/:id (append store only)
    const m = pathname.match(/^\/items\/(.+)$/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      if (req.method === "DELETE") {
        const okDel = await (async () => {
          const res = await kv.get(["item", id]);
          if (!res.value) return false;
          await kv.delete(["item", id]);
          return true;
        })();
        return okDel ? json({ deleted: id }) : notFound("Item not found");
      }
      if (req.method === "GET") {
        const res = await kv.get<Item>(["item", id]);
        return res.value ? json(res.value) : notFound("Item not found");
      }
    }

    return notFound();
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message || "Internal error" }, { status: 500 });
  }
});
