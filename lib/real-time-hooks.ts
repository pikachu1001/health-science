import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
  getFirestore
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  User, 
  Patient, 
  Clinic, 
  Subscription, 
  ActivityFeed 
} from './firestore-types';
import { useAuth } from '../contexts/AuthContext';

// Hook for real-time user data
export const useUserData = (userId: string) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !userId || userId === '' || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (doc) => {
        if (doc.exists()) {
          setUserData({ uid: doc.id, ...doc.data() } as User);
        } else {
          setError('User not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user data:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userId]);

  return { userData, loading, error };
};

// Hook for real-time patient data
export const usePatientData = (patientId: string) => {
  const { user } = useAuth();
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !patientId || patientId === '' || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'patients', patientId),
      (doc) => {
        if (doc.exists()) {
          setPatientData({ patientId: doc.id, ...doc.data() } as Patient);
        } else {
          setError('Patient not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching patient data:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, patientId]);

  return { patientData, loading, error };
};

// Hook for real-time clinic data
export const useClinicData = (clinicId: string) => {
  const { user } = useAuth();
  const [clinicData, setClinicData] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !clinicId || clinicId === '' || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'clinics', clinicId),
      (doc) => {
        if (doc.exists()) {
          setClinicData({ clinicId: doc.id, ...doc.data() } as Clinic);
        } else {
          setError('Clinic not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching clinic data:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, clinicId]);

  return { clinicData, loading, error };
};

// Hook for real-time subscription data
export const useSubscriptionData = (subscriptionId: string) => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !subscriptionId || subscriptionId === '' || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'subscriptions', subscriptionId),
      (doc) => {
        if (doc.exists()) {
          setSubscriptionData({ subscriptionId: doc.id, ...doc.data() } as Subscription);
        } else {
          setError('Subscription not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching subscription data:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, subscriptionId]);

  return { subscriptionData, loading, error };
};

// Hook for real-time activity feed
export const useActivityFeed = (clinicId?: string, limitCount: number = 10) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    let q;
    
    if (clinicId) {
      // Filter by clinic
      q = query(
        collection(db, 'activity_feed'),
        where('clinicId', '==', clinicId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    } else {
      // Get all activities (for admin)
      q = query(
        collection(db, 'activity_feed'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activitiesData = snapshot.docs.map(doc => ({
          activityId: doc.id,
          ...doc.data()
        })) as ActivityFeed[];
        setActivities(activitiesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching activity feed:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, clinicId, limitCount]);

  return { activities, loading, error };
};

// Hook for real-time new patient signups (for clinics and admin)
export const useNewSignups = (clinicId?: string, limitCount: number = 5) => {
  const { user } = useAuth();
  const [newSignups, setNewSignups] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      return;
    }

    let q;
    
    if (clinicId) {
      // Filter by clinic
      q = query(
        collection(db, 'patients'),
        where('clinicId', '==', clinicId),
        orderBy('joinedAt', 'desc'),
        limit(limitCount)
      );
    } else {
      // Get all new signups (for admin)
      q = query(
        collection(db, 'patients'),
        orderBy('joinedAt', 'desc'),
        limit(limitCount)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const signupsData = snapshot.docs.map(doc => ({
          patientId: doc.id,
          ...doc.data()
        })) as Patient[];
        setNewSignups(signupsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching new signups:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, clinicId, limitCount]);

  return { newSignups, loading, error };
};

// Hook for real-time subscription status changes
export const useSubscriptionStatus = (clinicId?: string) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    let q;
    
    if (clinicId) {
      // Filter by clinic
      q = query(
        collection(db, 'subscriptions'),
        where('clinicId', '==', clinicId),
        orderBy('updatedAt', 'desc')
      );
    } else {
      // Get all subscriptions (for admin)
      q = query(
        collection(db, 'subscriptions'),
        orderBy('updatedAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const subscriptionsData = snapshot.docs.map(doc => ({
          subscriptionId: doc.id,
          ...doc.data()
        })) as Subscription[];
        setSubscriptions(subscriptionsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching subscriptions:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId]);

  return { subscriptions, loading, error };
};

// Hook for real-time system stats (admin only)
export const useSystemStats = () => {
  const [stats, setStats] = useState({
    totalClinics: 0,
    totalPatients: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    pendingInsuranceClaims: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    // Listen to multiple collections for real-time stats
    const clinicsUnsubscribe = onSnapshot(
      collection(db, 'clinics'),
      (snapshot) => {
        const totalClinics = snapshot.size;
        setStats(prev => ({ ...prev, totalClinics }));
      },
      (error) => {
        console.error('Error fetching clinics:', error);
        setError(error.message);
      }
    );

    const patientsUnsubscribe = onSnapshot(
      collection(db, 'patients'),
      (snapshot) => {
        const totalPatients = snapshot.size;
        setStats(prev => ({ ...prev, totalPatients }));
      },
      (error) => {
        console.error('Error fetching patients:', error);
        setError(error.message);
      }
    );

    const subscriptionsUnsubscribe = onSnapshot(
      query(collection(db, 'subscriptions'), where('status', '==', 'active')),
      (snapshot) => {
        const activeSubscriptions = snapshot.size;
        const totalRevenue = snapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);
        setStats(prev => ({ 
          ...prev, 
          activeSubscriptions,
          totalRevenue 
        }));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching subscriptions:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      clinicsUnsubscribe();
      patientsUnsubscribe();
      subscriptionsUnsubscribe();
    };
  }, []);

  return { stats, loading, error };
};

// Hook for real-time clinic stats
export const useClinicStats = (clinicId: string) => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeSubscriptions: 0,
    commissionEarned: 0,
    baseFeeStatus: 'unpaid' as 'active' | 'unpaid' | 'suspended',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId || !db) {
      setLoading(false);
      return;
    }

    // Listen to clinic data
    const clinicUnsubscribe = onSnapshot(
      doc(db, 'clinics', clinicId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setStats(prev => ({
            ...prev,
            commissionEarned: data.commissionEarned || 0,
            baseFeeStatus: data.baseFeeStatus || 'unpaid',
          }));
        }
      },
      (error) => {
        console.error('Error fetching clinic data:', error);
        setError(error.message);
      }
    );

    // Listen to patients for this clinic
    const patientsUnsubscribe = onSnapshot(
      query(collection(db, 'patients'), where('clinicId', '==', clinicId)),
      (snapshot) => {
        const totalPatients = snapshot.size;
        setStats(prev => ({ ...prev, totalPatients }));
      },
      (error) => {
        console.error('Error fetching patients:', error);
        setError(error.message);
      }
    );

    // Listen to active subscriptions for this clinic
    const subscriptionsUnsubscribe = onSnapshot(
      query(
        collection(db, 'subscriptions'), 
        where('clinicId', '==', clinicId),
        where('status', '==', 'active')
      ),
      (snapshot) => {
        const activeSubscriptions = snapshot.size;
        setStats(prev => ({ ...prev, activeSubscriptions }));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching subscriptions:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      clinicUnsubscribe();
      patientsUnsubscribe();
      subscriptionsUnsubscribe();
    };
  }, [clinicId]);

  return { stats, loading, error };
};

// Types for clinic dashboard data
export interface RealTimeAppointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  provider: string;
  createdAt: Date;
}

export interface RealTimePatient {
  id: string;
  name: string;
  lastVisit: string;
  nextAppointment: string;
  medicalHistory: string[];
  insuranceProvider: string;
  subscriptionPlan: string;
  totalEarnings: number;
  createdAt: Date;
}

export interface RealTimeInsuranceClaim {
  id: string;
  patientName: string;
  insuranceProvider: string;
  policyNumber: string;
  treatmentDate: string;
  treatmentType: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submissionDate: string;
  notes?: string;
  createdAt: Date;
}

export interface ClinicStats {
  totalPatients: number;
  appointmentsToday: number;
  pendingAppointments: number;
  revenueThisMonth: number;
  activeSubscriptions: number;
  insuranceClaimsPending: number;
  lastUpdated: Date;
}

// Real-time hook for clinic appointments
export function useClinicAppointments(clinicId: string, limitCount: number = 10) {
  const [appointments, setAppointments] = useState<RealTimeAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('clinicId', '==', clinicId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const appointmentsData: RealTimeAppointment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          appointmentsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as RealTimeAppointment);
        });
        setAppointments(appointmentsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching appointments:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId, limitCount]);

  return { appointments, loading, error };
}

// Real-time hook for clinic patients
export function useClinicPatients(clinicId: string, limitCount: number = 10) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<RealTimePatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !clinicId) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const patientsRef = collection(db, 'patients');
    const q = query(
      patientsRef,
      where('clinicId', '==', clinicId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const patientsData: RealTimePatient[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          patientsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as RealTimePatient);
        });
        setPatients(patientsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching patients:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, clinicId, limitCount]);

  return { patients, loading, error };
}

// Real-time hook for clinic insurance claims
export function useClinicInsuranceClaims(clinicId: string, limitCount: number = 10) {
  const [claims, setClaims] = useState<RealTimeInsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const claimsRef = collection(db, 'insuranceClaims');
    const q = query(
      claimsRef,
      where('clinicId', '==', clinicId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const claimsData: RealTimeInsuranceClaim[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          claimsData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as RealTimeInsuranceClaim);
        });
        setClaims(claimsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching insurance claims:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId, limitCount]);

  return { claims, loading, error };
}

// Real-time hook for clinic statistics
export function useClinicDashboardStats(clinicId: string) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ClinicStats>({
    totalPatients: 0,
    appointmentsToday: 0,
    pendingAppointments: 0,
    revenueThisMonth: 0,
    activeSubscriptions: 0,
    insuranceClaimsPending: 0,
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !clinicId) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    
    // Listen to multiple collections to calculate stats
    const patientsRef = collection(db, 'patients');
    const appointmentsRef = collection(db, 'appointments');
    const subscriptionsRef = collection(db, 'subscriptions');
    const claimsRef = collection(db, 'insuranceClaims');

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Create queries for different stats
    const patientsQuery = query(patientsRef, where('clinicId', '==', clinicId));
    const appointmentsTodayQuery = query(
      appointmentsRef,
      where('clinicId', '==', clinicId),
      where('date', '==', today.toISOString().split('T')[0])
    );
    const pendingAppointmentsQuery = query(
      appointmentsRef,
      where('clinicId', '==', clinicId),
      where('status', '==', 'scheduled')
    );
    const activeSubscriptionsQuery = query(
      subscriptionsRef,
      where('clinicId', '==', clinicId),
      where('status', '==', 'active')
    );
    const pendingClaimsQuery = query(
      claimsRef,
      where('clinicId', '==', clinicId),
      where('status', '==', 'pending')
    );

    // Set up listeners for each stat
    const unsubscribers: (() => void)[] = [];

    // Patients count
    unsubscribers.push(
      onSnapshot(patientsQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          totalPatients: snapshot.size,
          lastUpdated: new Date(),
        }));
      })
    );

    // Appointments today
    unsubscribers.push(
      onSnapshot(appointmentsTodayQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          appointmentsToday: snapshot.size,
          lastUpdated: new Date(),
        }));
      })
    );

    // Pending appointments
    unsubscribers.push(
      onSnapshot(pendingAppointmentsQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          pendingAppointments: snapshot.size,
          lastUpdated: new Date(),
        }));
      })
    );

    // Active subscriptions
    unsubscribers.push(
      onSnapshot(activeSubscriptionsQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          activeSubscriptions: snapshot.size,
          lastUpdated: new Date(),
        }));
      })
    );

    // Pending insurance claims
    unsubscribers.push(
      onSnapshot(pendingClaimsQuery, (snapshot) => {
        setStats(prev => ({
          ...prev,
          insuranceClaimsPending: snapshot.size,
          lastUpdated: new Date(),
        }));
      })
    );

    // Calculate revenue (this would need to be implemented based on your data structure)
    // For now, we'll use a placeholder
    // setStats(prev => ({
    //   ...prev,
    //   revenueThisMonth: 250000, // This should be calculated from actual data
    //   lastUpdated: new Date(),
    // }));

    // Real calculation for revenueThisMonth
    const unsubscribeRevenue = onSnapshot(
      query(
        subscriptionsRef,
        where('clinicId', '==', clinicId),
        where('status', '==', 'active'),
        where('startDate', '>=', startOfMonth),
        where('startDate', '<=', endOfMonth)
      ),
      (snapshot) => {
        let totalRevenue = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Assume each subscription has a 'price' field (number, in JPY)
          if (typeof data.price === 'number') {
            totalRevenue += data.price;
          }
        });
        setStats(prev => ({
          ...prev,
          revenueThisMonth: totalRevenue,
          lastUpdated: new Date(),
        }));
      }
    );
    unsubscribers.push(unsubscribeRevenue);

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user, clinicId]);

  return { stats, loading, error };
}

// Activity log interface and hook
export interface ActivityLog {
  id: string;
  type: 'appointment_created' | 'appointment_cancelled' | 'patient_registered' | 'claim_submitted' | 'payment_received';
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

export function useClinicActivityLog(clinicId: string, limitCount: number = 20) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    const activitiesRef = collection(db, 'activityLogs');
    const q = query(
      activitiesRef,
      where('clinicId', '==', clinicId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activitiesData: ActivityLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          activitiesData.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
          } as ActivityLog);
        });
        setActivities(activitiesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching activity log:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId, limitCount]);

  return { activities, loading, error };
}

// Real-time hook for all clinics (admin dashboard)
export function useAllClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(
      collection(db, 'clinics'),
      (snapshot) => {
        const clinicsData = snapshot.docs.map(doc => ({
          clinicId: doc.id,
          ...doc.data()
        })) as Clinic[];
        setClinics(clinicsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching clinics:', error);
        setError(error.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { clinics, loading, error };
}

// Real-time hook for patient appointments
export function usePatientAppointments(patientId: string, limitCount: number = 10) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId || !db) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [patientId, limitCount]);
  return { appointments, loading, error };
}

// Real-time hook for patient health records
export function usePatientHealthRecords(patientId: string, limitCount: number = 10) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId || !db) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'healthRecords'),
      where('patientId', '==', patientId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecords(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [patientId, limitCount]);
  return { records, loading, error };
}

// Real-time hook for patient messages
export function usePatientMessages(patientId: string, limitCount: number = 10) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId || !db) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'messages'),
      where('recipient', '==', patientId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [patientId, limitCount]);
  return { messages, loading, error };
} 