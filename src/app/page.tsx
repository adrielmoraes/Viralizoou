import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, Video, Layers, ShieldCheck, ArrowRight, Crown } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen hero-gradient">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center glowing-accent">
            <Video className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-headline font-bold tracking-tight">Viralizoou</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Recursos</Link>
          <Link href="#how-it-works" className="hover:text-foreground transition-colors">Como Funciona</Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">Planos</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-sm">Entrar</Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-accent hover:bg-accent/90 text-white font-medium px-6">Criar Conta</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 pt-20 pb-32 text-center max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Crie Vídeos Cinematográficos<br />Com Precisão de IA
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            O primeiro motor de vídeo com IA projetado para consistência profissional.
            Mantenha personagens, ambientes e iluminação idênticos em cada cena.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 h-14 text-lg">
                Criar Seu Vídeo <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="px-8 h-14 text-lg">
                <Crown className="mr-2 w-5 h-5" /> Ver Planos
              </Button>
            </Link>
          </div>

          <div className="mt-20 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                width={1200}
                height={600}
                className="w-full object-cover"
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
          </div>
        </section>

        <section id="features" className="px-6 py-24 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-headline font-bold mb-4">Capacidades de IA Incomparáveis</h2>
              <p className="text-muted-foreground">Tudo que você precisa para produzir vídeos de qualidade de estúdio em minutos.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl glass-panel hover:border-primary/50 transition-all group">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                  <Layers className="text-primary group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Consistência Total</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Nosso sistema de DNA de Personagem garante o mesmo rosto, corpo e roupa em todos os clipes. Sem personagens piscando.
                </p>
              </div>

              <div className="p-8 rounded-2xl glass-panel hover:border-accent/50 transition-all group">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-6 group-hover:bg-accent transition-colors">
                  <Sparkles className="text-accent group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Refinamento Cinematográfico</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Utilize motores de IA avançados para refinar cada cena com iluminação profissional, ângulos de câmera e texturas de alta fidelidade.
                </p>
              </div>

              <div className="p-8 rounded-2xl glass-panel hover:border-white/20 transition-all group">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-white transition-colors">
                  <Video className="text-white group-hover:text-background" />
                </div>
                <h3 className="text-xl font-bold mb-3">Geração de Movimento</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Gere clipes de alta definição com os modelos de vídeo mais recentes. Movimento perfeito, física e realismo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-headline font-bold mb-4">Comece a Criar Hoje</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Planos a partir de <span className="text-accent font-bold">R$ 197,90/mês</span>
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/pricing">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8 h-14 text-lg glowing-accent">
                  Ver Planos e Preços
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-12 border-t border-white/5 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Viralizoou. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
