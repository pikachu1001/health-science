import { getFirestore, doc, getDoc } from 'firebase/firestore';

/**
 * Fetches a Firestore user profile with retries to avoid race conditions after login.
 * @param uid Firebase Auth UID
 * @param maxRetries Number of retries (default 5)
 * @param delayMs Delay between retries in ms (default 300)
 * @returns User profile data
 * @throws Error if profile is not found after retries
 */
export async function fetchUserProfileWithRetry(uid: string, maxRetries = 5, delayMs = 100): Promise<any> {
    const db = getFirestore();
    let retries = 0;
    while (retries < maxRetries) {
        console.log('fetchUserProfileWithRetry', uid, maxRetries, delayMs, 'try', retries + 1);
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) return userDoc.data();
        } catch (err) {
            console.error('getDoc error:', err);
            // Optionally log the error, but continue retrying
            console.warn('getDoc error, will retry:', err);
        }
        await new Promise(res => setTimeout(res, delayMs));
        retries++;
    }
    throw new Error('ユーザープロファイルが見つかりません。しばらくしてから再度お試しください。');
} 