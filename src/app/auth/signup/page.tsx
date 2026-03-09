import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Sparkles } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 hero-gradient">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 glowing-accent">
            <Sparkles className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-headline font-bold mb-2">Join Viralizoou</h1>
          <p className="text-muted-foreground">The future of cinematic AI storytelling</p>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-white/5 shadow-2xl space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="John" className="bg-background/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Doe" className="bg-background/50 border-white/10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" className="bg-background/50 border-white/10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" className="bg-background/50 border-white/10" />
          </div>
          <Link href="/dashboard" className="block w-full">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl glowing-accent">
              Create Account
            </Button>
          </Link>

          <p className="text-[10px] text-center text-muted-foreground px-4">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-accent font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}