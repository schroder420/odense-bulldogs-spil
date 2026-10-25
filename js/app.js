// Små hjælpefunktioner bruges af formularerne på flere sider.
function showText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}


// Udfyld formularen med de oplysninger, der allerede er gemt.
function fillForm(form) {
  for (const field of form.elements) {
    if (field.name) {
      if (field.type === 'radio') {
        field.checked = field.value === competition[field.name];
      } else {
        field.value = competition[field.name];
      }
    }
  }
}


// Gem alle navngivne felter. For radioknapper gemmes kun det valgte svar.
function saveForm(form) {
  for (const field of form.elements) {
    if (field.name && (field.type !== 'radio' || field.checked)) {
      competition[field.name] = field.value;
    }
  }

  const saved = saveCompetition();
  const saveError = document.getElementById('save-error');

  if (saveError) {
    saveError.hidden = saved;

    if (!saved) {
      saveError.textContent = 'Dine ændringer kunne ikke gemmes. Tillad lagring i browseren, og prøv igen.';
    }
  }

  return saved;
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
