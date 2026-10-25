// TIDSPUNKT: vis relevante felter og en opsummering af de gemte valg.
const timingForm = document.getElementById('timing-form');

if (timingForm) {
  function updateSummary() {
    const scheduled = competition.startMode === 'scheduled';
    const dateInput = document.getElementById('start-date');
    const timeInput = document.getElementById('start-time');

    document.getElementById('scheduled-fields').hidden = !scheduled;
    dateInput.required = scheduled;
    timeInput.required = scheduled;

    for (const radio of timingForm.querySelectorAll('[name="startMode"]')) {
      radio.closest('.option-card').classList.toggle('is-selected', radio.checked);
    }

    let startText = 'Med det samme';
    let buttonText = 'Start nu';

    if (scheduled) {
      startText = 'Vælg dato og tidspunkt';
      buttonText = 'Planlæg konkurrence';

      if (competition.date && competition.time) {
        startText = competition.date + ' kl. ' + competition.time;
      }
    }

    showText('start-button-label', buttonText);
    showText('calculated-start', startText);
    showText('calculated-end', competition.duration + ' minutter efter start');
    showText('summary-name', competition.title || 'Din konkurrence');
    showText('summary-teams', competition.homeTeam + ' mod ' + (competition.opponent || 'modstander'));
    showText('summary-start', startText);
    showText('summary-duration', competition.duration + ' minutter');
    showText('summary-prize', competition.prize);
    showText('summary-pickup', competition.pickup);
  }

  fillForm(timingForm);
  updateSummary();

  timingForm.addEventListener('input', function () {
    saveForm(timingForm);
    updateSummary();
  });

  timingForm.addEventListener('submit', function (event) {
    event.preventDefault();
    competition.title = competition.title.trim();
    competition.opponent = competition.opponent.trim();

    if (!saveForm(timingForm)) {
      return;
    }

    if (!competition.title || !competition.opponent) {
      window.location.href = 'konfigurer.html';
      return;
    }

    window.location.href = 'afvikling.html';
  });
}
