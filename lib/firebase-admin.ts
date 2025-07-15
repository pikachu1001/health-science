import * as admin from 'firebase-admin';

// Ensure the service account key is available
try {

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            }),
        });
    }
} catch (error) {
    console.error(
        'Firebase Admin SDK initialization failed. Make sure "service-account-key.json" is in the project root.'
    );
    // We don't throw the error here, but the app won't have DB access.
    // The functions below will fail gracefully if admin isn't initialized.
}

if (!(global as any)._adminAuth) {
    (global as any)._adminAuth = admin.apps.length ? admin.auth() : null;
}
if (!(global as any)._adminDb) {
    (global as any)._adminDb = admin.apps.length ? admin.firestore() : null;
}

const db = admin.firestore();
export { db };

module.exports = {
    adminAuth: (global as any)._adminAuth,
    adminDb: (global as any)._adminDb,
}; 