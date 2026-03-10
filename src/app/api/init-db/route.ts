import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

export async function POST() {
    try {
        await initializeDatabase();
        return NextResponse.json({ success: true, message: 'Tabelas criadas com sucesso!' });
    } catch (error: any) {
        console.error('Erro ao inicializar banco:', error);
        return NextResponse.json(
            { error: error.message || 'Falha ao inicializar o banco de dados.' },
            { status: 500 }
        );
    }
}
