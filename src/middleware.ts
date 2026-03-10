import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/projects'];
const authRoutes = ['/auth/login', '/auth/signup'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('viralizoou_token')?.value;

    // Verificar se é uma rota protegida
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        const user = await verifyToken(token);
        if (!user) {
            const response = NextResponse.redirect(new URL('/auth/login', request.url));
            response.cookies.delete('viralizoou_token');
            return response;
        }
    }

    // Se o usuário já está logado e tenta acessar login/signup, redireciona para dashboard
    if (isAuthRoute && token) {
        const user = await verifyToken(token);
        if (user) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/projects/:path*', '/auth/:path*'],
};
