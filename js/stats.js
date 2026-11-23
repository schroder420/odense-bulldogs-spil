import { acceptedRuns } from './archive.js';

export function sumMetric(rows, field) {
  const values = rows.map(row => row[field]).filter(Number.isFinite);
  return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
}

export function ratio(numerator, denominator) {
  return Number.isFinite(numerator) && denominator > 0 ? numerator / denominator : undefined;
}

export function combinedRatio(rows, numerator, denominator) {
  const complete = rows.filter(row => Number.isFinite(row[numerator]) && Number.isFinite(row[denominator]));
  return ratio(sumMetric(complete, numerator), sumMetric(complete, denominator));
}

export function historicalStats(row) {
  const inferred = ratio(row.totalTimeMs, row.accepted);
  const oneFewer = ratio(row.totalTimeMs, row.accepted - 1);
  // Den afrundede gennemsnitstid skal pege entydigt på "accepted" som nævner.
  const matches = Number.isFinite(row.averageTimeMs)
    && Math.abs(inferred - row.averageTimeMs) <= 5.0001
    && !(Math.abs(oneFewer - row.averageTimeMs) <= 5.0001);
  return { ...row, timedRuns: matches ? row.accepted : undefined };
}

export function participantCounts(runs) {
  const counts = new Map();
  for (const run of runs) {
    if (!run.participant_id) continue;
    counts.set(run.participant_id, (counts.get(run.participant_id) ?? 0) + 1);
  }
  return counts;
}

export async function roundStats(api, row) {
  if (row.historical) return historicalStats(row);
  if (!['live', 'final'].includes(row.status)) return row;

  const [runs, prizes] = await Promise.all([
    api.readCollection('runs', row.id), api.readCollection('prizes', row.id)
  ]);
  const stats = { ...row };
  if (runs.length) {
    const counts = participantCounts(runs);
    const accepted = acceptedRuns(runs);
    const activity = {};
    for (const run of runs) {
      const date = run.started_at?.toDate();
      if (!date) continue;
      date.setUTCSeconds(0, 0);
      const key = date.toISOString();
      activity[key] = (activity[key] ?? 0) + 1;
    }
    Object.assign(stats, {
      starts: runs.length,
      players: runs.every(run => run.participant_id) ? counts.size : undefined,
      repeatPlayers: runs.every(run => run.participant_id) ? [...counts.values()].filter(count => count > 1).length : undefined,
      accepted: accepted.length,
      totalTimeMs: sumMetric(accepted, 'time_ms'),
      timedRuns: accepted.filter(run => Number.isFinite(run.time_ms)).length,
      passes: sumMetric(accepted, 'passes'),
      bestScore: accepted.length ? Math.max(...accepted.map(run => run.score_points)) : undefined,
      scoreSum: sumMetric(accepted, 'score_points'),
      scoreCount: accepted.length,
      activity_by_minute: activity
    });
  }
  if (prizes.length) {
    stats.vouchers = prizes.length;
    if (prizes.every(prize => Number.isFinite(prize.redeemed_at?.toMillis()) || prize.redeemed_at === null)) {
      stats.redeemed = prizes.filter(prize => prize.redeemed_at !== null).length;
    }
  }
  return stats;
}
