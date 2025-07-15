const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../config/firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testActivityFeed() {
  
  const now = admin.firestore.Timestamp.now();
  
  try {
    // Test 1: Patient Registration Activity
    const patientActivity = {
      activityId: 'test-patient-reg-1',
      type: 'new_signup',
      userId: 'test-patient-123',
      clinicId: 'test-clinic-456',
      message: '田中太郎が新規患者として登録しました。',
      timestamp: now,
      details: {
        patientName: '田中太郎',
        patientId: 'test-patient-123',
        clinicName: '佐藤クリニック',
        clinicId: 'test-clinic-456'
      }
    };
    
    await db.collection('activity_feed').doc('test-patient-reg-1').set(patientActivity);
    
    // Test 2: Clinic Registration Activity
    const clinicActivity = {
      activityId: 'test-clinic-reg-1',
      type: 'new_signup',
      userId: 'test-clinic-456',
      clinicId: 'test-clinic-456',
      message: '佐藤クリニックが新規クリニックとして登録しました。',
      timestamp: now,
      details: {
        clinicName: '佐藤クリニック',
        clinicId: 'test-clinic-456'
      }
    };
    
    await db.collection('activity_feed').doc('test-clinic-reg-1').set(clinicActivity);
    
    // Test 3: Patient Subscription Signup
    const subscriptionActivity = {
      activityId: 'test-subscription-1',
      type: 'new_signup',
      userId: 'test-patient-123',
      clinicId: 'test-clinic-456',
      message: '田中太郎がプレミアムプランに登録しました。',
      timestamp: now,
      details: {
        plan: 'プレミアムプラン',
        planId: 'premium-plan-001',
        amount: 15000,
        patientName: '田中太郎',
        patientId: 'test-patient-123',
        clinicName: '佐藤クリニック',
        clinicId: 'test-clinic-456'
      }
    };
    
    await db.collection('activity_feed').doc('test-subscription-1').set(subscriptionActivity);
    
    // Test 4: Payment Failure
    const paymentFailureActivity = {
      activityId: 'test-payment-failure-1',
      type: 'payment_failed',
      userId: 'test-patient-789',
      clinicId: 'test-clinic-456',
      message: '山田花子のベーシックプラン支払いが失敗しました。リマインダーを送信しました。',
      timestamp: now,
      details: {
        plan: 'ベーシックプラン',
        planId: 'basic-plan-001',
        amount: 8000,
        patientName: '山田花子',
        patientId: 'test-patient-789',
        clinicName: '佐藤クリニック',
        clinicId: 'test-clinic-456'
      }
    };
    
    await db.collection('activity_feed').doc('test-payment-failure-1').set(paymentFailureActivity);
    
    // Test 5: Subscription Cancellation
    const cancellationActivity = {
      activityId: 'test-cancellation-1',
      type: 'subscription_cancelled',
      userId: 'test-patient-456',
      clinicId: 'test-clinic-456',
      message: '鈴木一郎のスタンダードプランがキャンセルされました。',
      timestamp: now,
      details: {
        plan: 'スタンダードプラン',
        planId: 'standard-plan-001',
        amount: 12000,
        patientName: '鈴木一郎',
        patientId: 'test-patient-456',
        clinicName: '佐藤クリニック',
        clinicId: 'test-clinic-456'
      }
    };
    
    await db.collection('activity_feed').doc('test-cancellation-1').set(cancellationActivity);
    
    // Test 6: Clinic Base Fee Payment
    const baseFeeActivity = {
      activityId: 'test-base-fee-1',
      type: 'base_fee_paid',
      userId: 'test-clinic-456',
      clinicId: 'test-clinic-456',
      message: '佐藤クリニックが基本料金を支払いました。',
      timestamp: now,
      details: {
        amount: 'base_fee',
        clinicName: '佐藤クリニック',
        clinicId: 'test-clinic-456'
      }
    };
    
    await db.collection('activity_feed').doc('test-base-fee-1').set(baseFeeActivity);
    
  } catch (error) {
    console.error('❌ Error creating test activities:', error);
  }
}

async function cleanupTestData() {
  
  try {
    const testIds = [
      'test-patient-reg-1',
      'test-clinic-reg-1', 
      'test-subscription-1',
      'test-payment-failure-1',
      'test-cancellation-1',
      'test-base-fee-1'
    ];
    
    for (const id of testIds) {
      await db.collection('activity_feed').doc(id).delete();
    }
    
    
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

// Run the appropriate function based on command line argument
const command = process.argv[2];

if (command === 'test') {
  testActivityFeed();
} else if (command === 'cleanup') {
  cleanupTestData();
} else {
  console.log('Usage:');
  console.log('  node scripts/test-activity-feed.js test     - Create test activities');
  console.log('  node scripts/test-activity-feed.js cleanup  - Clean up test data');
} 