import { duringSave, errorText, pageUrl, selectedId, showStatus, showText, staffReady } from './app.js';
import { fillForm, loadCompetition, saveDraft, saveForm } from './data.js';

async function startConfigure() {
  const session = await staffReady;
  if (!session) return;
  const { api, user } = session;
  const form = document.getElementById('configure-form');
  const nameInput = document.getElementById('competition-name');
  const opponentInput = document.getElementById('opponent-name');
  const submit = form.querySelector('[type="submit"]');

  try {
    const existingId = selectedId();
    const id = existingId ?? crypto.randomUUID();
    const allowNew = !existingId || new URLSearchParams(location.search).get('ny') === '1';
    if (!existingId) history.replaceState(null, '', pageUrl('konfigurer.html', { runde: id, ny: 1 }));
    const draft = await loadCompetition(api, user.uid, id, allowNew);

    function updateKit() {
      const { primary, stripe, opponent } = draft.values;
      showText('primary-hex', primary.toUpperCase());
      showText('stripe-hex', stripe.toUpperCase());
      showText('kit-opponent-label', opponent || 'Modstander');
      const jersey = document.getElementById('opponent-jersey');
      jersey.style.setProperty('--kit-primary', primary);
      jersey.style.setProperty('--kit-stripe', stripe);
      jersey.setAttribute('aria-label', 'Dragt for ' + (opponent || 'modstanderen'));
    }

    fillForm(form, draft.values);
    updateKit();
    form.hidden = false;
    showStatus('form-status', draft.newerVersion ? 'Konkurrencen er ændret siden din lokale kladde. De gemte oplysninger vises.' : '');

    form.addEventListener('input', () => {
      nameInput.setCustomValidity('');
      opponentInput.setCustomValidity('');
      saveDraft(form, draft);
      updateKit();
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      nameInput.value = nameInput.value.trim();
      opponentInput.value = opponentInput.value.trim();
      nameInput.setCustomValidity(nameInput.value ? '' : 'Giv konkurrencen et navn.');
      opponentInput.setCustomValidity(opponentInput.value ? '' : 'Indtast modstanderens navn.');
      if (!form.reportValidity()) return;

      duringSave(submit, 'save-error', async () => {
        form.inert = true;
        try {
          await saveForm(form, api, id, draft, 'configure');
          history.replaceState(null, '', pageUrl('konfigurer.html', { runde: id }));
          location.href = pageUrl('tidspunkt.html', { runde: id });
        } finally {
          form.inert = false;
        }
      });
    });
  } catch (error) {
    showStatus('form-status', errorText(error, 'Konkurrencen kunne ikke hentes. Genindlæs siden for at prøve igen.'), 'error');
  }
}

startConfigure();
