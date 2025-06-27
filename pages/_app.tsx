import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';
import { useEffect } from 'react';
import { messaging, db } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';


export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !messaging) return;
    // Register service worker for FCM
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        // Request notification permission
        Notification.requestPermission().then(async (permission) => {
          if (permission === 'granted' && messaging) {
            try {
              const fcmToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration,
              });
              // Save token to Firestore if user is logged in
              const user = JSON.parse(localStorage.getItem('firebaseUser') || 'null');
              if (user && user.uid && db) {
                await setDoc(doc(db, 'users', user.uid), { fcmToken }, { merge: true });
              }
            } catch (err) {
              console.error('FCM token error:', err);
            }
          }
        });
      });
    // Handle foreground messages
    if (messaging) {
      onMessage(messaging, (payload) => {
        alert(payload.notification?.title + '\n' + payload.notification?.body);
      });
    }
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
} 