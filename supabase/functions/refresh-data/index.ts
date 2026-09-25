/**
 * Refreshes the site's published figures and upcoming events from their
 * sources, on a schedule (pg_cron, twice a day; see the schedule migration).
 *
 * One job per call - wb, bls, governors, elections, bea - so a slow or
 * failing source cannot hold up the others. The call is answered at once
 * (202) and the job runs in the background; each run is recorded in
 * data_refresh_runs with its outcome.
 *
 * Who may call it: whoever holds the token the cron job sends. It is random,
 * generated inside the database and kept in Vault, and checked here through
 * data_refresh_token_ok, which only the service role may execute. verify_jwt
 * is off because the scheduler has no user JWT; auth "none" here means this
 * handler does that check itself.
 *
 * A job that fails writes nothing: the site keeps what it was built with, or
 * the last good refresh, and the next run tries again.
 *
 * Deploy:  npx supabase functions deploy refresh-data --no-verify-jwt
 */
import { withSupabase } from "npm:@supabase/server@^1";
import {
  beaStateReleases,
  blsUnemployment,
  governors,
  stateElections,
  worldBank,
  type EventRow,
  type FigureRow,
} from "./sources.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

type Admin = {
  from: (t: string) => any;
  rpc: (fn: string, args: Record<string, unknown>) => any;
};

const JOBS: Record<string, { figures?: () => Promise<FigureRow[]>; events?: () => Promise<EventRow[]>; source?: string }> = {
  wb: { figures: worldBank },
  bls: { figures: blsUnemployment },
  governors: { figures: governors },
  elections: { events: stateElections, source: "wikidata" },
  bea: { events: beaStateReleases, source: "bea" },
};

/** A job still running from under ten minutes ago is not started again. */
const OVERLAP_MS = 10 * 60 * 1000;
const CHUNK = 500;

async function runJob(admin: Admin, job: string): Promise<void> {
  const spec = JOBS[job];
  const since = new Date(Date.now() - OVERLAP_MS).toISOString();
  const { data: busy } = await admin
    .from("data_refresh_runs")
    .select("id")
    .eq("job", job)
    .eq("status", "running")
    .gte("started_at", since)
    .limit(1);
  if (busy?.length) return;

  const { data: run, error: runError } = await admin
    .from("data_refresh_runs")
    .insert({ job })
    .select("id, started_at")
    .single();
  if (runError || !run) {
    console.error(`${job}: could not record the run:`, runError?.message);
    return;
  }

  const finish = (status: "ok" | "failed", rows: number, message: string) =>
    admin
      .from("data_refresh_runs")
      .update({ status, rows_written: rows, message: message.slice(0, 500), finished_at: new Date().toISOString() })
      .eq("id", run.id);

  try {
    let written = 0;
    if (spec.figures) {
      const rows = await spec.figures();
      const now = new Date().toISOString();
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map((r) => ({ ...r, fetched_at: now }));
        const { error } = await admin.from("live_figures").upsert(chunk, { onConflict: "source,series,area" });
        if (error) throw new Error(`live_figures: ${error.message}`);
        written += chunk.length;
      }
    }
    if (spec.events) {
      const rows = await spec.events();
      const now = new Date().toISOString();
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map((r) => ({ ...r, fetched_at: now }));
        const { error } = await admin.from("upcoming_events").upsert(chunk, { onConflict: "id" });
        if (error) throw new Error(`upcoming_events: ${error.message}`);
        written += chunk.length;
      }
      /* The calendar as it now stands: an event this fetch no longer lists
         (moved, cancelled, or removed from the source) goes, and so does
         anything already past. Only after a successful fetch. */
      const { error: pruneError } = await admin
        .from("upcoming_events")
        .delete()
        .eq("source", spec.source)
        .lt("fetched_at", now);
      if (pruneError) throw new Error(`upcoming_events prune: ${pruneError.message}`);
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      await admin.from("upcoming_events").delete().lt("event_date", yesterday);
    }
    await finish("ok", written, `${written} rows`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`${job}:`, message);
    await finish("failed", 0, message);
  }
}

export default {
  fetch: withSupabase({ auth: "none" }, async (req, ctx) => {
    if (req.method !== "POST") return Response.json({ error: "Use POST." }, { status: 405 });

    const token = req.headers.get("x-refresh-token") ?? "";
    if (!/^[0-9a-f]{64}$/.test(token)) return Response.json({ error: "Not authorised." }, { status: 401 });
    const admin = ctx.supabaseAdmin as unknown as Admin;
    const { data: ok, error } = await admin.rpc("data_refresh_token_ok", { token });
    if (error || ok !== true) return Response.json({ error: "Not authorised." }, { status: 401 });

    const job = new URL(req.url).searchParams.get("job") ?? "";
    if (!(job in JOBS)) return Response.json({ error: `Unknown job. One of: ${Object.keys(JOBS).join(", ")}.` }, { status: 400 });

    EdgeRuntime.waitUntil(runJob(admin, job));
    return Response.json({ started: job }, { status: 202 });
  }),
};
