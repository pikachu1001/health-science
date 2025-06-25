const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { adminDb } = require('../../../lib/firebase-admin');
const { plans } = require('../../../lib/plans');
const getRawBody = require('raw-body');

// This is required to handle the request body as a buffer
export const config = {
    api: {
        bodyParser: false,
    },
};

const handleCheckoutCompleted = async (session) => {
    const { userId, type } = session.metadata;
    const stripeSubscriptionId = session.subscription;

    if (!userId || !stripeSubscriptionId) {
        console.error('Webhook Error: Missing userId or subscriptionId in metadata.');
        return;
    }

    // If this is a clinic base fee payment
    if (type === 'clinic_base_fee') {
        // Update the clinic's baseFeeStatus and store Stripe Customer ID in Firestore
        const clinicRef = adminDb.collection('clinics').doc(userId);
        await clinicRef.update({ 
            baseFeeStatus: 'active', 
            baseFeeStripeSubscriptionId: stripeSubscriptionId, 
            baseFeeStripeCustomerId: session.customer,
            baseFeeUpdatedAt: new Date() 
        });
        // Add activity feed entry
        const activityRef = adminDb.collection('activity_feed').doc();
        await activityRef.set({
            activityId: activityRef.id,
            type: 'base_fee_paid',
            userId,
            clinicId: userId,
            message: `クリニックの基本料金が支払われました。`,
            timestamp: new Date(),
            details: {
                amount: 'base_fee',
            },
        });
        console.log(`Clinic base fee paid and status updated for clinic ${userId}`);
        return;
    }

    // Find the plan based on the price ID from the session
    const lineItem = (await stripe.checkout.sessions.listLineItems(session.id)).data[0];
    const priceId = lineItem.price.id;
    const plan = plans.find((p) => p.priceId === priceId);

    if (!plan) {
        console.error(`Webhook Error: Could not find plan for priceId: ${priceId}`);
        return;
    }

    // Create the subscription document in Firestore
    const subscriptionRef = adminDb.collection('subscriptions').doc();
    const subscriptionData = {
        subscriptionId: subscriptionRef.id,
        patientId: userId,
        clinicId: 'temp_clinic_id', // TODO: Assign a clinic ID during patient registration
        plan: plan.id,
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

    // Create an activity feed event
    const activityRef = adminDb.collection('activity_feed').doc();
    const activityData = {
        activityId: activityRef.id,
        type: 'new_signup',
        userId: userId,
        clinicId: 'temp_clinic_id', // Match the subscription's clinicId
        message: `新しい患者が${plan.name}に登録しました。`,
        timestamp: new Date(),
        details: {
            plan: plan.name,
            amount: plan.price,
        },
    };
    await activityRef.set(activityData);

    console.log(`Successfully created subscription ${subscriptionRef.id} for user ${userId}`);
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
    await subDoc.ref.update({ status: 'suspended', updatedAt: new Date(), reminderSent: true });
    // Add activity feed entry
    const activityRef = adminDb.collection('activity_feed').doc();
    await activityRef.set({
        activityId: activityRef.id,
        type: 'payment_failed',
        userId: subDoc.data().patientId,
        clinicId: subDoc.data().clinicId,
        message: `患者のサブスクリプション支払いが失敗しました。リマインダーを送信しました。`,
        timestamp: new Date(),
        details: {
            plan: subDoc.data().plan,
            amount: subDoc.data().amount,
        },
    });
    // Simulate sending an email reminder
    console.log(`Simulated: Sent payment failure reminder to user ${subDoc.data().patientId}`);
    console.log(`Marked subscription ${subDoc.id} as suspended due to payment failure.`);
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
    await subDoc.ref.update({ status: 'cancelled', updatedAt: new Date() });
    // Add activity feed entry
    const activityRef = adminDb.collection('activity_feed').doc();
    await activityRef.set({
        activityId: activityRef.id,
        type: 'subscription_cancelled',
        userId: subDoc.data().patientId,
        clinicId: subDoc.data().clinicId,
        message: `患者のサブスクリプションがキャンセルされました。`,
        timestamp: new Date(),
        details: {
            plan: subDoc.data().plan,
            amount: subDoc.data().amount,
        },
    });
    console.log(`Marked subscription ${subDoc.id} as cancelled due to Stripe event.`);
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