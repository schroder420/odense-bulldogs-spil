// Formularens oplysninger samles i ét objekt.
// Det samme objekt bruges på tværs af siderne.
// Standardværdierne kan tilpasses her.
const competition = {
  gameId: 'puck',
  title: '',
  homeTeam: 'Odense Bulldogs',
  opponent: '',
  primary: '#24364b',
  stripe: '#e48331',
  prize: '1 alm. fadøl eller sodavand pr. vinder',
  pickup: 'Viggos Bar',
  instructions: 'Vis din voucher i Viggos Bar. Kun barpersonalet må swipe, når du får din drik.',
  duration: 3,
  startMode: 'now',
  date: '',
  time: ''
};


// Hent tidligere valg fra browseren, hvis de findes.
try {
  const savedData = localStorage.getItem('bulldogs-demo:v1:draft');

  if (savedData) {
    const savedCompetition = JSON.parse(savedData);

    Object.assign(competition, savedCompetition);
  }
} catch (error) {
  // Brug standardværdierne, hvis de gemte oplysninger ikke kan læses.
}


// Gem objektet, så formularvalgene huskes ved sideskift og genindlæsning.
function saveCompetition() {
  try {
    const savedData = JSON.stringify(competition);

    localStorage.setItem('bulldogs-demo:v1:draft', savedData);
    return true;
  } catch (error) {
    return false;
  }
}
