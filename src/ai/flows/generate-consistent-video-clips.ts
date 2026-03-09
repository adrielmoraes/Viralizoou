'use server';
/**
 * @fileOverview Gera clipes de vídeo cinematográficos com consistência visual.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const SceneInputSchema = z.object({
  sceneTextDescription: z.string().describe('Descrição textual da cena para geração de vídeo.'),
  imageReferenceDataUri: z.string().describe("Imagem de referência (data URI Base64)."),
});

const GenerateConsistentVideoClipsInputSchema = z.object({
  scenes: z.array(SceneInputSchema).describe('Array de cenas.'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3', '3:4']).describe('Proporção dos vídeos.'),
});

export type GenerateConsistentVideoClipsInput = z.infer<typeof GenerateConsistentVideoClipsInputSchema>;

const GenerateConsistentVideoClipsOutputSchema = z.array(
  z.string().describe('Data URI do vídeo gerado.')
);

export type GenerateConsistentVideoClipsOutput = z.infer<typeof GenerateConsistentVideoClipsOutputSchema>;

export async function generateConsistentVideoClips(input: GenerateConsistentVideoClipsInput): Promise<GenerateConsistentVideoClipsOutput> {
  return generateConsistentVideoClipsFlow(input);
}

const generateConsistentVideoClipsFlow = ai.defineFlow(
  {
    name: 'generateConsistentVideoClipsFlow',
    inputSchema: GenerateConsistentVideoClipsInputSchema,
    outputSchema: GenerateConsistentVideoClipsOutputSchema,
  },
  async (input) => {
    const videoDataUris: string[] = [];

    for (const scene of input.scenes) {
      let operation;
      try {
        const generateResponse = await ai.generate({
          model: googleAI.model('veo-3.0-generate-preview'),
          prompt: [
            { text: `Generate a high-quality cinematic video for this scene: ${scene.sceneTextDescription}. Keep the motion natural and maintain consistency with the provided reference image.` },
            { media: { url: scene.imageReferenceDataUri } },
          ],
        });
        operation = generateResponse.operation;
      } catch (error: any) {
        console.error('Erro ao iniciar geração de vídeo:', error?.message || error);
        continue;
      }

      if (!operation) continue;

      // Aguardar conclusão da operação
      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
      }

      if (operation.error) {
        console.error(`Erro no motor de vídeo: ${operation.error.message}`);
        continue;
      }

      const videoMediaPart = operation.output?.message?.content.find((p) => !!p.media && p.media.contentType?.startsWith('video/'));

      if (!videoMediaPart || !videoMediaPart.media?.url) continue;

      try {
        const videoDownloadResponse = await fetch(`${videoMediaPart.media.url}&key=${process.env.GEMINI_API_KEY}`);

        if (!videoDownloadResponse.ok) {
          console.error('Falha ao baixar vídeo gerado.');
          continue;
        }

        const videoArrayBuffer = await videoDownloadResponse.arrayBuffer();
        const videoBuffer = Buffer.from(videoArrayBuffer);
        const base64Video = videoBuffer.toString('base64');
        const contentType = videoMediaPart.media.contentType || 'video/mp4';

        videoDataUris.push(`data:${contentType};base64,${base64Video}`);
      } catch (e) {
        console.error('Erro ao processar buffer de vídeo:', e);
      }
    }

    if (videoDataUris.length === 0) {
      throw new Error('Não foi possível gerar os movimentos visuais solicitados.');
    }

    return videoDataUris;
  }
);
