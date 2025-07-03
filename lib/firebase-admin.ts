const admin = require('firebase-admin');

// Ensure the service account key is available
try {
    const serviceAccount = require('../config/service-account-key.json');

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

if (!(global as any)._adminAuth) {
    (global as any)._adminAuth = admin.apps.length ? admin.auth() : null;
}
if (!(global as any)._adminDb) {
    (global as any)._adminDb = admin.apps.length ? admin.firestore() : null;
}

module.exports = {
    adminAuth: (global as any)._adminAuth,
    adminDb: (global as any)._adminDb,
}; 