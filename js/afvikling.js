import { duringSave, errorText, keepRoundLinks, linkTo, node, pageUrl, selectedId, showStatus, showText, staffReady } from './app.js';
import { acceptedRuns, clockText, formatDate, formatNumber, formatScore, rankScores, roundEnd, roundStart, statusName } from './archive.js';

async function startRun() {
  const session = await staffReady;
  if (!session) return;
  const { api } = session;
  let round;
  try {
    const id = selectedId();
    if (!id) throw new Error('Vælg en konkurrence i arkivet.');
    round = await api.readDocument('rounds', id);
    if (!round) throw new Error('Konkurrencen findes ikke.');
  } catch (error) {
    showStatus('run-load', errorText(error, 'Konkurrencen kunne ikke hentes.'), 'error');
    return;
  }

  const id = round.id;
  const editable = ['draft', 'scheduled'].includes(round.status);
  keepRoundLinks({ runde: id });
  showText('run-title', round.title);
  showText('run-teams', round.homeTeam + ' mod ' + round.opponent);
  showText('run-status', statusName[round.status]);
  showText('stat-duration', round.duration + ' min.');
  showText('stat-prize', round.prize || 'Ingen præmie angivet');
  showText('countdown-description', roundStart(round) == null ? 'Der er endnu ingen starttid.'
    : (round.started_at ? 'Startet ' : 'Planlagt til ') + formatDate(roundStart(round)));

  const countdown = document.getElementById('countdown-value');
  const progress = document.getElementById('competition-progress');
  function updateClock() {
    countdown.textContent = round.status === 'cancelled' ? 'Annulleret' : clockText(round);
    if (round.status === 'live') {
      const percent = Math.max(0, Math.min(100, 100 * (roundEnd(round) - Date.now()) / (round.duration * 60000)));
      progress.style.width = percent + '%';
      showText('countdown-label', percent ? 'Tid tilbage' : 'Spilletiden er udløbet');
    }
  }
  updateClock();
  if (round.status === 'live') setInterval(updateClock, 1000);

  const actions = document.getElementById('run-actions');
  if (editable) {
    actions.append(linkTo('Rediger', 'konfigurer.html', { runde: id }), linkTo('Planlæg', 'tidspunkt.html', { runde: id }));
  }
  if (editable || round.status === 'live') {
    const action = editable ? 'start' : 'finish';
    const control = node('button', editable ? 'Start nu' : 'Afslut konkurrence', 'button button-primary');
    control.type = 'button';
    control.addEventListener('click', () => duringSave(control, 'run-action-status', async () => {
      await api.changeRound(id, round.version, action);
      location.replace(pageUrl('afvikling.html', { runde: id }));
    }));
    actions.prepend(control);
  }

  document.querySelector('.run-layout').hidden = false;
  showStatus('run-load', '');
  try {
    const runs = await api.readCollection('runs', id);
    const accepted = acceptedRuns(runs);
    const ids = new Set(accepted.map(run => run.participant_id).filter(Boolean));
    showText('stat-players', runs.length ? formatNumber(ids.size) : 'Ingen data');
    showText('stat-attempts', runs.length ? formatNumber(accepted.length) : 'Ingen data');
  } catch (error) {
    showText('stat-players', 'Kunne ikke hentes');
    showText('stat-attempts', 'Kunne ikke hentes');
    showStatus('run-stats-status', errorText(error, 'Forsøg kunne ikke hentes.'), 'error');
  }

  try {
    const scores = rankScores(await api.readCollection('scores', id)).slice(0, 5);
    const list = document.getElementById('run-scores');
    for (const [index, score] of scores.entries()) {
      const row = node('li');
      row.append(node('span', index + 1), node('strong', 'Placering ' + (index + 1)), node('b', formatScore(score.score_points)));
      list.append(row);
    }
    showStatus('run-preview-status', scores.length ? '' : 'Der er endnu ingen registrerede scorer.');
  } catch (error) {
    showStatus('run-preview-status', errorText(error, 'Scorer kunne ikke hentes.'), 'error');
  }
}

startRun();
