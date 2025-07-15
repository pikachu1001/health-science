const { adminAuth, adminDb } = require('../lib/firebase-admin');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const createAdmin = async () => {

    const email = await new Promise((resolve) => {
        rl.question('Enter admin email: ', resolve);
    });

    const password = await new Promise((resolve) => {
        rl.question('Enter admin password: ', resolve);
    });


    try {
        // Create the user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            emailVerified: true,
            disabled: false,
        });
        // Set the custom claim for the 'admin' role
        await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'admin' });
        // Also, create a user document in Firestore
        await adminDb.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userRecord.email,
            role: 'admin',
            createdAt: new Date(),
        });
    } catch (error) {
        const err = error as any;
        console.error('Error creating admin user:', err.message);
        if (err.code === 'auth/email-already-exists') {
            console.error('This email address is already in use by another account.');
        }
    } finally {
        rl.close();
    }
};

createAdmin(); 