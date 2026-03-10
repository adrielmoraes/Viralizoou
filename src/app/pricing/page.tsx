"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Video,
    Check,
    Sparkles,
    Zap,
    Crown,
    Loader2,
    ArrowLeft,
} from "lucide-react";

const plans = [
    {
        id: "creator",
        name: "Creator",
        price: "R$ 197,90",
        period: "/mês",
        description: "Para criadores que querem começar a produzir conteúdo cinematográfico de qualidade.",
        icon: Zap,
        color: "primary",
        popular: false,
        features: [
            "10 projetos por mês",
            "Grid até 2x3 (6 cenas)",
            "Resolução 1K",
            "Vídeos em 720p",
            "Download MP4",
            "Suporte por email",
        ],
    },
    {
        id: "studio",
        name: "Studio",
        price: "R$ 397,90",
        period: "/mês",
        description: "Para profissionais e estúdios que precisam de produção cinematográfica avançada.",
        icon: Crown,
        color: "accent",
        popular: true,
        features: [
            "Projetos ilimitados",
            "Grid até 2x5 (10 cenas)",
            "Resolução 2K",
            "Vídeos em 1080p",
            "Download MP4 + MOV",
            "Biblioteca de personagens",
            "Montagem automática",
            "Suporte prioritário",
        ],
    },
];

export default function PricingPage() {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const router = useRouter();

    const handleSubscribe = async (planId: string) => {
        setLoadingPlan(planId);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/auth/login");
                    return;
                }
                alert(data.error || "Erro ao processar.");
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch {
            alert("Erro de conexão.");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-background hero-gradient">
            <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Video className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-headline font-bold">Viralizoou</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/auth/login">
                        <Button variant="ghost" className="text-sm">Entrar</Button>
                    </Link>
                    <Link href="/auth/signup">
                        <Button className="bg-accent hover:bg-accent/90 text-white font-medium px-6">Criar Conta</Button>
                    </Link>
                </div>
            </header>

            <main className="px-6 py-20 max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Escolha seu plano
                    </div>
                    <h1 className="text-5xl md:text-6xl font-headline font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Planos para cada<br />tipo de criador
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Comece a criar vídeos cinematográficos com IA hoje. Cancele a qualquer momento.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative p-8 rounded-2xl border transition-all hover:scale-[1.02] ${plan.popular
                                    ? "bg-accent/5 border-accent/30 shadow-2xl shadow-accent/10"
                                    : "bg-card border-white/10"
                                }`}
                        >
                            {plan.popular && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1">
                                    Mais Popular
                                </Badge>
                            )}

                            <div className="mb-8">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.popular ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                                    }`}>
                                    <plan.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm">
                                        <Check className={`w-4 h-4 shrink-0 ${plan.popular ? "text-accent" : "text-primary"}`} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={loadingPlan !== null}
                                className={`w-full h-12 font-bold rounded-xl ${plan.popular
                                        ? "bg-accent hover:bg-accent/90 text-white glowing-accent"
                                        : "bg-primary hover:bg-primary/90 text-white"
                                    }`}
                            >
                                {loadingPlan === plan.id ? (
                                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                ) : null}
                                {loadingPlan === plan.id ? "Processando..." : "Assinar Agora"}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <p className="text-sm text-muted-foreground">
                        Pagamento seguro via Stripe. Cancele a qualquer momento na sua dashboard.
                    </p>
                </div>
            </main>
        </div>
    );
}
