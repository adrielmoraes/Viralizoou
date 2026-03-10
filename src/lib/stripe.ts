import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-04-30.basil',
});

export const PLANS = {
    creator: {
        name: 'Creator',
        priceId: process.env.STRIPE_PRICE_CREATOR || '',
        price: 'R$ 197,90',
        priceValue: 19790, // em centavos
        features: [
            '10 projetos por mês',
            'Grid até 2x3 (6 cenas)',
            'Resolução 1K',
            'Vídeos em 720p',
            'Download MP4',
            'Suporte por email',
        ],
    },
    studio: {
        name: 'Studio',
        priceId: process.env.STRIPE_PRICE_STUDIO || '',
        price: 'R$ 397,90',
        priceValue: 39790, // em centavos
        features: [
            'Projetos ilimitados',
            'Grid até 2x5 (10 cenas)',
            'Resolução 2K',
            'Vídeos em 1080p',
            'Download MP4 + MOV',
            'Biblioteca de personagens',
            'Montagem automática',
            'Suporte prioritário',
        ],
    },
} as const;

export type PlanId = keyof typeof PLANS;
