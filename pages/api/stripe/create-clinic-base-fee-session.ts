import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Replace with your actual base fee price ID from Stripe
const BASE_FEE_PRICE_ID='price_1Rcgnt2XvBirdvBflN9V4G7x';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, userId } = req.body;
    if (!email || !userId) {
        return res.status(400).json({ error: 'Missing email or userId' });
    }
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email,
            line_items: [
                {
                    price: BASE_FEE_PRICE_ID,
                    quantity: 1,
                },
            ],
            metadata: {
                userId,
                type: 'clinic_base_fee',
            },
            success_url: `${req.headers.origin}/clinic/dashboard?basefee=success`,
            cancel_url: `${req.headers.origin}/clinic/dashboard?basefee=cancel`,
        });
        return res.status(200).json({ url: session.url });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
} 