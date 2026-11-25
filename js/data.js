// Firestore gemmer konkurrencen. Modulet holder styr på formularen og dens lokale kladde.

export const defaults = {
  gameId: 'puck',
  title: '',
  homeTeam: 'Odense Bulldogs',
  opponent: '',
  primary: '#24364b',
  stripe: '#e48331',
  prize: '1 alm. fadøl eller sodavand pr. vinder',
  pickup: 'Viggos Bar',
  instructions: 'Vis din voucher i Viggos Bar. Personalet registrerer indløsningen ved udlevering.',
  duration: 3
};

const legacyDraftKey = 'bulldogs-demo:v1:draft';
const settingsKey = uid => 'bulldogs:settings:' + uid;
const draftKey = (uid, id) => 'bulldogs:draft:' + uid + ':' + id;

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function writeLocal(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function localSettings(uid) {
  return { ...defaults, ...readLocal(settingsKey(uid)) };
}

export function saveLocalSettings(uid, values) {
  return writeLocal(settingsKey(uid), values);
}

const danishClock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit'
});

export function scheduledFields(value) {
  const [date, time] = value ? danishClock.format(value.toDate()).split(' ') : ['', ''];
  return { startMode: value ? 'scheduled' : 'now', date, time };
}

// Find den danske vægtid blandt mulige UTC-tidspunkter omkring skiftet til sommertid.
export function danishStart(date, time) {
  const wallTime = date + ' ' + time;
  const utc = Date.parse(date + 'T' + time + 'Z');
  const matches = [2, 1].map(hours => utc - hours * 3_600_000)
    .filter(ms => Number.isFinite(ms) && danishClock.format(ms) === wallTime);
  if (matches.length !== 1) throw new Error('Vælg et entydigt dansk tidspunkt uden for skiftet mellem sommer- og vintertid.');
  if (matches[0] <= Date.now()) throw new Error('Vælg en starttid i fremtiden.');
  return matches[0];
}

export async function loadCompetition(api, uid, id, allowNew) {
  const round = await api.readDocument('rounds', id);
  if (!round && !allowNew) throw new Error('Konkurrencen findes ikke.');
  if (round && !['draft', 'scheduled'].includes(round.status)) {
    throw new Error('Konkurrencen kan åbnes fra arkivet. Redigering er lukket.');
  }
  const version = round?.version ?? null;
  const key = draftKey(uid, id);
  const draft = readLocal(key);
  const legacy = !round && !draft ? readLocal(legacyDraftKey) : null;
  const values = Object.fromEntries(Object.entries(localSettings(uid)).filter(([name]) => name in defaults));
  Object.assign(values, scheduledFields(null), legacy, round, round && scheduledFields(round.scheduled_at));
  const localValues = draft?.version === version ? draft.values : {};
  Object.assign(values, localValues);
  return { version, key, values, localValues, legacy: Boolean(legacy), newerVersion: draft != null && draft.version !== version };
}

export function fillForm(form, values) {
  for (const field of form.elements) {
    if (!field.name || !(field.name in values)) continue;
    if (field.type === 'radio') field.checked = field.value === values[field.name];
    else field.value = values[field.name];
  }
}

export function formValues(form) {
  return Object.fromEntries(new FormData(form));
}

export function saveDraft(form, draft) {
  const values = formValues(form);
  Object.assign(draft.values, values);
  Object.assign(draft.localValues, values);
  return writeLocal(draft.key, { version: draft.version, values: draft.localValues });
}

export async function saveForm(form, api, id, draft, action) {
  saveDraft(form, draft);
  const { values } = draft;
  let fields;
  if (action === 'configure') {
    const configurable = ['title', 'opponent', 'primary', 'stripe', 'prize', 'pickup', 'instructions'];
    fields = Object.fromEntries(configurable.map(name => [name, values[name].trim()]));
    if (draft.version === null) {
      Object.assign(fields, {
        gameId: defaults.gameId,
        homeTeam: defaults.homeTeam,
        duration: Math.min(15, Math.max(1, Math.trunc(Number(values.duration)) || defaults.duration))
      });
    }
  } else {
    fields = { duration: Number(values.duration) };
    if (action === 'schedule') fields.startMs = danishStart(values.date, values.time);
  }

  draft.version = await api.changeRound(id, draft.version, action, fields);
  writeLocal(draft.key, null);
  if (draft.legacy) writeLocal(legacyDraftKey, null);
  // Bevar startvalg fra en gammel kladde, indtil tidspunktet er gemt.
  if (action === 'configure') {
    const timing = draft.legacy ? values : draft.localValues;
    const { startMode, date, time, duration } = timing;
    if (startMode) writeLocal(draft.key, { version: draft.version, values: { startMode, date, time, duration } });
  }
}
