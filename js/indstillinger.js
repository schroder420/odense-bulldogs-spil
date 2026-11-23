import { errorText, showStatus, staffReady } from './app.js';
import { fillForm, formValues, localSettings, saveLocalSettings } from './data.js';

async function startSettings() {
  const session = await staffReady;
  if (!session) return;
  const { api, user } = session;
  const settingsForm = document.getElementById('settings-form');
  const settings = localSettings(user.uid);

  fillForm(settingsForm, settings);

  settingsForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!settingsForm.reportValidity()) return;
    const values = formValues(settingsForm);
    const saved = saveLocalSettings(user.uid, values);
    showStatus('save-error', saved ? '' : 'Indstillingerne kunne ikke gemmes i browseren.', 'error');
    showStatus('settings-status', saved ? 'Indstillingerne er gemt i denne browser.' : '');
  });

  for (const button of document.querySelectorAll('.password-toggle')) {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.getAttribute('aria-controls'));
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      button.textContent = isHidden ? 'Skjul' : 'Vis';
    });
  }

  const passwordForm = document.getElementById('password-form');
  const submit = passwordForm.querySelector('[type="submit"]');
  passwordForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !passwordForm.reportValidity()) return;
    const current = document.getElementById('current-password').value;
    const replacement = document.getElementById('new-password').value;
    if (replacement !== document.getElementById('repeat-password').value) {
      showStatus('password-status', 'De nye adgangskoder er ikke ens.', 'error');
      return;
    }

    submit.disabled = true;
    showStatus('password-status', 'Ændrer adgangskode…');
    try {
      await api.changePassword(user, current, replacement);
      passwordForm.reset();
      showStatus('password-status', 'Adgangskoden er ændret.');
    } catch (error) {
      showStatus('password-status', errorText(error, 'Adgangskoden kunne ikke ændres.'), 'error');
    } finally {
      submit.disabled = false;
    }
  });
}

startSettings();
