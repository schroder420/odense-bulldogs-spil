// KONFIGURERING: gem felter, og opdater dragtens navn og farver.
const configureForm = document.getElementById('configure-form');

if (configureForm) {
  const nameInput = document.getElementById('competition-name');
  const opponentInput = document.getElementById('opponent-name');

  // Native validering viser en dansk fejl, hvis et navn kun indeholder mellemrum.
  function validateNames() {
    nameInput.setCustomValidity('');
    opponentInput.setCustomValidity('');

    if (!nameInput.value.trim()) {
      nameInput.setCustomValidity('Giv konkurrencen et navn.');
    }

    if (!opponentInput.value.trim()) {
      opponentInput.setCustomValidity('Indtast modstanderens navn.');
    }
  }

  function updateKit() {
    showText('primary-hex', competition.primary.toUpperCase());
    showText('stripe-hex', competition.stripe.toUpperCase());
    showText('kit-opponent-label', competition.opponent || 'Modstander');

    const jersey = document.getElementById('opponent-jersey');
    jersey.style.setProperty('--kit-primary', competition.primary);
    jersey.style.setProperty('--kit-stripe', competition.stripe);
    jersey.setAttribute('aria-label', 'Dragt for ' + (competition.opponent || 'modstanderen'));
  }

  fillForm(configureForm);
  validateNames();
  updateKit();

  configureForm.addEventListener('input', function () {
    validateNames();
    saveForm(configureForm);
    updateKit();
  });

  // Fjern ydre mellemrum ved submit. Bliv i formularen, hvis gemning afvises.
  configureForm.addEventListener('submit', function (event) {
    event.preventDefault();
    nameInput.value = nameInput.value.trim();
    opponentInput.value = opponentInput.value.trim();
    validateNames();

    if (!configureForm.reportValidity()) {
      return;
    }

    const saved = saveForm(configureForm);
    updateKit();

    if (!saved) {
      return;
    }

    window.location.href = 'tidspunkt.html';
  });
}
