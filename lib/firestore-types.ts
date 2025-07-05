import { Timestamp } from 'firebase/firestore';

// Base user data stored in 'users' collection
export interface UserProfile {
  uid: string;
  email: string;
  role: 'patient' | 'clinic' | 'admin';
  createdAt: Timestamp;
}

// User (all roles)
export interface User {
  uid: string;
  role: 'patient' | 'clinic' | 'admin';
  email: string;
  displayName: string;
  createdAt: any; // Firestore Timestamp
  clinicId?: string; // for patients
  profile?: {
    phone?: string;
    address?: string;
  };
}

// Data for a patient, stored in 'patients' collection
export interface Patient {
  patientId: string;
  userId: string;
  clinicId: string;
  subscriptionId?: string;
  plan?: string;
  status: 'active' | 'cancelled' | 'suspended' | 'pending';
  joinedAt: any; // Firestore Timestamp
}

// Data for a clinic, stored in 'clinics' collection
export interface Clinic {
  clinicId: string;
  name: string;
  email: string;
  baseFeeStatus: '有効' | '未払い' | '停止中' | '保留中';
  referredPatients: string[];
  commissionEarned: number;
  createdAt: any; // Firestore Timestamp
}

// Data for a subscription, stored in 'subscriptions' collection
export interface Subscription {
  subscriptionId: string;
  patientId: string;
  clinicId: string;
  plan: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'cancelled' | 'past_due';
  amount: number;
  clinicCommission: number;
  adminRevenue: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// Activity Feed
export interface ActivityFeed {
  activityId: string;
  type: 'new_signup' | 'payment_success' | 'payment_failed';
  userId: string;
  clinicId: string;
  message: string;
  timestamp: any; // Firestore Timestamp
  details?: {
    plan?: string;
    amount?: number;
  };
} 