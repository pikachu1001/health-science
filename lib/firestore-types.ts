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
  clinicName: string;
  email: string;
  baseFeeStatus: '有効' | '未払い' | '停止中' | '保留中';
  referredPatients: string[];
  commissionEarned: number;
  createdAt: any; // Firestore Timestamp
}

// Data for a subscription, stored in 'subscriptions' collection
export interface Subscription {
  subscriptionId?: string; // Firestore doc ID (optional, as Firestore provides this)
  patientId: string;           // Reference to user
  clinicId: string;            // Reference to clinic
  planId: string;              // Reference to subscriptionPlans
  planSnapshot?: {
    name: string;
    price: number;
    commission: number;
    companyCut: number;
  };                           // (optional) Copy of plan details at time of signup
  status: 'active' | 'canceled' | 'past_due';
  stripeSubscriptionId: string; // Stripe subscription ID
  startDate: any;               // Firestore Timestamp
  endDate?: any;                // Firestore Timestamp or null if ongoing
  lastPaymentDate?: any;        // Firestore Timestamp
  nextPaymentDate?: any;        // Firestore Timestamp
  canceledAt?: any;             // Firestore Timestamp or null if not canceled
  createdAt: any;               // Firestore Timestamp
  updatedAt: any;               // Firestore Timestamp
}

export interface SubscriptionPlan {
  id: string;                   // Firestore doc ID or custom (A/B/C)
  name: string;
  price: number;
  commission: number;           // Amount to clinic
  companyCut: number;           // Amount to company
  description: string;
  features: string[];
  priceId: string;              // Stripe Price ID
  status: 'active' | 'inactive';
  billingCycle: 'monthly' | 'yearly';
  maxAppointments?: number;
  maxPrescriptions?: number;
  maxLabTests?: number;
  createdAt: any;               // Firestore Timestamp
  updatedAt: any;               // Firestore Timestamp
}

// Activity Feed
export interface ActivityFeed {
  activityId: string;
  type: 'new_signup' | 'payment_success' | 'payment_failed' | 'base_fee_paid' | 'subscription_cancelled';
  userId: string;
  clinicId: string;
  message: string;
  timestamp: any; // Firestore Timestamp
  details?: {
    plan?: string;
    planId?: string;
    amount?: number;
    patientName?: string;
    patientId?: string;
    clinicName?: string;
    clinicId?: string;
  };
} 