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
          model: googleAI.model('veo-2.0-generate-001'),
          prompt: [
            { text: scene.sceneTextDescription },
            { media: { url: scene.imageReferenceDataUri } },
          ],
          config: {
            aspectRatio: input.aspectRatio,
          },
        });
        operation = generateResponse.operation;
      } catch (error) {
        throw new Error('Falha ao iniciar geração de vídeo.');
      }

      if (!operation) {
        throw new Error('Operação de vídeo não retornada pelo modelo.');
      }

      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
      }

      if (operation.error) {
        throw new Error(`Erro na geração: ${operation.error.message}`);
      }

      const videoMediaPart = operation.output?.message?.content.find((p) => !!p.media && p.media.contentType?.startsWith('video/'));

      if (!videoMediaPart || !videoMediaPart.media?.url) {
        throw new Error('Vídeo não encontrado no output.');
      }

      const fetch = (await import('node-fetch')).default;
      const videoDownloadResponse = await fetch(`${videoMediaPart.media.url}&key=${process.env.GEMINI_API_KEY}`);

      if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error('Falha ao baixar vídeo gerado.');
      }

      const videoBuffer = await videoDownloadResponse.buffer();
      const base64Video = videoBuffer.toString('base64');
      const contentType = videoMediaPart.media.contentType || 'video/mp4';

      videoDataUris.push(`data:${contentType};base64,${base64Video}`);
    }

    return videoDataUris;
  }
);
