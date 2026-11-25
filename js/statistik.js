import { errorText, linkTo, node, selectedId, showStatus, showText, staffReady } from './app.js';
import { archiveQuery, formatDate, formatNumber, formatScore, gameName, minuteText, readArchive } from './archive.js';
import { combinedRatio, ratio, roundStats, sumMetric } from './stats.js';

const period = document.getElementById('period');
const competition = document.getElementById('competition');
const game = document.getElementById('game');

function matchKey(row) {
  return (row.historical ? 'historik:' : 'runde:') + row.id;
}

function showKpis(rows) {
  const sum = field => sumMetric(rows, field);
  const repeat = combinedRatio(rows, 'repeatPlayers', 'players');
  const seconds = combinedRatio(rows, 'totalTimeMs', 'timedRuns');
  const best = rows.map(row => row.bestScore).filter(Number.isFinite);
  const vouchers = rows.filter(row => Number.isFinite(row.vouchers) && Number.isFinite(row.redeemed));
  showText('kpi-players', formatNumber(sum('players')));
  showText('kpi-starts', formatNumber(sum('starts')));
  showText('kpi-accepted', formatNumber(sum('accepted')));
  showText('kpi-per-player', formatNumber(combinedRatio(rows, 'starts', 'players')));
  showText('kpi-repeat', repeat == null ? 'Ingen data' : formatNumber(repeat * 100) + ' %');
  showText('kpi-vouchers', vouchers.length ? formatNumber(sumMetric(vouchers, 'redeemed')) + ' / ' + formatNumber(sumMetric(vouchers, 'vouchers')) : 'Ingen data');
  showText('kpi-average-time', seconds == null ? 'Ingen data' : formatNumber(seconds / 1000) + ' sek.');
  showText('kpi-best-score', formatScore(best.length ? Math.max(...best) : undefined));
  const average = rows.some(row => row.historical) ? undefined : combinedRatio(rows, 'scoreSum', 'scoreCount');
  showText('kpi-average-score', formatScore(average));
  showText('kpi-coverage', rows.filter(row => Number.isFinite(row.starts)).length + ' af ' + rows.length
    + ' viste konkurrencer har forsøgsdata. Beregningerne bruger de kendte værdier.');
}

function showActivity(rows) {
  const source = rows.find(row => Object.keys(row.activity_by_minute ?? {}).length);
  const list = document.getElementById('activity-list');
  list.replaceChildren();
  if (!source) {
    showText('activity-title', 'Ingen aktivitet pr. minut registreret.');
    return;
  }
  showText('activity-title', 'Starter pr. minut · ' + source.title + (source.opponent ? ' mod ' + source.opponent : ''));
  const points = Object.entries(source.activity_by_minute).filter(([key, value]) => Number.isFinite(Date.parse(key)) && Number.isFinite(value))
    .sort(([left], [right]) => Date.parse(left) - Date.parse(right));
  const max = Math.max(1, ...points.map(([, value]) => value));
  for (const [key, value] of points) {
    const row = node('li', null, 'horizontal-chart-row');
    const track = node('span', null, 'horizontal-track');
    track.setAttribute('aria-hidden', 'true');
    const bar = node('span');
    bar.style.width = value / max * 100 + '%';
    track.append(bar);
    row.append(node('span', minuteText.format(Date.parse(key))), track, node('strong', formatNumber(value)));
    list.append(row);
  }
}

function showRows(rows) {
  const body = document.getElementById('statistics-rows');
  body.replaceChildren(...rows.map(row => {
    const item = node('tr');
    const vouchers = Number.isFinite(row.redeemed) && Number.isFinite(row.vouchers)
      ? formatNumber(row.redeemed) + ' / ' + formatNumber(row.vouchers) : 'Ingen data';
    const cells = [row.title + (row.opponent ? ' · Mod ' + row.opponent : ''), formatDate(row.date),
      row.historical ? 'Historisk pausespil' : gameName, formatNumber(row.players), formatNumber(row.starts),
      formatNumber(ratio(row.starts, row.players)), vouchers];
    item.append(...cells.map(text => node('td', text)));
    const action = node('td');
    action.append(linkTo(row.historical ? 'Se kampstatistik' : 'Åbn konkurrence',
      row.historical ? 'statistik.html' : 'afvikling.html', archiveQuery(row), 'button button-secondary button-small'));
    item.append(action);
    return item;
  }));
}

async function startStatistics() {
  const session = await staffReady;
  if (!session) return;

  try {
    const { api } = session;
    const roundId = selectedId();
    const historyId = selectedId('historik');
    const archive = await readArchive(api);
    const chosen = historyId ? 'historik:' + historyId : roundId ? 'runde:' + roundId : '';
    if (chosen && !archive.some(row => matchKey(row) === chosen)) throw new Error('Konkurrencen findes ikke i statistikoversigten.');
    for (const row of archive) {
      const option = node('option', row.title + (row.opponent ? ' · Mod ' + row.opponent : ''));
      option.value = matchKey(row);
      competition.append(option);
    }
    competition.value = chosen;
    document.getElementById('statistics-filters').hidden = false;
    const pendingStats = new Map();
    let renderVersion = 0;

    async function render() {
      const version = ++renderVersion;
      const cutoff = period.value ? Date.now() - Number(period.value) * 86400000 : -Infinity;
      const rows = archive.filter(row => (cutoff === -Infinity || row.date >= cutoff)
        && (!competition.value || matchKey(row) === competition.value)
        && (!game.value || row.gameId === game.value));
      document.getElementById('statistics-data').hidden = true;
      showStatus('statistics-status', 'Henter statistik…');
      try {
        const stats = await Promise.all(rows.map(row => {
          const key = matchKey(row);
          if (!pendingStats.has(key)) {
            pendingStats.set(key, roundStats(api, row).catch(error => {
              pendingStats.delete(key);
              throw error;
            }));
          }
          return pendingStats.get(key);
        }));
        if (version !== renderVersion) return;
        if (!stats.length) {
          showStatus('statistics-status', 'Ingen konkurrencer matcher de valgte filtre.');
          return;
        }
        showKpis(stats);
        showActivity(stats);
        showRows(stats);
        showStatus('statistics-status', '');
        document.getElementById('statistics-data').hidden = false;
      } catch (error) {
        if (version === renderVersion) showStatus('statistics-status', errorText(error, 'Statistikken kunne ikke hentes. Genindlæs siden for at prøve igen.'), 'error');
      }
    }

    document.querySelector('.statistics-filters').addEventListener('change', render);
    await render();
  } catch (error) {
    showStatus('statistics-status', errorText(error, 'Konkurrencerne kunne ikke hentes.'), 'error');
  }
}

startStatistics();
