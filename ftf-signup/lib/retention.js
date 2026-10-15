// Retention: personal data is deleted after RETENTION_MONTHS; the per-month
// counts are rolled into period_stats first so reporting survives the delete.
//
// Pages Functions have no cron trigger, so this runs opportunistically from
// /api/signup and /api/export, guarded by a 'last_purge' row so it does real
// work at most once a day. Both callers invoke it through waitUntil — a purge
// failure must never affect a family signing up or the board pulling a CSV.

import { currentDay, currentPeriod, shiftPeriod } from "./period.js";

export const RETENTION_MONTHS = 12;

export async function purgeExpired(env, { now = new Date() } = {}) {
  const today = currentDay(now);

  const last = await env.DB.prepare(
    "SELECT value FROM meta WHERE key = 'last_purge'"
  ).first();
  if (last && last.value === today) return { ran: false, reason: "already-today" };

  // Keep the current month plus the previous RETENTION_MONTHS - 1. With
  // RETENTION_MONTHS = 12 and today in 2026-09, everything before 2025-10 goes.
  const cutoff = shiftPeriod(currentPeriod(now), -(RETENTION_MONTHS - 1));

  await env.DB.batch([
    // Roll the counts up before deleting the rows they came from. The SELECT's
    // WHERE clause is also what keeps SQLite from reading ON CONFLICT as a join.
    env.DB.prepare(
      `INSERT INTO period_stats (period, signups, families)
         SELECT period, COUNT(*), COALESCE(SUM(families), 0)
           FROM signups
          WHERE period < ?
       GROUP BY period
       ON CONFLICT(period) DO NOTHING`
    ).bind(cutoff),

    env.DB.prepare("DELETE FROM signups WHERE period < ?").bind(cutoff),

    env.DB.prepare(
      `INSERT INTO meta (key, value) VALUES ('last_purge', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).bind(today),
  ]);

  return { ran: true, cutoff };
}

// Fire-and-forget wrapper for waitUntil. Swallows everything.
export function purgeInBackground(context) {
  try {
    context.waitUntil(
      purgeExpired(context.env).catch((err) => {
        console.error("retention purge failed", err);
      })
    );
  } catch (err) {
    console.error("retention purge could not be scheduled", err);
  }
}
