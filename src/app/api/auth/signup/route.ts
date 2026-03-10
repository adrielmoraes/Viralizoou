import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { firstName, lastName, email, password } = await req.json();

        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json(
                { error: 'Todos os campos são obrigatórios.' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'A senha deve ter pelo menos 6 caracteres.' },
                { status: 400 }
            );
        }

        const sql = getDb();

        // Verifica se email já existe
        const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Este email já está cadastrado.' },
                { status: 409 }
            );
        }

        // Hash da senha usando Web Crypto API (Edge-compatible)
        const encoder = new TextEncoder();
        const data = encoder.encode(password + process.env.JWT_SECRET);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Insere usuário
        const result = await sql`
      INSERT INTO users (first_name, last_name, email, password_hash, plan)
      VALUES (${firstName}, ${lastName}, ${email}, ${passwordHash}, 'free')
      RETURNING id, email, plan
    `;

        const user = result[0];

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
                firstName,
                lastName,
                email: user.email,
                plan: user.plan,
            },
        });
    } catch (error: any) {
        console.error('Erro no cadastro:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        );
    }
}
