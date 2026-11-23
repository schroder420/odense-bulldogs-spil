import { duringSave, errorText, linkTo, node, showStatus, showText, staffReady } from './app.js';
import { archiveQuery, formatDate, formatNumber, gameName, readArchive, statusName } from './archive.js';

async function startArchive() {
  const session = await staffReady;
  if (!session) return;
  const { api } = session;
  const list = document.getElementById('competition-list');
  const search = document.getElementById('competition-search');
  const dialog = document.getElementById('cancel-dialog');
  const confirm = document.getElementById('confirm-cancel');
  let selectedRound;
  let rows = [];

  function render() {
    const term = search.value.trim().toLocaleLowerCase('da');
    const status = document.querySelector('[name="status-filter"]:checked').value;
    const visible = rows.filter(row => (status === 'alle' || row.status === status)
      && (row.title + ' ' + (row.opponent ?? '')).toLocaleLowerCase('da').includes(term));

    list.replaceChildren(...visible.map(row => {
      const item = node('li', null, 'competition-row');
      const image = node('img');
      Object.assign(image, { src: 'assets/bulldogs-glide-v6.webp', alt: '', width: 56, height: 56 });
      const title = node('div', null, 'competition-main');
      const source = row.historical ? 'Historisk kamp' : gameName;
      title.append(node('h3', row.title), node('p', source + (row.opponent ? ' · Mod ' + row.opponent : '')));

      const facts = node('dl', null, 'competition-facts');
      const values = row.historical
        ? [['Start', formatDate(row.date)], ['Deltagere', formatNumber(row.players)], ['Forsøg', formatNumber(row.starts)]]
        : [['Start', roundStartLabel(row)], ['Varighed', row.duration + ' min.']];
      for (const [label, value] of values) {
        const fact = node('div');
        fact.append(node('dt', label), node('dd', value));
        facts.append(fact);
      }

      const badge = node('span', statusName[row.status], 'badge status-badge ' + (row.status === 'live' ? 'status-live' : 'badge-neutral'));
      const actions = node('div', null, 'competition-actions');
      const query = archiveQuery(row);
      if (row.historical) {
        actions.append(linkTo('Se statistik', 'statistik.html', query), linkTo('Se resultat', 'resultat.html', query, 'button button-text'));
      } else {
        actions.append(linkTo('Åbn konkurrence', 'afvikling.html', query));
        if (['draft', 'scheduled'].includes(row.status)) {
          actions.append(linkTo('Rediger', 'konfigurer.html', query, 'button button-text'));
          const cancel = node('button', 'Annullér', 'button button-text cancel-button');
          cancel.type = 'button';
          cancel.addEventListener('click', () => {
            selectedRound = row;
            showStatus('cancel-status', '');
            showText('cancel-title', 'Annullér “' + row.title + '”?');
            dialog.showModal();
          });
          actions.append(cancel);
        }
      }
      item.append(image, title, facts, badge, actions);
      return item;
    }));
    document.getElementById('no-competitions').hidden = rows.length !== 0;
    document.getElementById('no-results').hidden = rows.length === 0 || visible.length !== 0;
  }

  search.addEventListener('input', render);
  document.querySelector('.competition-filters').addEventListener('change', render);
  confirm.addEventListener('click', () => duringSave(confirm, 'cancel-status', async () => {
    const round = selectedRound;
    const version = await api.changeRound(round.id, round.version, 'cancel');
    Object.assign(round, { status: 'cancelled', version });
    dialog.close();
    render();
    showStatus('archive-status', 'Konkurrencen er annulleret.');
    search.focus();
  }));

  dialog.addEventListener('cancel', event => {
    if (confirm.disabled) event.preventDefault();
  });
  for (const button of dialog.querySelectorAll('[data-close-dialog]')) {
    button.addEventListener('click', event => {
      if (confirm.disabled) event.stopImmediatePropagation();
    }, { capture: true });
  }

  try {
    rows = await readArchive(api);
    showStatus('archive-status', '');
    document.getElementById('archive-filters').hidden = false;
    render();
  } catch (error) {
    showStatus('archive-status', errorText(error, 'Konkurrencerne kunne ikke hentes. Genindlæs siden for at prøve igen.'), 'error');
  }
}

function roundStartLabel(row) {
  return row.started_at || row.scheduled_at ? formatDate(row.date) : 'Afventer start';
}

startArchive();
