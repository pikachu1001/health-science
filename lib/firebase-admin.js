const admin = require('firebase-admin');

// Ensure the service account key is available
try {
    const serviceAccount = require('../service-account-key.json');

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK Initialized.');
    }
} catch (error) {
    console.error(
        'Firebase Admin SDK initialization failed. Make sure "service-account-key.json" is in the project root.'
    );
    // We don't throw the error here, but the app won't have DB access.
    // The functions below will fail gracefully if admin isn't initialized.
}

// Export auth and firestore instances, checking if initialization was successful
const adminAuth = admin.apps.length ? admin.auth() : null;
const adminDb = admin.apps.length ? admin.firestore() : null;

module.exports = { adminAuth, adminDb }; 