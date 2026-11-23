export function showText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}

// Mobilmenuen åbnes og lukkes ved at ændre en CSS-klasse.
const menuButton = document.getElementById('menu-toggle');

if (menuButton) {
  menuButton.addEventListener('click', function () {
    const isOpen = document.body.classList.toggle('nav-open');
    menuButton.setAttribute('aria-expanded', isOpen);
  });
}

function closeMenu() {
  document.body.classList.remove('nav-open');
  if (menuButton) {
    menuButton.setAttribute('aria-expanded', 'false');
  }
}

const menuBackdrop = document.getElementById('mobile-scrim');

if (menuBackdrop) {
  menuBackdrop.addEventListener('click', closeMenu);
}

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeMenu();
  }
});


// Sider, der bygges senere, viser en enkel dialog.
for (const button of document.querySelectorAll('[data-placeholder]')) {
  button.addEventListener('click', function () {
    const dialog = document.getElementById('placeholder-dialog');

    if (dialog && !dialog.open) {
      showText('placeholder-title', button.dataset.placeholder);
      dialog.showModal();
    }
  });
}

for (const button of document.querySelectorAll('[data-close-dialog]')) {
  button.addEventListener('click', function () {
    const dialog = button.closest('dialog');

    if (dialog) {
      dialog.close();
    }
  });
}

export function showStatus(id, message, kind = 'info') {
  const element = document.getElementById(id);
  if (!element) return;
  element.hidden = !message;
  element.dataset.kind = kind;
  element.textContent = message;
}

export function errorText(error, fallback = 'Handlingen kunne ikke gennemføres. Prøv igen.') {
  switch (error.code) {
    case 'permission-denied': return 'Firebase afviste adgangen. Bed den ansvarlige kontrollere din rolle og Firestore-reglerne.';
    case 'staff-required': return 'Kontoen er logget ind, men mangler personaleadgang.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'E-mailen eller adgangskoden er forkert.';
    case 'auth/weak-password': return 'Vælg en stærkere adgangskode.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found': return 'Login med e-mail og adgangskode er ikke aktiveret i Firebase.';
    case 'auth/too-many-requests': return 'For mange forsøg. Vent lidt, og prøv igen.';
    case 'auth/network-request-failed':
    case 'unavailable': return 'Der er ingen forbindelse til Firebase. Prøv igen om lidt.';
    default: return error.code || error.name === 'TypeError' ? fallback : error.message || fallback;
  }
}

// En fejl ved indlæsning af SDK'et kan vises på siden.
export function firebase() {
  return import('./firebase.js');
}

const params = new URLSearchParams(location.search);
const emulator = ['localhost', '127.0.0.1'].includes(location.hostname) && params.get('emulator') === '1';
const safeId = /^[A-Za-z0-9_-]{1,120}$/;

export function selectedId(key = 'runde') {
  const value = params.get(key);
  if (value === null) return null;
  if (!safeId.test(value)) throw new Error('Linket har et ugyldigt konkurrence-ID.');
  return value;
}

export function pageUrl(page, values = {}) {
  const url = new URL(page, location.href);
  if (emulator) url.searchParams.set('emulator', '1');
  for (const [key, val] of Object.entries(values)) {
    if (val != null) url.searchParams.set(key, val);
  }
  return url.pathname + url.search + url.hash;
}

if (emulator) {
  for (const badge of document.querySelectorAll('.environment-badge')) {
    badge.replaceChildren(document.createElement('span'), 'Lokal test');
  }
  for (const link of document.querySelectorAll('a[href]')) {
    const url = new URL(link.href);
    if (url.origin === location.origin && url.pathname.endsWith('.html') && !link.getAttribute('href').startsWith('#')) {
      link.href = pageUrl(url.href);
    }
  }
}

export function keepRoundLinks(query) {
  for (const link of document.querySelectorAll('.competition-tabs a, [data-round-link]')) {
    link.href = pageUrl(link.href, query);
  }
}

export function goToLogin() {
  const next = location.pathname.split('/').pop() + location.search;
  location.replace(pageUrl('login.html', { retur: next }));
}

const accessStatus = document.getElementById('access-status');
const main = document.getElementById('main');

export const staffReady = accessStatus ? checkAccess() : Promise.resolve(null);

async function checkAccess() {
  try {
    const api = await firebase();
    const user = await api.staffUser();
    if (!user) {
      goToLogin();
      return null;
    }
    showStatus('access-status', '');
    main.removeAttribute('data-checking-access');
    return { api, user };
  } catch (error) {
    showStatus('access-status', errorText(error, 'Personaleadgangen kunne ikke kontrolleres.'), 'error');
    const link = document.createElement('a');
    link.className = 'button button-secondary';
    link.href = pageUrl('login.html');
    link.textContent = 'Gå til login';
    accessStatus.after(link);
    link.setAttribute('data-access-link', '');
    return null;
  }
}

for (const link of document.querySelectorAll('a[aria-label="Log ud"]')) {
  link.addEventListener('click', async event => {
    event.preventDefault();
    try {
      await (await firebase()).logout();
      location.href = pageUrl('login.html');
    } catch (error) {
      const message = document.createElement('p');
      message.setAttribute('role', 'alert');
      message.textContent = errorText(error, 'Kunne ikke logge ud.');
      link.after(message);
    }
  });
}

export async function duringSave(control, statusId, operation) {
  if (control.disabled) return;
  control.disabled = true;
  showStatus(statusId, 'Gemmer…');
  try {
    await operation();
    showStatus(statusId, '');
  } catch (error) {
    showStatus(statusId, errorText(error), 'error');
  } finally {
    control.disabled = false;
  }
}

export function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function linkTo(text, page, values, className = 'button button-secondary') {
  const link = node('a', text, className);
  link.href = pageUrl(page, values);
  return link;
}
