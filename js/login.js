// Personalelogin: vis/skjul adgangskode og et eksempel på login.
// Den rigtige kontrol af adgangskoden sker senere på serveren.

function startLogin() {
  const form = document.getElementById('login-form');
  const password = document.getElementById('password');
  const toggle = document.getElementById('password-toggle');
  const message = document.getElementById('login-message');
  const loginButton = document.getElementById('login-button');

  toggle.addEventListener('click', function () {
    const isHidden = password.type === 'password';

    password.type = isHidden ? 'text' : 'password';
    toggle.textContent = isHidden ? 'Skjul' : 'Vis';
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (password.value === '') {
      message.classList.remove('is-loading');
      message.textContent = 'Indtast personalets adgangskode.';
      password.focus();
      return;
    }

    message.classList.add('is-loading');
    message.textContent = 'Logger ind…';
    loginButton.disabled = true;

    // Kort pause, så indlæsningsbeskeden kan ses i eksemplet.
    setTimeout(function () {
      if (password.value === 'bulldogs') {
        window.location.href = 'overblik.html';
      } else {
        message.classList.remove('is-loading');
        message.textContent = 'Adgangskoden er forkert. Prøv igen.';
        loginButton.disabled = false;
        password.select();
      }
    }, 600);
  });
}

startLogin();
