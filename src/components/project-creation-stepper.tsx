"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
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
  ChevronRight,
  Layers,
  X,
  FileUp,
  Square
} from "lucide-react";
import { generateDetailedScriptFromPrompt } from "@/ai/flows/generate-detailed-script-from-prompt";
import { generateSceneReferenceImages } from "@/ai/flows/generate-scene-reference-images";
import { createConsistentCinematicScenes } from "@/ai/flows/create-consistent-cinematic-scenes";
import { generateConsistentVideoClips } from "@/ai/flows/generate-consistent-video-clips";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

type Step = "input" | "script" | "config" | "grid" | "refinement" | "video" | "finish";
type InputType = "text" | "image" | "video" | "audio";

export function ProjectCreationStepper() {
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const [inputType, setInputType] = useState<InputType>("text");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const [inputData, setInputData] = useState({ 
    text: "", 
    media: null as string | null,
    fileName: ""
  });
  
  const [scriptData, setScriptData] = useState<any>(null);
  const [config, setConfig] = useState({
    grid: "2x2" as "2x2" | "2x3" | "2x4" | "2x5",
    aspectRatio: "16:9" as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
    resolution: "1K" as "1K" | "2K",
  });
  const [gridImages, setGridImages] = useState<string[]>([]);
  const [refinedImages, setRefinedImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setInputData({
        ...inputData,
        media: reader.result as string,
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setInputData({
            ...inputData,
            media: reader.result as string,
            fileName: `gravacao-${new Date().getTime()}.webm`
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Erro ao acessar o microfone", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProcessIdea = async () => {
    if (inputType === "text" && !inputData.text) {
      toast({ title: "Por favor, descreva sua ideia primeiro.", variant: "destructive" });
      return;
    }
    if (inputType !== "text" && !inputData.media) {
      toast({ title: `Por favor, forneça o arquivo primeiro.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {};
      if (inputType === "text") payload.textInput = inputData.text;
      if (inputType === "image") payload.imageDataUri = inputData.media;
      if (inputType === "video") payload.videoDataUri = inputData.media;
      if (inputType === "audio") payload.audioDataUri = inputData.media;

      const result = await generateDetailedScriptFromPrompt(payload);
      setScriptData(result);
      setStep("script");
    } catch (e) {
      toast({ title: "Não foi possível processar sua visão. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateGrid = async () => {
    setLoading(true);
    try {
      const charDesc = (scriptData.characterDescriptions && scriptData.characterDescriptions[0]) || "A professional subject";
      
      const result = await generateSceneReferenceImages({
        scriptDetails: {
          sceneDescriptions: scriptData.sceneDescriptions,
          characterDescription: charDesc,
        },
        gridFormat: config.grid,
        aspectRatio: config.aspectRatio,
        resolution: config.resolution
      });
      setGridImages(result.referenceImageUrls);
      setStep("grid");
    } catch (e: any) {
      console.error("Erro na geração de grid:", e);
      toast({ 
        title: "Erro ao criar as imagens iniciais.", 
        description: e.message || "Tente descrever a cena de outra forma.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefineScenes = async () => {
    setLoading(true);
    try {
      const refined: string[] = [];
      const charDesc = (scriptData.characterDescriptions && scriptData.characterDescriptions[0]) || "A professional subject";

      for (let i = 0; i < gridImages.length; i++) {
        const res = await createConsistentCinematicScenes({
          referenceImageUri: gridImages[i],
          sceneDescription: scriptData.sceneDescriptions[i],
          characterProfileDescription: charDesc,
          aspectRatio: config.aspectRatio,
          resolution: config.resolution
        });
        refined.push(res.enhancedImageUri);
      }
      setRefinedImages(refined);
      setStep("refinement");
    } catch (e) {
      toast({ title: "Erro ao refinar as cenas.", variant: "destructive" });
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
    } catch (e: any) {
      toast({ title: "Erro ao gerar os clipes.", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderProgress = () => {
    const steps = ["Início", "Roteiro", "Configuração", "Esboços", "Refinamento", "Vídeos", "Final"];
    const stepKeys: Step[] = ["input", "script", "config", "grid", "refinement", "video", "finish"];
    const currentIdx = stepKeys.indexOf(step);
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

  const inputTypes = [
    { id: "text" as InputType, icon: Type, label: "Texto", desc: "Descreva sua ideia" },
    { id: "image" as InputType, icon: ImageIcon, label: "Imagem", desc: "Referência visual" },
    { id: "video" as InputType, icon: VideoIcon, label: "Vídeo", desc: "Inspiração visual" },
    { id: "audio" as InputType, icon: Mic, label: "Voz", desc: "Grave sua ideia" }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-[70vh]">
      {renderProgress()}

      {step === "input" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <h2 className="text-4xl font-headline font-bold mb-4">Qual é a sua visão?</h2>
            <p className="text-muted-foreground">Escolha como deseja iniciar sua produção cinematográfica.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {inputTypes.map((t) => (
              <Card 
                key={t.id} 
                className={`bg-card border-white/5 hover:border-primary/50 cursor-pointer transition-all group ${inputType === t.id ? "border-primary bg-primary/5" : ""}`}
                onClick={() => {
                  setInputType(t.id);
                  setInputData({ ...inputData, media: null, fileName: "" });
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors ${inputType === t.id ? "bg-primary text-white" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"}`}>
                    <t.icon />
                  </div>
                  <h3 className="font-bold mb-1">{t.label}</h3>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6 bg-card/30 p-8 rounded-2xl border border-white/5">
            {inputType === "text" ? (
              <div className="space-y-4">
                <Label htmlFor="idea" className="text-lg font-bold">Descreva seu projeto</Label>
                <Textarea 
                  id="idea" 
                  placeholder="Ex: Uma cena épica em Marte com luz crepuscular..."
                  className="min-h-[200px] bg-background border-white/5 focus:ring-primary/20"
                  value={inputData.text}
                  onChange={(e) => setInputData({ ...inputData, text: e.target.value })}
                />
              </div>
            ) : inputType === "audio" ? (
              <div className="space-y-6 text-center py-8">
                <Label className="text-lg font-bold block mb-4">Fale sua ideia</Label>
                
                <div className="flex flex-col items-center gap-6">
                  {!inputData.media ? (
                    <div className="flex flex-col items-center gap-4">
                      <Button 
                        size="lg"
                        className={`w-24 h-24 rounded-full glowing-accent ${isRecording ? "bg-destructive hover:bg-destructive/90 animate-pulse" : "bg-primary hover:bg-primary/90"}`}
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-10 h-10" />}
                      </Button>
                      
                      {isRecording && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                          <span className="font-mono text-xl">{formatTime(recordingTime)}</span>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
                        {isRecording ? "Parar" : "Gravar Agora"}
                      </p>
                    </div>
                  ) : (
                    <div className="relative bg-background rounded-2xl border border-white/10 p-6 flex items-center gap-6 w-full max-w-md mx-auto">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Mic />
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="font-bold truncate">{inputData.fileName}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Áudio Capturado</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setInputData({ ...inputData, media: null, fileName: "" })}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-lg font-bold">Referência Visual</Label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept={inputType === "image" ? "image/*" : "video/*"}
                  onChange={handleFileChange}
                />
                {!inputData.media ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-primary/50 hover:bg-white/5 cursor-pointer transition-all group"
                  >
                    <FileUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary" />
                    <p className="font-medium">Carregar arquivo de referência</p>
                  </div>
                ) : (
                  <div className="relative bg-background rounded-2xl border border-white/10 p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      {inputType === "image" ? <ImageIcon /> : <VideoIcon />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium truncate">{inputData.fileName}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setInputData({ ...inputData, media: null, fileName: "" })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleProcessIdea} 
                disabled={loading || isRecording}
                className="bg-accent hover:bg-accent/90 text-white font-bold h-14 px-10 rounded-xl glowing-accent text-lg"
              >
                {loading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2 w-5 h-5" />}
                Processar Visão
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "script" && scriptData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-headline font-bold">Direção Criativa</h2>
              <p className="text-muted-foreground">O plano de produção está pronto para ser executado.</p>
            </div>
            <Button variant="ghost" onClick={() => setStep("input")}><ArrowLeft className="mr-2" /> Voltar</Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Monitor className="text-primary" /> Sinopse
                </h3>
                <p className="text-muted-foreground leading-relaxed italic">"{scriptData.synopsis}"</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="text-accent" /> Plano de Cenas
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
                  <Settings2 /> Identidade Visual
                </h3>
                <div className="space-y-4">
                  {(scriptData.characterDescriptions || []).map((char: string, i: number) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground mb-1">Perfil Visual:</p>
                      {char}
                    </div>
                  ))}
                </div>
              </div>
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-white h-14 text-lg font-bold rounded-xl"
                onClick={() => setStep("config")}
              >
                Continuar <ChevronRight className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "config" && (
        <div className="space-y-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <h2 className="text-4xl font-headline font-bold mb-4">Configurações Finais</h2>
            <p className="text-muted-foreground">Defina o formato visual da sua produção.</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-lg font-bold">Quantidade de Cenas</Label>
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
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-bold">Proporção (Aspect Ratio)</Label>
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
          </div>

          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setStep("script")} className="h-14 flex-1">Voltar</Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-white h-14 flex-1 text-lg font-bold glowing-accent rounded-xl"
              disabled={loading}
              onClick={handleGenerateGrid}
            >
              {loading ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2 w-5 h-5" />}
              Gerar Esboços Visuais
            </Button>
          </div>
        </div>
      )}

      {step === "grid" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-headline font-bold">Esboços Cinematográficos</h2>
              <p className="text-muted-foreground">Cenas capturadas a partir da sua visão criativa.</p>
            </div>
            <Button variant="ghost" onClick={() => setStep("config")}><ArrowLeft className="mr-2" /> Voltar</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gridImages.map((img, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                <Image src={img} alt={`Esboço ${i}`} fill className="object-cover" />
                <div className="absolute top-2 left-2">
                  <Badge className="bg-primary/80">Cena {i + 1}</Badge>
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
              Refinar Detalhes
            </Button>
          </div>
        </div>
      )}

      {step === "refinement" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-headline font-bold text-accent">Consistência Visual</h2>
              <p className="text-muted-foreground">Cenas refinadas com identidade visual preservada.</p>
            </div>
            <Button variant="ghost" onClick={() => setStep("grid")}><ArrowLeft className="mr-2" /> Voltar</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {refinedImages.map((img, i) => (
              <div key={i} className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-accent/20 shadow-2xl">
                  <Image src={img} alt={`Cena Refinada ${i}`} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">Cena {i+1}</p>
                    <h3 className="font-bold text-lg">Visual Finalizado</h3>
                  </div>
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
              {loading ? <Loader2 className="mr-3 w-6 h-6 animate-spin" /> : <VideoIcon className="mr-3 w-6 h-6" />}
              {loading ? "Processando Movimento..." : "Gerar Clipes de Vídeo"}
            </Button>
          </div>
        </div>
      )}

      {step === "video" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-headline font-bold mb-4">Produção Concluída</h2>
            <p className="text-muted-foreground">Seu conteúdo visual de alta definição está pronto.</p>
          </div>

          <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
            {videos.map((vid, i) => (
              <div key={i} className="relative aspect-video rounded-2xl overflow-hidden border border-primary shadow-2xl bg-black">
                <video src={vid} controls className="w-full h-full object-contain" />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary glowing-accent">CENA {i+1}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
