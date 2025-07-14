import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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

// Function to create activity feed entry
export async function createActivityFeedEntry(data: {
  type: 'new_signup' | 'payment_success' | 'payment_failed' | 'base_fee_paid' | 'subscription_cancelled';
  userId: string;
  clinicId: string;
  message: string;
  details?: {
    plan?: string;
    planId?: string;
    amount?: number;
    patientName?: string;
    patientId?: string;
    clinicName?: string;
    clinicId?: string;
  };
}) {
  try {
    const db = getFirestore();
    const activityRef = doc(db, 'activity_feed');
    await setDoc(activityRef, {
      activityId: activityRef.id,
      type: data.type,
      userId: data.userId,
      clinicId: data.clinicId,
      message: data.message,
      timestamp: serverTimestamp(),
      details: data.details || {},
    });
    console.log(`Activity feed entry created: ${data.message}`);
  } catch (error) {
    console.error('Error creating activity feed entry:', error);
  }
}

// Function to create user registration activity
export async function createUserRegistrationActivity(userId: string, role: 'patient' | 'clinic', userDetails: any) {
  try {
    const db = getFirestore();
    
    if (role === 'patient') {
      const patientName = userDetails.firstName && userDetails.lastName 
        ? `${userDetails.lastName}${userDetails.firstName}` 
        : 'Unknown Patient';
      
      await createActivityFeedEntry({
        type: 'new_signup',
        userId: userId,
        clinicId: userDetails.clinicId || 'unassigned',
        message: `${patientName}が新規患者として登録しました。`,
        details: {
          patientName: patientName,
          patientId: userId,
          clinicId: userDetails.clinicId || 'unassigned'
        }
      });
    } else if (role === 'clinic') {
      const clinicName = userDetails.clinicName || 'Unknown Clinic';
      
      await createActivityFeedEntry({
        type: 'new_signup',
        userId: userId,
        clinicId: userId,
        message: `${clinicName}が新規クリニックとして登録しました。`,
        details: {
          clinicName: clinicName,
          clinicId: userId
        }
      });
    }
  } catch (error) {
    console.error('Error creating user registration activity:', error);
  }
} 