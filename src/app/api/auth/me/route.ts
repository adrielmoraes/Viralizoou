import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const tokenUser = await getCurrentUser();
        if (!tokenUser) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const sql = getDb();
        const users = await sql`
      SELECT id, first_name, last_name, email, plan, stripe_customer_id, stripe_subscription_id, created_at
      FROM users WHERE id = ${tokenUser.userId}
    `;

        if (users.length === 0) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const user = users[0];
        return NextResponse.json({
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                plan: user.plan,
                stripeCustomerId: user.stripe_customer_id,
                stripeSubscriptionId: user.stripe_subscription_id,
                createdAt: user.created_at,
            },
        });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}
