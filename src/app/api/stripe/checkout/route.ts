import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLANS, PlanId } from '@/lib/stripe';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
        }

        const { planId } = await req.json();

        if (!planId || !PLANS[planId as PlanId]) {
            return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
        }

        const plan = PLANS[planId as PlanId];
        const sql = getDb();

        // Buscar ou criar customer Stripe
        const users = await sql`SELECT stripe_customer_id FROM users WHERE id = ${user.userId}`;
        let customerId = users[0]?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: String(user.userId) },
            });
            customerId = customer.id;
            await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${user.userId}`;
        }

        // Criar sessão de checkout
        const origin = req.headers.get('origin') || 'http://localhost:9002';

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            currency: 'brl',
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: `Viralizoou ${plan.name}`,
                            description: plan.features.join(', '),
                        },
                        unit_amount: plan.priceValue,
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            success_url: `${origin}/dashboard?checkout=success&plan=${planId}`,
            cancel_url: `${origin}/pricing?checkout=cancelled`,
            metadata: {
                userId: String(user.userId),
                planId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error('Erro ao criar checkout:', error);
        return NextResponse.json(
            { error: 'Erro ao processar pagamento.' },
            { status: 500 }
        );
    }
}
