// Overblik: kopiér storskærmens link til udklipsholderen.
// Hold sidens variabler inde i funktionen, så de ikke kolliderer med andre scripts.

function startOverblik() {
  const copyButton = document.getElementById('copy-link');

  if (!copyButton) {
    return;
  }

  copyButton.addEventListener('click', function () {
    // Eksempellink, indtil den rigtige storskærm er tilsluttet.
    const link = new URL('afvikling.html', window.location.href).href;

    navigator.clipboard.writeText(link)
      .then(function () {
        showText('copy-status', 'Link kopieret. Send det til den, der skal vise storskærmen.');
      })
      .catch(function () {
        showText('copy-status', 'Handlingen kunne ikke gennemføres. Prøv igen.');
      });
  });
}

startOverblik();
