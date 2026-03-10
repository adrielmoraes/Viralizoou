import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email e senha são obrigatórios.' },
                { status: 400 }
            );
        }

        const sql = getDb();

        // Busca usuário
        const users = await sql`
      SELECT id, first_name, last_name, email, password_hash, plan
      FROM users WHERE email = ${email}
    `;

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'Email ou senha incorretos.' },
                { status: 401 }
            );
        }

        const user = users[0];

        // Verifica senha usando Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(password + process.env.JWT_SECRET);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (passwordHash !== user.password_hash) {
            return NextResponse.json(
                { error: 'Email ou senha incorretos.' },
                { status: 401 }
            );
        }

        // Gera token JWT
        const token = await createToken({
            userId: user.id,
            email: user.email,
            plan: user.plan,
        });

        await setAuthCookie(token);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                plan: user.plan,
            },
        });
    } catch (error: any) {
        console.error('Erro no login:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        );
    }
}
