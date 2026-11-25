import { errorText, linkTo, showStatus, showText, staffReady } from './app.js';
import {
  acceptedRuns, archiveQuery, clockText, formatDate, formatNumber, formatScore,
  rankScores, readArchive, roundEnd
} from './archive.js';

async function startOverview() {
  const session = await staffReady;
  if (!session) return;
  const { api } = session;

  try {
    const archive = await readArchive(api);
    const active = archive.find(row => row.status === 'live');
    const scheduled = archive.filter(row => row.status === 'scheduled' && row.date >= Date.now()).at(-1);
    const latest = archive.find(row => row.status === 'final');

    if (active) {
      showText('current-title', active.title);
      showText('current-teams', active.homeTeam + ' mod ' + active.opponent);
      showText('current-start', formatDate(active.date));
      showText('current-end', formatDate(roundEnd(active)));
      showText('current-clock', clockText(active));
      setInterval(() => showText('current-clock', clockText(active)), 1000);
      const actions = document.getElementById('current-actions');
      actions.append(linkTo('Gå til afvikling', 'afvikling.html', archiveQuery(active), 'button button-primary'));
      const count = document.getElementById('current-count');
      api.readCollection('runs', active.id).then(runs => {
        const ids = new Set(acceptedRuns(runs).map(row => row.participant_id).filter(Boolean));
        count.textContent = ids.size ? formatNumber(ids.size) : 'Ingen data';
      }).catch(error => { count.textContent = errorText(error, 'Kunne ikke hente forsøg.'); });
      document.querySelector('.current-card').hidden = false;
    } else {
      document.getElementById('no-active').hidden = false;
    }

    if (scheduled) {
      showText('next-title', scheduled.title);
      showText('next-start', formatDate(scheduled.date));
      showText('next-duration', scheduled.duration + ' min.');
      document.getElementById('next-action').replaceChildren(linkTo('Se konkurrence', 'afvikling.html', archiveQuery(scheduled)));
      document.getElementById('next-card').hidden = false;
    } else {
      document.getElementById('no-scheduled').hidden = false;
    }

    if (latest) {
      showText('latest-title', latest.title);
      showText('latest-date', formatDate(latest.date));
      showText('latest-source', latest.historical ? 'Historisk kamp' : 'Afsluttet konkurrence');
      if (latest.historical) {
        showText('latest-label', 'Bedste registrerede score');
        showText('latest-value', formatScore(latest.bestScore));
        showText('latest-players', formatNumber(latest.players));
      } else {
        showText('latest-label', 'Bedste registrerede score');
        api.readCollection('scores', latest.id).then(scores => {
          showText('latest-value', formatScore(rankScores(scores)[0]?.score_points));
        }).catch(error => showText('latest-value', errorText(error, 'Kunne ikke hente scorer.')));
        api.readCollection('runs', latest.id).then(runs => {
          const ids = new Set(runs.map(row => row.participant_id).filter(Boolean));
          showText('latest-players', ids.size ? formatNumber(ids.size) : 'Ingen data');
        }).catch(error => showText('latest-players', errorText(error, 'Kunne ikke hente forsøg.')));
      }
      const page = latest.historical ? 'statistik.html' : 'resultat.html';
      document.getElementById('latest-action').replaceChildren(linkTo(latest.historical ? 'Se statistik' : 'Se resultat', page, archiveQuery(latest)));
      document.getElementById('latest-card').hidden = false;
    } else {
      document.getElementById('no-latest').hidden = false;
    }
    showStatus('overview-status', '');
    document.querySelector('.overview-layout').hidden = false;
  } catch (error) {
    showStatus('overview-status', errorText(error, 'Overblikket kunne ikke hentes. Genindlæs siden for at prøve igen.'), 'error');
  }
}

startOverview();
