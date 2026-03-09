import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus, Video, LayoutDashboard, Library, History, Settings, MoreVertical, PlayCircle } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const projects = [
    { 
      id: "1", 
      title: "Neon Cyberpunk Journey", 
      status: "Completed", 
      date: "2 hours ago", 
      image: PlaceHolderImages.find(img => img.id === 'project-1')?.imageUrl 
    },
    { 
      id: "2", 
      title: "Ancient Forest Whispers", 
      status: "Draft", 
      date: "Yesterday", 
      image: PlaceHolderImages.find(img => img.id === 'project-2')?.imageUrl 
    },
  ];

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
          <Link href="/dashboard/characters" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-white/5 rounded-xl transition-all">
            <Library className="w-5 h-5" /> Library
          </Link>
          <Link href="/dashboard/history" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-white/5 rounded-xl transition-all">
            <History className="w-5 h-5" /> History
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-white/5 rounded-xl transition-all">
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </nav>
        
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Pro Plan</p>
          <p className="text-xs text-muted-foreground mb-4">Unlimited generations and 4K exports enabled.</p>
          <Button size="sm" variant="outline" className="w-full text-xs border-primary/20 hover:bg-primary/10">Manage</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto bg-[#1a1820]">
        <header className="p-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">My Projects</h1>
            <p className="text-muted-foreground">Welcome back, Director. Ready for a new scene?</p>
          </div>
          <Link href="/projects/new">
            <Button className="bg-accent hover:bg-accent/90 text-white font-bold h-12 px-6 glowing-accent">
              <Plus className="mr-2 w-5 h-5" /> Create New Project
            </Button>
          </Link>
        </header>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="bg-card border-white/5 overflow-hidden hover:border-primary/50 transition-all group">
              <div className="aspect-video relative overflow-hidden">
                {project.image && (
                  <Image 
                    src={project.image} 
                    alt={project.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button size="icon" variant="secondary" className="rounded-full w-12 h-12 shadow-xl">
                    <PlayCircle className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              <CardHeader className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'} className={project.status === 'Completed' ? 'bg-green-500/20 text-green-400' : ''}>
                    {project.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{project.date}</span>
                </div>
                <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{project.title}</CardTitle>
              </CardHeader>
              <CardFooter className="px-5 pb-5 pt-0 flex justify-between">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground p-0">View Details</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
          
          <Link href="/projects/new" className="flex items-center justify-center aspect-video border-2 border-dashed border-white/10 rounded-xl hover:border-primary/50 hover:bg-white/5 transition-all group">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-all">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-all" />
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-all font-medium">New Project</span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}