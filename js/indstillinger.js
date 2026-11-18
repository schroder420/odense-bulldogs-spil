// Indstillinger: standarder for nye konkurrencer, storskærm og skift af adgangskode.
// Hold sidens variabler inde i funktionen, så de ikke kolliderer med andre scripts.

function startIndstillinger() {
  const settingsForm = document.getElementById('settings-form');
  const screenKey = 'bulldogs-demo:v1:screen-settings';
  const rotation = document.getElementById('default-rotation');
  const messageTitle = document.getElementById('default-message-title');
  const message = document.getElementById('default-message');

  // Konkurrencestandarderne hentes fra competition i data.js.
  fillForm(settingsForm);

  // Storskærmens standarder har deres egen nøgle i browseren.
  try {
    const savedScreen = JSON.parse(localStorage.getItem(screenKey));

    if (savedScreen) {
      rotation.checked = savedScreen.rotation;
      messageTitle.value = savedScreen.messageTitle;
      message.value = savedScreen.message;
    }
  } catch (error) {
    // Brug værdierne fra HTML, hvis de gemte oplysninger ikke kan læses.
  }

  settingsForm.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!settingsForm.checkValidity()) {
      settingsForm.reportValidity();
      return;
    }

    let screenSaved = true;

    try {
      localStorage.setItem(screenKey, JSON.stringify({
        rotation: rotation.checked,
        messageTitle: messageTitle.value.trim(),
        message: message.value.trim()
      }));
    } catch (error) {
      screenSaved = false;
    }

    if (saveForm(settingsForm) && screenSaved) {
      showText('settings-status', 'Indstillingerne er gemt.');
    } else {
      showText('settings-status', '');
    }
  });


  // Vis/skjul adgangskode i alle felter med en Vis-knap.
  for (const button of document.querySelectorAll('.password-toggle')) {
    button.addEventListener('click', function () {
      const input = document.getElementById(button.getAttribute('aria-controls'));
      const isHidden = input.type === 'password';

      input.type = isHidden ? 'text' : 'password';
      button.textContent = isHidden ? 'Skjul' : 'Vis';
    });
  }


  // Eksempel på skift af adgangskode. Den rigtige kontrol sker senere på serveren.
  const passwordForm = document.getElementById('password-form');

  passwordForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const current = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const repeat = document.getElementById('repeat-password').value;

    if (!passwordForm.checkValidity()) {
      passwordForm.reportValidity();
      return;
    }

    if (current !== 'bulldogs') {
      showText('password-status', 'Den nuværende adgangskode er forkert.');
    } else if (newPassword !== repeat) {
      showText('password-status', 'De nye adgangskoder er ikke ens.');
    } else {
      showText('password-status', 'Adgangskoden er ændret.');
      passwordForm.reset();
    }
  });
}

startIndstillinger();
