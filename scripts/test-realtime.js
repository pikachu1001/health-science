const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addTestData() {
  console.log('🚀 Adding test data for real-time dashboard...');
  
  const testClinicId = 'test-clinic-123';
  const now = admin.firestore.Timestamp.now();
  
  try {
    // Add test appointments
    const appointments = [
      {
        clinicId: testClinicId,
        patientName: '田中太郎',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        type: '一般診察',
        status: 'scheduled',
        provider: 'Dr. 佐藤',
        createdAt: now,
      },
      {
        clinicId: testClinicId,
        patientName: '山田花子',
        date: new Date().toISOString().split('T')[0],
        time: '11:30',
        type: '定期検診',
        status: 'scheduled',
        provider: 'Dr. 鈴木',
        createdAt: now,
      }
    ];

    for (const appointment of appointments) {
      await db.collection('appointments').add(appointment);
      console.log(`✅ Added appointment for ${appointment.patientName}`);
    }

    // Add test patients
    const patients = [
      {
        clinicId: testClinicId,
        name: '田中太郎',
        lastVisit: '2024-03-15',
        nextAppointment: '2024-03-20',
        medicalHistory: ['定期検診', '血液検査'],
        insuranceProvider: '健康保険組合',
        subscriptionPlan: 'Plan A',
        totalEarnings: 350000,
        createdAt: now,
      },
      {
        clinicId: testClinicId,
        name: '山田花子',
        lastVisit: '2024-03-18',
        nextAppointment: '2024-03-20',
        medicalHistory: ['診察', 'レントゲン'],
        insuranceProvider: 'メディシールド',
        subscriptionPlan: 'Plan B',
        totalEarnings: 350000,
        createdAt: now,
      }
    ];

    for (const patient of patients) {
      await db.collection('patients').add(patient);
      console.log(`✅ Added patient ${patient.name}`);
    }

    // Add test insurance claims
    const claims = [
      {
        clinicId: testClinicId,
        patientName: '田中太郎',
        insuranceProvider: '健康保険組合',
        policyNumber: 'HCP-123456',
        treatmentDate: '2024-03-15',
        treatmentType: '一般診察',
        amount: 15000,
        status: 'pending',
        submissionDate: '2024-03-16',
        notes: '定期検診の保険請求',
        createdAt: now,
      }
    ];

    for (const claim of claims) {
      await db.collection('insuranceClaims').add(claim);
      console.log(`✅ Added insurance claim for ${claim.patientName}`);
    }

    // Add test subscriptions
    const subscriptions = [
      {
        clinicId: testClinicId,
        patientId: 'patient-1',
        status: 'active',
        plan: 'Plan A',
        createdAt: now,
      },
      {
        clinicId: testClinicId,
        patientId: 'patient-2',
        status: 'active',
        plan: 'Plan B',
        createdAt: now,
      }
    ];

    for (const subscription of subscriptions) {
      await db.collection('subscriptions').add(subscription);
      console.log(`✅ Added subscription for patient ${subscription.patientId}`);
    }

    // Add test activity logs
    const activities = [
      {
        clinicId: testClinicId,
        type: 'appointment_created',
        description: '田中太郎さんの予約が作成されました',
        timestamp: now,
        userId: 'user-1',
        userName: 'Dr. 佐藤',
      },
      {
        clinicId: testClinicId,
        type: 'patient_registered',
        description: '山田花子さんが新規登録されました',
        timestamp: now,
        userId: 'user-2',
        userName: 'Dr. 鈴木',
      },
      {
        clinicId: testClinicId,
        type: 'claim_submitted',
        description: '田中太郎さんの保険請求が提出されました',
        timestamp: now,
        userId: 'user-1',
        userName: 'Dr. 佐藤',
      }
    ];

    for (const activity of activities) {
      await db.collection('activityLogs').add(activity);
      console.log(`✅ Added activity: ${activity.description}`);
    }

    console.log('\n🎉 Test data added successfully!');
    console.log(`📊 Dashboard should now show real-time updates for clinic ID: ${testClinicId}`);
    console.log('\n📝 To test the real-time functionality:');
    console.log('1. Open the clinic dashboard');
    console.log('2. Look for the "ライブ更新中" indicator');
    console.log('3. Add more data using this script to see live updates');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  const testClinicId = 'test-clinic-123';
  const collections = ['appointments', 'patients', 'insuranceClaims', 'subscriptions', 'activityLogs'];
  
  try {
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName)
        .where('clinicId', '==', testClinicId)
        .get();
      
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ Cleaned up ${snapshot.size} documents from ${collectionName}`);
    }
    
    console.log('🎉 Test data cleaned up successfully!');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'add') {
  addTestData();
} else if (command === 'cleanup') {
  cleanupTestData();
} else {
  console.log('Usage:');
  console.log('  node test-realtime.js add     - Add test data');
  console.log('  node test-realtime.js cleanup - Remove test data');
} 