import { errorText, firebase, linkTo, node, selectedId, showStatus, showText } from './app.js';
import { formatDate, formatScore } from './archive.js';

async function showLeaderboard() {
  try {
    const id = selectedId();
    if (!id) {
      showStatus('public-status', 'Der er ingen konkurrence valgt. Åbn leaderboardet fra fansiden, når en konkurrence er offentliggjort.');
      return;
    }
    const api = await firebase();
    const round = await api.readDocument('public_rounds', id);
    if (!round) {
      showStatus('public-status', 'Konkurrencen er endnu ikke offentliggjort.');
      return;
    }
    showText('public-round-title', round.title);
    const entries = await api.readLeaderboard(id);
    const list = document.getElementById('public-rankings');
    for (const entry of entries) {
      const row = node('li', null, 'ranking-row');
      row.append(
        node('span', entry.rank, 'ranking-number'),
        node('strong', entry.nickname || 'Bulldogs-fan', 'ranking-player'),
        node('strong', formatScore(entry.score_points), 'ranking-score')
      );
      list.append(row);
    }
    showStatus('public-status', entries.length ? '' : 'Der er endnu ingen offentliggjorte resultater.');
    document.getElementById('public-results').hidden = !entries.length;
  } catch (error) {
    showStatus('public-status', errorText(error, 'Leaderboardet kunne ikke hentes. Prøv at genindlæse siden.'), 'error');
  }
}

async function showFanCompetition() {
  try {
    const api = await firebase();
    const rows = await api.readCollection('public_rounds');
    const withStart = rows.filter(row => Number.isFinite(row.starts_at?.toMillis()));
    const next = withStart.filter(row => row.status === 'scheduled' && row.starts_at.toMillis() >= Date.now())
      .sort((a, b) => a.starts_at.toMillis() - b.starts_at.toMillis())[0];
    const live = withStart.filter(row => row.status === 'live')
      .sort((a, b) => b.starts_at.toMillis() - a.starts_at.toMillis())[0];
    const final = withStart.filter(row => row.status === 'final')
      .sort((a, b) => b.starts_at.toMillis() - a.starts_at.toMillis())[0];
    const round = live ?? next ?? final;
    showStatus('public-status', round ? round.title + ' · ' + formatDate(round.starts_at.toMillis())
      : 'Der er endnu ingen offentliggjorte pausekonkurrencer.');
    if (round) {
      document.getElementById('public-competition-link').append(linkTo('Se leaderboard', 'leaderboard.html',
        { runde: round.id }, 'button button-primary'));
    }
  } catch (error) {
    showStatus('public-status', errorText(error, 'Pausekonkurrencerne kunne ikke hentes.'), 'error');
  }
}

if (document.body.classList.contains('leaderboard-page')) showLeaderboard();
else showFanCompetition();
