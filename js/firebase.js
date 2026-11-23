import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import {
  connectAuthEmulator, EmailAuthProvider, getAuth, reauthenticateWithCredential,
  signInWithEmailAndPassword, signOut, updatePassword
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import {
  collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore,
  limit, orderBy, query, runTransaction, serverTimestamp, Timestamp, where
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore-lite.js';

const useEmulator = ['localhost', '127.0.0.1'].includes(location.hostname)
  && new URLSearchParams(location.search).get('emulator') === '1';

const app = initializeApp(useEmulator ? {
  apiKey: 'demo-key',
  projectId: 'demo-bulldogs',
  authDomain: 'demo-bulldogs.firebaseapp.com'
} : {
  apiKey: 'AIzaSyBWjRVfwZigHdVyk-GHVDc5ym0b0oz2NgI',
  authDomain: 'odense-bulldogs.firebaseapp.com',
  projectId: 'odense-bulldogs',
  storageBucket: 'odense-bulldogs.firebasestorage.app',
  messagingSenderId: '690774436680',
  appId: '1:690774436680:web:bc06a95977b1828d59a17d'
});

const auth = getAuth(app);
const db = getFirestore(app);
if (useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8081);
}

export async function staffUser() {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;

  const membership = await readDocument('staff', user.uid);
  if (membership?.role !== 'staff') {
    throw Object.assign(new Error('Kontoen har ikke personaleadgang.'), { code: 'staff-required' });
  }
  return user;
}

export async function login(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
  try {
    await staffUser();
  } catch (error) {
    await logout();
    throw error;
  }
}

export function logout() {
  return signOut(auth);
}

export async function changePassword(user, current, replacement) {
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
  await updatePassword(user, replacement);
}

function documentData(snapshot) {
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
}

export async function readDocument(name, id) {
  return documentData(await getDoc(doc(db, name, id)));
}

export async function readCollection(name, roundId) {
  const source = collection(db, name);
  const snapshot = await getDocs(roundId ? query(source, where('round_id', '==', roundId)) : source);
  return snapshot.docs.map(documentData);
}

export async function readLeaderboard(roundId) {
  const entries = collection(db, 'public_rounds', roundId, 'leaderboard');
  return (await getDocs(query(entries, orderBy('rank'), limit(5)))).docs.map(documentData);
}

export async function changeRound(id, version, action, fields = {}) {
  const ref = doc(db, 'rounds', id);
  return runTransaction(db, async transaction => {
    const current = documentData(await transaction.get(ref));
    const stamp = serverTimestamp();

    if (!current && version === null && action === 'configure') {
      transaction.set(ref, {
        ...fields,
        status: 'draft', scheduled_at: null, started_at: null, ended_at: null,
        created_at: stamp, updated_at: stamp, version: 1
      });
      return 1;
    }

    if (!current || current.version !== version) {
      throw new Error('Konkurrencen er ændret. Genindlæs siden, før du gemmer igen.');
    }

    const editable = ['draft', 'scheduled'].includes(current.status);
    let changes;
    if (action === 'configure' && editable) {
      changes = fields;
    } else if (action === 'schedule' && editable) {
      changes = { status: 'scheduled', scheduled_at: Timestamp.fromMillis(fields.startMs), duration: fields.duration };
    } else if (action === 'start' && editable) {
      changes = { status: 'live', started_at: stamp, duration: fields.duration ?? current.duration };
    } else if (action === 'cancel' && editable) {
      changes = { status: 'cancelled' };
    } else if (action === 'finish' && current.status === 'live') {
      changes = { status: 'final', ended_at: stamp };
    } else {
      throw new Error('Handlingen er ikke tilgængelig i konkurrencens nuværende status.');
    }

    transaction.update(ref, { ...changes, updated_at: stamp, version: version + 1 });
    return version + 1;
  });
}
