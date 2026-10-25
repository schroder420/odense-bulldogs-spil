// AFVIKLING: faste eksempeldata suppleret med brugerens formularvalg.
if (document.body.dataset.page === 'run') {
  const title = competition.title || 'Bulldogs mod Herning, 1. pause';
  const opponent = competition.opponent || 'Herning Blue Fox';

  showText('run-title', title);
  showText('run-teams', competition.homeTeam + ' mod ' + opponent);
  showText('screen-competition-name', title);
  showText('preview-title', title);
  showText('stat-duration', competition.duration + ' min.');
  showText('stat-prize', competition.prize);

  // Tiden er et fast eksempel. Der kører ingen nedtælling i denne version.
  showText('countdown-value', String(competition.duration).padStart(2, '0') + ':00');

  const screenLink = document.getElementById('open-screen');
  document.getElementById('screen-url').value = screenLink.href;

  // Det delbare link åbner en pladsholder til den senere storskærm.
  if (window.location.search.includes('visning=storskaerm')) {
    document.querySelector('.app-shell').hidden = true;
    document.getElementById('screen-placeholder').hidden = false;
    showText('screen-placeholder-title', title);
  }
}
