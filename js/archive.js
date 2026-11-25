export const gameName = 'Hold pucken i live';
export const statusName = {
  draft: 'Kladde', scheduled: 'Planlagt', live: 'I gang', final: 'Afsluttet', cancelled: 'Annulleret'
};

export const numberText = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 2 });
export const dateText = new Intl.DateTimeFormat('da-DK', {
  timeZone: 'Europe/Copenhagen', dateStyle: 'medium', timeStyle: 'short'
});
export const minuteText = new Intl.DateTimeFormat('da-DK', {
  timeZone: 'Europe/Copenhagen', hour: '2-digit', minute: '2-digit'
});

export function formatDate(ms) {
  return Number.isFinite(ms) ? dateText.format(ms) : 'Ukendt tidspunkt';
}

export function formatNumber(value) {
  return Number.isFinite(value) ? numberText.format(value) : 'Ingen data';
}

export function formatScore(value) {
  return Number.isFinite(value) ? numberText.format(value / 1000) + ' point' : 'Ingen data';
}

export function roundStart(round) {
  return (round.started_at ?? round.scheduled_at)?.toMillis();
}

export function roundEnd(round) {
  return round.ended_at?.toMillis() ?? (round.started_at
    ? round.started_at.toMillis() + round.duration * 60000 : undefined);
}

export function clockText(round) {
  if (round.status === 'final') return 'Afsluttet';
  if (!round.started_at) return 'Afventer start';
  const seconds = Math.max(0, Math.ceil((roundEnd(round) - Date.now()) / 1000));
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}

export function rankScores(scores) {
  return scores.filter(score => Number.isFinite(score.score_points))
    .sort((a, b) => b.score_points - a.score_points
      || (a.achieved_at?.toMillis() ?? Infinity) - (b.achieved_at?.toMillis() ?? Infinity)
      || a.id.localeCompare(b.id));
}

export function acceptedRuns(runs) {
  return runs.filter(run => run.finished_at != null && Number.isFinite(run.score_points));
}

export async function readArchive(api) {
  const [rounds, history] = await Promise.all([
    api.readCollection('rounds'), api.readCollection('historical_round_stats')
  ]);
  const historical = history.filter(record => record.data_kind === 'match').map(record => ({
    ...record,
    historical: true,
    date: Date.parse(record.starts_at_iso),
    title: record.title || 'Historisk kamp',
    opponent: record.opponent_name,
    status: 'final'
  }));
  const historicalIds = new Set(historical.map(row => row.id));
  const current = rounds.filter(round => !historicalIds.has(round.historical_stats_id))
    .map(round => ({ ...round, date: roundStart(round) ?? round.created_at?.toMillis() }));
  return [...current, ...historical].sort((a, b) => (b.date ?? 0) - (a.date ?? 0));
}

export function archiveQuery(row) {
  return row.historical ? { historik: row.id } : { runde: row.id };
}
