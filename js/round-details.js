import { errorText, keepRoundLinks, linkTo, node, pageUrl, selectedId, showStatus, showText, staffReady } from './app.js';
import { acceptedRuns, formatNumber, formatScore, rankScores } from './archive.js';
import { participantCounts } from './stats.js';

const mode = document.body.dataset.details;
const emptyText = {
  participants: 'Der er endnu ingen registrerede deltagere i denne konkurrence.',
  results: 'Der er endnu ingen godkendte resultater i denne konkurrence.',
  prizes: 'Der er endnu ingen registrerede præmier i denne konkurrence.'
};

async function participantNames(api, ids) {
  const documents = await Promise.all([...new Set(ids.filter(Boolean))].map(id => api.readDocument('participants', id)));
  return new Map(documents.filter(Boolean).map(person => [
    person.id, person.hidden ? 'Skjult deltager' : person.nickname || 'Deltager uden navn'
  ]));
}

async function detailsRows(api, id) {
  if (mode === 'participants') {
    const runs = await api.readCollection('runs', id);
    const counts = participantCounts(runs);
    const accepted = participantCounts(acceptedRuns(runs));
    const names = await participantNames(api, [...counts.keys()]);
    return [...counts].map(([participant, count]) => [
      names.get(participant) ?? 'Ukendt deltager', formatNumber(count), formatNumber(accepted.get(participant) ?? 0)
    ]).sort(([a], [b]) => a.localeCompare(b, 'da'));
  }

  const isPrize = mode === 'prizes';
  const records = await api.readCollection(isPrize ? 'prizes' : 'scores', id);
  const names = await participantNames(api, records.map(row => row.participant_id));
  const name = record => names.get(record.participant_id) ?? 'Ukendt deltager';
  if (isPrize) {
    return records.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)).map(row => [
      formatNumber(row.rank), name(row), row.prize_label || 'Ingen præmietekst',
      row.redeemed_at?.toMillis() != null ? 'Indløst' : row.redeemed_at === null ? 'Uindløst' : 'Ukendt status'
    ]);
  }

  return rankScores(records).map((row, index) => [
    index + 1, name(row), formatScore(row.score_points),
    Number.isFinite(row.time_ms) ? formatNumber(row.time_ms / 1000) + ' sek.' : 'Ingen data',
    formatNumber(row.passes)
  ]);
}

async function startDetails() {
  const session = await staffReady;
  if (!session) return;
  const { api } = session;
  const actions = document.getElementById('details-actions');
  const tabs = document.querySelector('.competition-tabs');
  if (tabs) tabs.hidden = true;

  try {
    const historyId = selectedId('historik');
    const roundId = selectedId();
    if (historyId) {
      const round = await api.readDocument('historical_round_stats', historyId);
      if (!round || round.data_kind !== 'match') throw new Error('Den historiske kamp findes ikke.');
      showText('detail-title', round.title + (round.opponent_name ? ' · Mod ' + round.opponent_name : ''));
      showStatus('details-status', 'Supabase-eksporten indeholder kamptotaler. Deltagere, individuelle resultater og vouchers kan ikke vises.');
      actions.append(linkTo('Se kampstatistik', 'statistik.html', { historik: historyId }));
      return;
    }

    if (!roundId && mode === 'prizes') {
      const rounds = await api.readCollection('rounds');
      const select = document.getElementById('prize-round');
      for (const round of rounds.sort((a, b) => a.title.localeCompare(b.title, 'da'))) {
        const option = node('option', round.title);
        option.value = round.id;
        select.append(option);
      }
      select.addEventListener('change', () => { if (select.value) location.href = pageUrl('praemier.html', { runde: select.value }); });
      document.getElementById('prize-round-field').hidden = !rounds.length;
      showStatus('details-status', rounds.length ? '' : 'Ingen nye konkurrencer med individuelle præmier at vælge imellem.');
      return;
    }

    if (!roundId) {
      showStatus('details-status', 'Vælg en konkurrence i arkivet for at se dens oplysninger.');
      actions.append(linkTo('Åbn konkurrencearkiv', 'konkurrencer.html'));
      return;
    }

    const round = await api.readDocument('rounds', roundId);
    if (!round) throw new Error('Konkurrencen findes ikke.');
    const query = { runde: roundId };
    showText('detail-title', round.title + ' · Mod ' + round.opponent);
    keepRoundLinks(query);
    if (tabs) tabs.hidden = false;
    if (mode === 'results') actions.append(
      linkTo('Se statistik', 'statistik.html', query), linkTo('Se præmier', 'praemier.html', query)
    );
    if (mode === 'prizes') actions.append(
      linkTo('Se resultat', 'resultat.html', query), linkTo('Vælg en anden konkurrence', 'praemier.html')
    );

    showStatus('details-status', 'Henter oplysninger…');
    const rows = await detailsRows(api, roundId);
    const body = document.getElementById('details-rows');
    for (const cells of rows) {
      const row = node('tr');
      row.append(...cells.map(value => node('td', value)));
      body.append(row);
    }
    document.getElementById('details-table').hidden = rows.length === 0;
    showStatus('details-status', rows.length ? '' : emptyText[mode]);
  } catch (error) {
    showStatus('details-status', errorText(error, 'Oplysningerne kunne ikke hentes. Genindlæs siden for at prøve igen.'), 'error');
  }
}

startDetails();
