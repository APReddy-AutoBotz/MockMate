import * as admin from 'firebase-admin';

// Initialize with Application Default Credentials
// In local dev, set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
// In Cloud Run, it uses the service account automatically.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const Timestamp = admin.firestore.Timestamp;
export default admin;