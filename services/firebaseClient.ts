
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  Auth, 
  createUserWithEmailAndPassword as firebaseCreateUser, 
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthChanged,
  User,
  AuthError
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const getEnvVar = (name: string): string => {
  const baseName = name.replace(/^VITE_/, '').replace(/^FIREBASE_/, '');
  const searchPatterns = [name, `VITE_FIREBASE_${baseName}`, `FIREBASE_${baseName}`, baseName, name.toLowerCase(), name.toUpperCase()];
  const findInObject = (obj: any, targetKey: string) => {
    if (!obj || typeof obj !== 'object') return null;
    if (obj[targetKey]) return obj[targetKey];
    const upperTarget = targetKey.toUpperCase();
    const foundKey = Object.keys(obj).find(k => k.toUpperCase() === upperTarget);
    return foundKey ? obj[foundKey] : null;
  };
  for (const key of searchPatterns) {
    try {
      const val = findInObject(process?.env, key) || findInObject((import.meta as any)?.env, key) || findInObject(window, key);
      if (val) return String(val);
    } catch (e) {}
  }
  return '';
};

const apiKey = getEnvVar('VITE_FIREBASE_API_KEY');
const projectId = getEnvVar('VITE_FIREBASE_PROJECT_ID');

// Determine if we have a valid Firebase configuration.
// We exclude keys that look like Gemini keys (starting with AIzaSyA) to prevent auth errors.
const isFirebaseConfigured = !!apiKey && !!projectId && !apiKey.startsWith('AIzaSyA');

let app: FirebaseApp | null = null;
let realAuth: Auth | null = null;
let realDb: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp({
      apiKey,
      projectId,
      authDomain: `${projectId}.firebaseapp.com`,
      storageBucket: `${projectId}.appspot.com`,
    });
    realAuth = getAuth(app);
    realDb = getFirestore(app);
  } catch (e) {
    console.error("Firebase init failed even with config:", e);
  }
}

// --- MOCK AUTH IMPLEMENTATION ---
const MOCK_USER_KEY = 'mockmate_mock_users';
const MOCK_SESSION_KEY = 'mockmate_current_user';

const getMockUsers = () => JSON.parse(localStorage.getItem(MOCK_USER_KEY) || '{}');
const setMockUsers = (users: any) => localStorage.setItem(MOCK_USER_KEY, JSON.stringify(users));

// Subscribers for the mock auth state changes
const authSubscribers = new Set<(user: any) => void>();

const notifySubscribers = (user: any) => {
  authSubscribers.forEach(cb => cb(user));
};

export const mockAuth = {
  get currentUser() {
    try {
      return JSON.parse(localStorage.getItem(MOCK_SESSION_KEY) || 'null');
    } catch (e) {
      return null;
    }
  },
  isMock: true,
  onAuthStateChanged: (callback: (user: any) => void) => {
    authSubscribers.add(callback);
    // Trigger initial callback with current state
    callback(mockAuth.currentUser);
    // Return unsubscribe function
    return () => authSubscribers.delete(callback);
  }
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
  if (!isFirebaseConfigured) {
    const users = getMockUsers();
    const lowerEmail = email.toLowerCase().trim();
    if (users[lowerEmail]) {
      const error = new Error("Email already in use") as any;
      error.code = 'auth/email-already-in-use';
      throw error;
    }
    const newUser = { email: lowerEmail, uid: `mock_${Date.now()}`, displayName: email.split('@')[0] };
    users[lowerEmail] = { ...newUser, pass };
    setMockUsers(users);
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(newUser));
    notifySubscribers(newUser);
    return { user: newUser };
  }
  return firebaseCreateUser(authObj, email, pass);
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
  if (!isFirebaseConfigured) {
    const users = getMockUsers();
    const lowerEmail = email.toLowerCase().trim();
    const user = users[lowerEmail];
    if (!user || user.pass !== pass) {
      const error = new Error("Invalid credentials") as any;
      error.code = 'auth/invalid-credential';
      throw error;
    }
    const sessionUser = { email: user.email, uid: user.uid, displayName: user.displayName };
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(sessionUser));
    notifySubscribers(sessionUser);
    return { user: sessionUser };
  }
  return firebaseSignIn(authObj, email, pass);
};

export const signOut = async (authObj: any) => {
  if (!isFirebaseConfigured) {
    localStorage.removeItem(MOCK_SESSION_KEY);
    notifySubscribers(null);
    return;
  }
  return firebaseSignOut(authObj);
};

export const auth = realAuth || (mockAuth as unknown as Auth);
export const db = realDb || ({} as Firestore);
export const googleProvider = new GoogleAuthProvider();
export const isUsingMockAuth = !isFirebaseConfigured;
