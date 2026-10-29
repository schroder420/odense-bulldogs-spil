// Konkurrencer: søgning, statusfiltre og bekræftelse ved annullering.
// Hold sidens variabler inde i funktionen, så de ikke kolliderer med andre scripts.

function startKonkurrencer() {
  const searchField = document.getElementById('competition-search');
  const noResults = document.getElementById('no-results');
  const noCompetitions = document.getElementById('no-competitions');

  // Vis kun de rækker, der passer til både søgning og valgt status.
  function updateList() {
    const rows = document.querySelectorAll('.competition-row');
    const search = searchField.value.trim().toLowerCase();
    const status = document.querySelector('input[name="status-filter"]:checked').value;
    let visibleRows = 0;

    for (const row of rows) {
      const matchesSearch = row.dataset.name.toLowerCase().includes(search);
      const matchesStatus = status === 'alle' || row.dataset.status === status;

      row.hidden = !(matchesSearch && matchesStatus);

      if (!row.hidden) {
        visibleRows++;
      }
    }

    noCompetitions.hidden = rows.length > 0;
    noResults.hidden = rows.length === 0 || visibleRows > 0;
  }

  searchField.addEventListener('input', updateList);

  for (const filter of document.querySelectorAll('input[name="status-filter"]')) {
    filter.addEventListener('change', updateList);
  }


  // Annullering kræver bekræftelse. Eksempeldata: rækken fjernes kun fra visningen.
  const cancelDialog = document.getElementById('cancel-dialog');
  let rowToCancel = null;

  for (const button of document.querySelectorAll('.cancel-button')) {
    button.addEventListener('click', function () {
      rowToCancel = button.closest('.competition-row');
      showText('cancel-title', 'Annullér “' + rowToCancel.dataset.name + '”?');
      cancelDialog.showModal();
    });
  }

  document.getElementById('confirm-cancel').addEventListener('click', function () {
    if (rowToCancel) {
      rowToCancel.remove();
      rowToCancel = null;
      updateList();
    }

    cancelDialog.close();
  });
}

startKonkurrencer();
