"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Type, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Mic, 
  Settings2, 
  Grid2X2,
  Monitor,
  Maximize2,
  CheckCircle2,
  Loader2,
  ChevronRight
} from "lucide-react";
import { generateDetailedScriptFromPrompt } from "@/ai/flows/generate-detailed-script-from-prompt";
import { generateSceneReferenceImages } from "@/ai/flows/generate-scene-reference-images";
import { createConsistentCinematicScenes } from "@/ai/flows/create-consistent-cinematic-scenes";
import { generateConsistentVideoClips } from "@/ai/flows/generate-consistent-video-clips";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

type Step = "input" | "script" | "config" | "grid" | "refinement" | "video" | "finish";

export function ProjectCreationStepper() {
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // State for project data
  const [inputData, setInputData] = useState({ text: "", media: null as string | null });
  const [scriptData, setScriptData] = useState<any>(null);
  const [config, setConfig] = useState({
    grid: "2x2" as "2x2" | "2x3" | "2x4" | "2x5",
    aspectRatio: "16:9" as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
    resolution: "1K" as "1K" | "2K",
  });
  const [gridImages, setGridImages] = useState<string[]>([]);
  const [refinedImages, setRefinedImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  const handleImproveIdea = async () => {
    if (!inputData.text && !inputData.media) {
      toast({ title: "Please provide an idea first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await generateDetailedScriptFromPrompt({ textInput: inputData.text });
      setScriptData(result);
      setStep("script");
    } catch (e) {
      toast({ title: "Failed to generate script", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGrid = async () => {
    setLoading(true);
    try {
      const result = await generateSceneReferenceImages({
        scriptDetails: {
          sceneDescriptions: scriptData.sceneDescriptions,
          characterDescription: scriptData.characterDescriptions[0] || "A mysterious explorer",
        },
        gridFormat: config.grid,
        aspectRatio: config.aspectRatio,
        resolution: config.resolution
      });
      setGridImages(result.referenceImageUrls);
      setStep("grid");
    } catch (e) {
      toast({ title: "Failed to generate grid images", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefineScenes = async () => {
    setLoading(true);
    try {
      const refined: string[] = [];
      for (let i = 0; i < gridImages.length; i++) {
        const res = await createConsistentCinematicScenes({
          referenceImageUri: gridImages[i],
          sceneDescription: scriptData.sceneDescriptions[i],
          characterProfileDescription: scriptData.characterDescriptions[0],
          aspectRatio: config.aspectRatio,
          resolution: config.resolution
        });
        refined.push(res.enhancedImageUri);
      }
      setRefinedImages(refined);
      setStep("refinement");
    } catch (e) {
      toast({ title: "Failed to refine scenes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideos = async () => {
    setLoading(true);
    try {
      const scenesInput = refinedImages.map((img, idx) => ({
        sceneTextDescription: scriptData.sceneDescriptions[idx],
        imageReferenceDataUri: img
      }));
      const res = await generateConsistentVideoClips({
        scenes: scenesInput,
        aspectRatio: config.aspectRatio === "16:9" || config.aspectRatio === "9:16" ? config.aspectRatio : "16:9"
      });
      setVideos(res);
      setStep("video");
    } catch (e) {
      toast({ title: "Failed to generate videos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderProgress = () => {
    const steps = ["input", "script", "config", "grid", "refinement", "video", "finish"];
    const currentIdx = steps.indexOf(step);
    return (
      <div className="mb-12">
        <div className="flex justify-between mb-4">
          {steps.map((s, idx) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                idx <= currentIdx ? "bg-primary text-white scale-110" : "bg-white/5 text-muted-foreground"
              }`}>
                {idx < currentIdx ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${idx <= currentIdx ? "text-primary" : "text-muted-foreground"}`}>{s}</span>
            </div>
          ))}
        </div>
        <Progress value={(currentIdx / (steps.length - 1)) * 100} className="h-1" />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-[70vh]">
      {renderProgress()}

      {step === "input" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <h2 className="text-4xl font-headline font-bold mb-4">What's your vision?</h2>
            <p className="text-muted-foreground">Start with a thought, a script, or an image. We'll build the world around it.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {[{ icon: Type, label: "Text", desc: "Start from scratch" }, { icon: ImageIcon, label: "Image", desc: "Visual anchor" }, { icon: VideoIcon, label: "Video", desc: "Style transfer" }, { icon: Mic, label: "Audio", desc: "Transcription" }].map((t) => (
              <Card key={t.label} className="bg-card border-white/5 hover:border-primary/50 cursor-pointer transition-all group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors">
                    <t.icon className="text-primary group-hover:text-white" />
                  </div>
                  <h3 className="font-bold mb-1">{t.label}</h3>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Label htmlFor="idea" className="text-lg font-bold">Describe your video project</Label>
            <Textarea 
              id="idea" 
              placeholder="A futuristic nomad traveling through a neon-lit rainforest, finding a lost artifact..."
              className="min-h-[200px] bg-card border-white/5 focus:ring-primary/20"
              value={inputData.text}
              onChange={(e) => setInputData({ ...inputData, text: e.target.value })}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleImproveIdea} 
                disabled={loading}
                className="bg-accent hover:bg-accent/90 text-white font-bold h-12 px-8 rounded-xl glowing-accent"
              >
                {loading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2 w-5 h-5" />}
                Improve Idea with AI
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "script" && scriptData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-headline font-bold">AI Refined Script</h2>
              <p className="text-muted-foreground">Gemini has expanded your idea into a production-ready script.</p>
            </div>
            <Button variant="ghost" onClick={() => setStep("input")}><ArrowLeft className="mr-2" /> Back</Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Monitor className="text-primary" /> Synopsis
                </h3>
                <p className="text-muted-foreground leading-relaxed italic">"{scriptData.synopsis}"</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="text-accent" /> Scene Breakdown
                </h3>
                {scriptData.sceneDescriptions.map((desc: string, i: number) => (
                  <div key={i} className="bg-card p-4 rounded-xl border border-white/5 flex gap-4">
                    <div className="bg-primary/20 text-primary w-8 h-8 rounded flex items-center justify-center shrink-0 font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                  <Settings2 /> Character Profile
                </h3>
                <div className="space-y-4">
                  {scriptData.characterDescriptions.map((char: string, i: number) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground mb-1">Character {i + 1}:</p>
                      {char}
                    </div>
                  ))}
                </div>
              </div>
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-white h-14 text-lg font-bold"
                onClick={() => setStep("config")}
              >
                Configure Production <ChevronRight className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "config" && (
        <div className="space-y-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <h2 className="text-4xl font-headline font-bold mb-4">Production Settings</h2>
            <p className="text-muted-foreground">Select the format and scale for your cinematic journey.</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-lg font-bold">Grid Layout (Number of Scenes)</Label>
              <div className="grid grid-cols-4 gap-4">
                {["2x2", "2x3", "2x4", "2x5"].map((g) => (
                  <Button 
                    key={g} 
                    variant={config.grid === g ? "default" : "outline"}
                    className={`h-20 flex-col gap-1 rounded-xl transition-all ${config.grid === g ? "bg-primary border-primary glowing-accent" : "border-white/5"}`}
                    onClick={() => setConfig({ ...config, grid: g as any })}
                  >
                    <Grid2X2 className="w-5 h-5" />
                    <span className="text-xs font-bold">{g}</span>
                    <span className="text-[8px] opacity-60 uppercase">
                      {g === '2x2' ? '4 scenes' : g === '2x3' ? '6 scenes' : g === '2x4' ? '8 scenes' : '10 scenes'}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-bold">Aspect Ratio</Label>
              <div className="grid grid-cols-5 gap-4">
                {["1:1", "16:9", "9:16", "4:3", "3:4"].map((r) => (
                  <Button 
                    key={r} 
                    variant={config.aspectRatio === r ? "default" : "outline"}
                    className={`h-16 rounded-xl transition-all ${config.aspectRatio === r ? "bg-accent border-accent" : "border-white/5"}`}
                    onClick={() => setConfig({ ...config, aspectRatio: r as any })}
                  >
                    <span className="font-bold text-xs">{r}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-bold">Image Resolution</Label>
              <div className="grid grid-cols-2 gap-4">
                {["1K", "2K"].map((res) => (
                  <Button 
                    key={res} 
                    variant={config.resolution === res ? "default" : "outline"}
                    className={`h-16 rounded-xl transition-all ${config.resolution === res ? "bg-white text-background hover:bg-white/90" : "border-white/5"}`}
                    onClick={() => setConfig({ ...config, resolution: res as any })}
                  >
                    <Maximize2 className="mr-2 w-4 h-4" />
                    <span className="font-bold">{res}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setStep("script")} className="h-14 flex-1">Back to Script</Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white h-14 flex-1 text-lg font-bold glowing-accent"
              disabled={loading}
              onClick={handleGenerateGrid}
            >
              {loading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2 w-5 h-5" />}
              Generate Visual Grid
            </Button>
          </div>
        </div>
      )}

      {step === "grid" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-headline font-bold">Visual Grid References</h2>
              <p className="text-muted-foreground">Gemini 3.1 Flash Image Preview has drafted initial scenes.</p>
            </div>
            <Button variant="ghost" onClick={() => setStep("config")}><ArrowLeft className="mr-2" /> Back</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gridImages.map((img, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
                <Image src={img} alt={`Reference ${i}`} fill className="object-cover" />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-primary/80">Scene {i + 1}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-white font-bold h-14 px-12 rounded-xl glowing-accent"
              onClick={handleRefineScenes}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2 w-5 h-5" />}
              Apply Cinematic Refinement
            </Button>
          </div>
        </div>
      )}

      {step === "refinement" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-headline font-bold text-accent">Cinematic Refinement</h2>
              <p className="text-muted-foreground">High-definition scenes recreated with perfect consistency.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep("grid")}><ArrowLeft className="mr-2" /> Back</Button>
              <Badge className="bg-accent h-6">DNA CONSISTENCY ACTIVE</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {refinedImages.map((img, i) => (
              <div key={i} className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-accent/20 shadow-2xl">
                  <Image src={img} alt={`Refined Scene ${i}`} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">SHOT {i+1}</p>
                    <h3 className="font-bold text-lg">Cinematic Masterpiece</h3>
                  </div>
                </div>
                <div className="bg-card p-4 rounded-xl border border-white/5 text-xs text-muted-foreground">
                  {scriptData.sceneDescriptions[i]}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-12">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white font-bold h-16 px-16 rounded-2xl glowing-accent text-xl"
              onClick={handleGenerateVideos}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                  Generating Clips with Veo 3.1...
                </>
              ) : (
                <>
                  <VideoIcon className="mr-3 w-6 h-6" />
                  Generate 8s Video Clips
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "video" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-headline font-bold mb-4">Final Production</h2>
            <p className="text-muted-foreground">8-second clips generated with Veo 3.1. Continuity sequences applied.</p>
          </div>

          <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
            {videos.map((vid, i) => (
              <div key={i} className="relative group">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-primary shadow-2xl bg-black">
                  <video src={vid} controls className="w-full h-full object-contain" />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary glowing-accent">SCENE {i+1}</Badge>
                  </div>
                </div>
                {i < videos.length - 1 && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-accent"></div>
                    <Badge variant="outline" className="border-accent text-accent bg-accent/10">Seamless Transition</Badge>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-6 pt-20">
            <h3 className="text-2xl font-headline font-bold">Ready for Export?</h3>
            <div className="flex gap-4">
              <Button size="lg" variant="outline" className="h-14 px-12 rounded-xl">Edit Sequence</Button>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white h-14 px-12 rounded-xl glowing-accent font-bold text-lg">
                Assemble Final Video (MP4)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}