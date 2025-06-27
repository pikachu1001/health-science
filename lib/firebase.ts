import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getMessaging, Messaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import { enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Only initialize Firebase on the client side
let app: FirebaseApp | undefined;
let auth: Auth | null = null;
let db: Firestore | null = null;
let messaging: Messaging | null = null;

if (typeof window !== 'undefined') {
  // Client-side only
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Enable Firestore offline persistence
    if (db) {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
          console.error('Firestore persistence error:', err);
        }
      });
    }
    // Initialize FCM if supported
    isMessagingSupported().then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    });
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    auth = null;
    db = null;
    messaging = null;
  }
}

// Export auth, db, and messaging with proper typing
export { auth, db, messaging };
export default app; 