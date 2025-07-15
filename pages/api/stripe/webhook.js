const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { adminDb } = require('../../../lib/firebase-admin');
const getRawBody = require('raw-body');

// This is required to handle the request body as a buffer
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper to fetch plan from Firestore by priceId
async function getPlanByPriceId(priceId) {
    const plansSnap = await adminDb.collection('subscriptionPlans').where('priceId', '==', priceId).where('status', '==', 'active').limit(1).get();
    if (plansSnap.empty) return null;
    const planDoc = plansSnap.docs[0];
    return { id: planDoc.id, ...planDoc.data() };
}

// Helper to get user details by userId
async function getUserDetails(userId) {
    try {
        const userSnap = await adminDb.collection('users').doc(userId).get();
        if (userSnap.exists) {
            const userData = userSnap.data();
            return {
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                email: userData.email || '',
                displayName: userData.displayName || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
    }
}

// Helper to get clinic details by clinicId
async function getClinicDetails(clinicId) {
    try {
        const clinicSnap = await adminDb.collection('clinics').doc(clinicId).get();
        if (clinicSnap.exists) {
            const clinicData = clinicSnap.data();
            return {
                clinicName: clinicData.clinicName || '',
                email: clinicData.email || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching clinic details:', error);
        return null;
    }
}

const handleCheckoutCompleted = async (session) => {
    const { userId, type } = session.metadata;
    const stripeSubscriptionId = session.subscription;

    if (!userId || !stripeSubscriptionId) {
        console.error('Webhook Error: Missing userId or subscriptionId in metadata.');
        return;
    }

    // If this is a clinic base fee payment
    if (type === 'clinic_base_fee') {
        // Get clinic details for the message
        const clinicDetails = await getClinicDetails(userId);
        const clinicName = clinicDetails ? clinicDetails.clinicName : 'Unknown Clinic';
        
        // Update the clinic's baseFeeStatus and store Stripe Customer ID in Firestore
        const clinicRef = adminDb.collection('clinics').doc(userId);
        await clinicRef.update({
            baseFeeStatus: 'active',
            baseFeeStripeSubscriptionId: stripeSubscriptionId,
            baseFeeStripeCustomerId: session.customer,
            baseFeeUpdatedAt: new Date()
        });
        
        // Add activity feed entry with enhanced message
        const activityRef = adminDb.collection('activity_feed').doc();
        await activityRef.set({
            activityId: activityRef.id,
            type: 'base_fee_paid',
            userId,
            clinicId: userId,
            message: `${clinicName} (クリニック) が基本料金を支払いました。`,
            timestamp: new Date(),
            details: {
                amount: 'base_fee',
                clinicName: clinicName,
                clinicId: userId
            },
        });
        return;
    }

    // Find the plan based on the price ID from the session
    const lineItem = (await stripe.checkout.sessions.listLineItems(session.id)).data[0];
    const priceId = lineItem.price.id;
    const plan = await getPlanByPriceId(priceId);

    if (!plan) {
        console.error(`Webhook Error: Could not find plan for priceId: ${priceId}`);
        return;
    }

    // Fetch patient document to get clinicId
    const patientSnap = await adminDb.collection('patients').doc(userId).get();
    const clinicId = patientSnap.exists ? patientSnap.data().clinicId : null;

    // Get user and clinic details for detailed messages
    const userDetails = await getUserDetails(userId);
    const clinicDetails = clinicId ? await getClinicDetails(clinicId) : null;
    
    const patientName = userDetails ? `${userDetails.lastName}${userDetails.firstName}` : 'Unknown Patient';
    const clinicName = clinicDetails ? clinicDetails.clinicName : 'Unknown Clinic';

    // Create the subscription document in Firestore
    const subscriptionRef = adminDb.collection('subscriptions').doc();
    const subscriptionData = {
        subscriptionId: subscriptionRef.id,
        patientId: userId,
        clinicId: clinicId || 'unknown',
        planId: plan.id,
        planSnapshot: {
            name: plan.name,
            price: plan.price,
            commission: plan.commission,
            companyCut: plan.companyCut,
        },
        stripeSubscriptionId,
        stripeCustomerId: session.customer,
        status: 'active',
        amount: plan.price,
        clinicCommission: plan.commission,
        adminRevenue: plan.companyCut,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    await subscriptionRef.set(subscriptionData);

    // Enhanced message for subscription signup
    const activityRef = adminDb.collection('activity_feed').doc();
    const activityData = {
        activityId: activityRef.id,
        type: 'new_signup',
        userId: userId,
        clinicId: clinicId || 'unknown',
        message: `${patientName} (患者) が ${clinicName} (クリニック) の「${plan.name}」に登録しました。 (金額 ¥${plan.price.toLocaleString()})`,
        timestamp: new Date(),
        details: {
            plan: plan.name,
            planId: plan.id,
            amount: plan.price,
            patientName: patientName,
            patientId: userId,
            clinicName: clinicName,
            clinicId: clinicId
        },
    };
    await activityRef.set(activityData);

};

const handlePaymentFailed = async (invoice) => {
    const stripeSubscriptionId = invoice.subscription;
    if (!stripeSubscriptionId) {
        console.error('Webhook Error: Missing subscription ID in invoice.payment_failed event.');
        return;
    }
    // Find the subscription in Firestore
    const subSnap = await adminDb.collection('subscriptions')
        .where('stripeSubscriptionId', '==', stripeSubscriptionId)
        .limit(1)
        .get();
    if (subSnap.empty) {
        console.error(`No Firestore subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
        return;
    }
    const subDoc = subSnap.docs[0];
    const subData = subDoc.data();
    
    // Get user and clinic details for detailed message
    const userDetails = await getUserDetails(subData.patientId);
    const clinicDetails = await getClinicDetails(subData.clinicId);
    
    const patientName = userDetails ? `${userDetails.lastName}${userDetails.firstName}` : 'Unknown Patient';
    const clinicName = clinicDetails ? clinicDetails.clinicName : 'Unknown Clinic';
    const planName = subData.planSnapshot ? subData.planSnapshot.name : 'Unknown Plan';
    
    await subDoc.ref.update({ status: 'suspended', updatedAt: new Date(), reminderSent: true });
    
    // Add activity feed entry with detailed message
    const activityRef = adminDb.collection('activity_feed').doc();
    await activityRef.set({
        activityId: activityRef.id,
        type: 'payment_failed',
        userId: subData.patientId,
        clinicId: subData.clinicId,
        message: `${patientName}の${planName}支払いが失敗しました。リマインダーを送信しました。`,
        timestamp: new Date(),
        details: {
            plan: planName,
            planId: subData.planId,
            amount: subData.amount,
            patientName: patientName,
            patientId: subData.patientId,
            clinicName: clinicName,
            clinicId: subData.clinicId
        },
    });
    // Simulate sending an email reminder
};

const handleSubscriptionDeleted = async (subscription) => {
    const stripeSubscriptionId = subscription.id;
    if (!stripeSubscriptionId) {
        console.error('Webhook Error: Missing subscription ID in customer.subscription.deleted event.');
        return;
    }
    // Find the subscription in Firestore
    const subSnap = await adminDb.collection('subscriptions')
        .where('stripeSubscriptionId', '==', stripeSubscriptionId)
        .limit(1)
        .get();
    if (subSnap.empty) {
        console.error(`No Firestore subscription found for Stripe subscription ID: ${stripeSubscriptionId}`);
        return;
    }
    const subDoc = subSnap.docs[0];
    const subData = subDoc.data();
    
    // Get user and clinic details for detailed message
    const userDetails = await getUserDetails(subData.patientId);
    const clinicDetails = await getClinicDetails(subData.clinicId);
    
    const patientName = userDetails ? `${userDetails.lastName}${userDetails.firstName}` : 'Unknown Patient';
    const clinicName = clinicDetails ? clinicDetails.clinicName : 'Unknown Clinic';
    const planName = subData.planSnapshot ? subData.planSnapshot.name : 'Unknown Plan';
    
    await subDoc.ref.update({ status: 'cancelled', updatedAt: new Date() });
    
    // Add activity feed entry with detailed message
    const activityRef = adminDb.collection('activity_feed').doc();
    await activityRef.set({
        activityId: activityRef.id,
        type: 'subscription_cancelled',
        userId: subData.patientId,
        clinicId: subData.clinicId,
        message: `${patientName}の${planName}がキャンセルされました。`,
        timestamp: new Date(),
        details: {
            plan: planName,
            planId: subData.planId,
            amount: subData.amount,
            patientName: patientName,
            patientId: subData.patientId,
            clinicName: clinicName,
            clinicId: subData.clinicId
        },
    });
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    let event;
    let rawBody;
    try {
        rawBody = await getRawBody(req);
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        await handleCheckoutCompleted(event.data.object);
    }
    // Handle failed payment
    if (event.type === 'invoice.payment_failed') {
        await handlePaymentFailed(event.data.object);
    }
    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
        await handleSubscriptionDeleted(event.data.object);
    }

    res.status(200).json({ received: true });
}