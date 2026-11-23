import { duringSave, errorText, keepRoundLinks, pageUrl, selectedId, showStatus, showText, staffReady } from './app.js';
import { fillForm, loadCompetition, saveDraft, saveForm } from './data.js';

async function startTiming() {
  const session = await staffReady;
  if (!session) return;
  const { api, user } = session;
  const form = document.getElementById('timing-form');
  const submit = document.getElementById('start-competition');
  const dateInput = document.getElementById('start-date');
  const timeInput = document.getElementById('start-time');

  try {
    const id = selectedId();
    if (!id) throw new Error('Vælg en konkurrence i arkivet, eller opret en ny via spilvalget.');
    const draft = await loadCompetition(api, user.uid, id, false);
    const { values } = draft;

    function updateSummary() {
      const scheduled = values.startMode === 'scheduled';
      document.getElementById('scheduled-fields').hidden = !scheduled;
      dateInput.required = scheduled;
      timeInput.required = scheduled;

      for (const radio of form.querySelectorAll('[name="startMode"]')) {
        radio.closest('.option-card').classList.toggle('is-selected', radio.checked);
      }

      const startText = scheduled
        ? (values.date && values.time ? values.date + ' kl. ' + values.time : 'Vælg dato og tidspunkt')
        : 'Med det samme';

      showText('start-button-label', scheduled ? 'Planlæg konkurrence' : 'Start nu');
      showText('calculated-start', startText);
      showText('calculated-end', values.duration + ' minutter efter start');
      showText('summary-name', values.title);
      showText('summary-teams', values.homeTeam + ' mod ' + values.opponent);
      showText('summary-start', startText);
      showText('summary-duration', values.duration + ' minutter');
      showText('summary-prize', values.prize);
      showText('summary-pickup', values.pickup);
    }

    fillForm(form, values);
    keepRoundLinks({ runde: id });
    updateSummary();
    form.hidden = false;
    showStatus('form-status', draft.newerVersion ? 'Konkurrencen er ændret siden din lokale kladde. De gemte oplysninger vises.' : '');

    form.addEventListener('input', () => {
      saveDraft(form, draft);
      updateSummary();
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      duringSave(submit, 'save-error', async () => {
        form.inert = true;
        try {
          const action = form.elements.startMode.value === 'scheduled' ? 'schedule' : 'start';
          await saveForm(form, api, id, draft, action);
          location.href = pageUrl('afvikling.html', { runde: id });
        } finally {
          form.inert = false;
        }
      });
    });
  } catch (error) {
    showStatus('form-status', errorText(error, 'Konkurrencen kunne ikke hentes. Genindlæs siden for at prøve igen.'), 'error');
  }
}

startTiming();
