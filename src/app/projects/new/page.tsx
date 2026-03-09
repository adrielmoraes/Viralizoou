import Link from "next/link";
import { Video, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCreationStepper } from "@/components/project-creation-stepper";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Video className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-headline font-bold">Viralizoou</span>
            <span className="text-muted-foreground mx-2">/</span>
            <span className="text-muted-foreground font-medium">New Project</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="text-xs h-9">Save as Draft</Button>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <ProjectCreationStepper />
      </main>
    </div>
  );
}