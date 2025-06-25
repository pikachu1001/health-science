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
    const { userId } = session.metadata;
    const stripeSubscriptionId = session.subscription;

    if (!userId || !stripeSubscriptionId) {
        console.error('Webhook Error: Missing userId or subscriptionId in metadata.');
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

    res.status(200).json({ received: true });
}