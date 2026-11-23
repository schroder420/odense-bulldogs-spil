import { errorText, firebase, pageUrl } from './app.js';

const form = document.getElementById('login-form');
const password = document.getElementById('password');
const toggle = document.getElementById('password-toggle');
const message = document.getElementById('login-message');
const loginButton = document.getElementById('login-button');
const next = new URLSearchParams(location.search).get('retur');
const target = /^(vaelg-spil|overblik|konfigurer|tidspunkt|konkurrencer|afvikling|deltagere|resultat|praemier|statistik|indstillinger|side-skabelon)\.html(?:\?[^#]*)?$/.test(next)
  ? next : 'overblik.html';

toggle.addEventListener('click', () => {
  const isHidden = password.type === 'password';
  password.type = isHidden ? 'text' : 'password';
  toggle.textContent = isHidden ? 'Skjul' : 'Vis';
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (loginButton.disabled || !form.reportValidity()) return;

  message.classList.add('is-loading');
  message.textContent = 'Logger ind…';
  loginButton.disabled = true;
  try {
    const api = await firebase();
    await api.login(form.elements.email.value.trim(), password.value);
    location.replace(pageUrl(target));
  } catch (error) {
    message.textContent = errorText(error, 'Login kunne ikke gennemføres. Prøv igen.');
    password.select();
  } finally {
    message.classList.remove('is-loading');
    loginButton.disabled = false;
  }
});
