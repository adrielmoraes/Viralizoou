"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Video,
  LayoutDashboard,
  Library,
  History,
  Settings,
  MoreVertical,
  PlayCircle,
  LogOut,
  Crown,
  Zap,
  Loader2,
} from "lucide-react";

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  plan: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!res.ok || !data.user) {
        router.push("/auth/login");
        return;
      }
      setUser(data.user);
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  const getPlanBadge = () => {
    if (!user) return null;
    switch (user.plan) {
      case "studio":
        return (
          <Badge className="bg-accent/20 text-accent border border-accent/30">
            <Crown className="w-3 h-3 mr-1" /> Studio
          </Badge>
        );
      case "creator":
        return (
          <Badge className="bg-primary/20 text-primary border border-primary/30">
            <Zap className="w-3 h-3 mr-1" /> Creator
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-muted-foreground">
            Free
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-4">
        <div className="flex items-center gap-3 px-4 py-6 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Video className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-headline font-bold">Viralizoou</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl font-medium">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/projects/new" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-white/5 rounded-xl transition-all">
            <Plus className="w-5 h-5" /> Novo Projeto
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-white/5 rounded-xl transition-all">
            <Library className="w-5 h-5" /> Biblioteca
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-white/5 rounded-xl transition-all">
            <History className="w-5 h-5" /> Histórico
          </Link>
          <Link href="/pricing" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-white/5 rounded-xl transition-all">
            <Settings className="w-5 h-5" /> Planos
          </Link>
        </nav>

        <div className="space-y-4">
          {user && user.plan === "free" && (
            <Link href="/pricing">
              <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 hover:border-accent/30 transition-all cursor-pointer">
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Upgrade</p>
                <p className="text-xs text-muted-foreground mb-4">Desbloqueie projetos ilimitados e resolução 2K.</p>
                <Button size="sm" className="w-full text-xs bg-accent hover:bg-accent/90 text-white">
                  Ver Planos
                </Button>
              </div>
            </Link>
          )}

          {user && user.plan !== "free" && (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                {getPlanBadge()}
              </div>
              <p className="text-xs text-muted-foreground">Seu plano está ativo.</p>
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-xs font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0 h-8 w-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto bg-[#1a1820]">
        <header className="p-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">Meus Projetos</h1>
            <div className="text-muted-foreground flex items-center gap-2">
              Bem-vindo, {user?.firstName}! {getPlanBadge()}
            </div>
          </div>
          <Link href="/projects/new">
            <Button className="bg-accent hover:bg-accent/90 text-white font-bold h-12 px-6 glowing-accent">
              <Plus className="mr-2 w-5 h-5" /> Novo Projeto
            </Button>
          </Link>
        </header>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/projects/new" className="flex items-center justify-center aspect-video border-2 border-dashed border-white/10 rounded-xl hover:border-primary/50 hover:bg-white/5 transition-all group">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-all">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-all" />
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-all font-medium">
                Criar Novo Projeto
              </span>
            </div>
          </Link>
        </div>

        {user?.plan === "free" && (
          <div className="mx-8 mb-8 p-6 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Desbloqueie o poder total</h3>
              <p className="text-muted-foreground text-sm">Assine um plano para criar vídeos cinematográficos ilimitados.</p>
            </div>
            <Link href="/pricing">
              <Button className="bg-accent hover:bg-accent/90 text-white font-bold">
                Ver Planos
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}