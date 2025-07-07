import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { UserProfile } from '../lib/firestore-types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, role: "patient" | "clinic", details?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  userData: UserProfile | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth is not initialized');
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        setUserData(docSnap.exists() ? docSnap.data() as UserProfile : null);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, role: "patient" | "clinic", details: any = {}) => {
    if (!auth) {
      throw new Error('Firebase auth is not initialized');
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const db = getFirestore();

    const userProfileData = {
      uid: user.uid,
      email: user.email!,
      role,
      createdAt: serverTimestamp(),
      ...details
    };

    await setDoc(doc(db, "users", user.uid), userProfileData);

    if (role === 'patient') {
      await setDoc(doc(db, "patients", user.uid), {
        userId: user.uid,
        ...userProfileData,
        clinicId: details.clinicId || 'unassigned',
      });
    } else if (role === 'clinic') {
      await setDoc(doc(db, "clinics", user.uid), {
        clinicId: user.uid,
        ...userProfileData,
        baseFeeStatus: 'pending',
      });
    }

    // --- Post-signup check: Wait for user doc to exist ---
    let retries = 0;
    const maxRetries = 5;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    while (retries < maxRetries) {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        break;
      }
      await delay(300); // wait 300ms before retry
      retries++;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase auth is not initialized');
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (!auth) {
      throw new Error('Firebase auth is not initialized');
    }
    
    try {
      // Clear Firebase auth
      await signOut(auth);
      
      // Clear any stored user data
      if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.removeItem('firebaseUser');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('clinicToken');
        localStorage.removeItem('patientToken');
        localStorage.removeItem('pendingPlanId');
        
        // Clear sessionStorage
        sessionStorage.removeItem('adminData');
        sessionStorage.removeItem('clinicData');
        sessionStorage.removeItem('patientData');
        sessionStorage.removeItem('userData');
        
        // Clear any other potential auth-related items
        localStorage.removeItem('authUser');
        sessionStorage.removeItem('authUser');
      }
      
      // Clear local state
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if Firebase logout fails, clear local state
      setUser(null);
      setUserData(null);
      
      // Clear storage anyway
      if (typeof window !== 'undefined') {
        localStorage.removeItem('firebaseUser');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('clinicToken');
        localStorage.removeItem('patientToken');
        localStorage.removeItem('pendingPlanId');
        sessionStorage.removeItem('adminData');
        sessionStorage.removeItem('clinicData');
        sessionStorage.removeItem('patientData');
        sessionStorage.removeItem('userData');
        localStorage.removeItem('authUser');
        sessionStorage.removeItem('authUser');
      }
      
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    userData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 