import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Sem assinatura.' }, { status: 400 });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 });
    }

    const sql = getDb();

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const userId = session.metadata?.userId;
            const planId = session.metadata?.planId;
            const subscriptionId = session.subscription as string;

            if (userId && planId) {
                await sql`
          UPDATE users 
          SET plan = ${planId}, 
              stripe_subscription_id = ${subscriptionId},
              updated_at = NOW()
          WHERE id = ${parseInt(userId)}
        `;
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            const customerId = subscription.customer as string;

            await sql`
        UPDATE users 
        SET plan = 'free', 
            stripe_subscription_id = NULL,
            updated_at = NOW()
        WHERE stripe_customer_id = ${customerId}
      `;
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            const customerId = subscription.customer as string;

            if (subscription.status === 'active') {
                // Atualiza status se renovação bem sucedida
                const planId = subscription.metadata?.planId || 'creator';
                await sql`
          UPDATE users 
          SET plan = ${planId},
              updated_at = NOW()
          WHERE stripe_customer_id = ${customerId}
        `;
            }
            break;
        }
    }

    return NextResponse.json({ received: true });
}
