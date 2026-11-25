// Demoknapperne skifter kun den viste overlay. Der kører intet spil.
const preview = document.getElementById('game-preview');
const overlays = document.querySelectorAll('[data-game-overlay]');
const controls = document.querySelectorAll('.demo-controls button');

function showDemoView(view) {
  // Hold fokus på en synlig demoknap, når en overlay lukkes eller skiftes.
  document.querySelector('.demo-controls [data-demo-view="' + view + '"]').focus({ preventScroll: true });

  for (const overlay of overlays) {
    overlay.hidden = overlay.dataset.gameOverlay !== view;
    overlay.scrollTop = 0;
  }

  for (const button of controls) {
    button.setAttribute('aria-pressed', String(button.dataset.demoView === view));
  }

  preview.inert = view !== 'play';
}

for (const button of document.querySelectorAll('[data-demo-view]')) {
  button.addEventListener('click', function () {
    showDemoView(button.dataset.demoView);
  });
}

// Escape viser den statiske bane igen.
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    showDemoView('play');
  }
});
