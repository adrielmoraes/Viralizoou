
'use server';
/**
 * @fileOverview Geração de clipes cinematográficos com fluidez e consistência.
 * Usa veo-3.1-generate-preview conforme PRD.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const SceneInputSchema = z.object({
  sceneTextDescription: z.string().describe('Descrição textual da cena para geração de movimento.'),
  imageReferenceDataUri: z.string().describe("Imagem de referência final (data URI Base64)."),
});

const GenerateConsistentVideoClipsInputSchema = z.object({
  scenes: z.array(SceneInputSchema).describe('Array de cenas.'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3', '3:4']).describe('Proporção dos vídeos.'),
});

export type GenerateConsistentVideoClipsInput = z.infer<typeof GenerateConsistentVideoClipsInputSchema>;

const GenerateConsistentVideoClipsOutputSchema = z.array(
  z.string().describe('Data URI do clipe gerado.')
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
          model: googleAI.model('veo-3.1-generate-preview'),
          prompt: [
            { text: `Gere movimento natural e cinematográfico para esta cena: ${scene.sceneTextDescription}. Mantenha fidelidade total à imagem de referência fornecida. Crie 8 segundos de vídeo com movimentos suaves e cinematográficos.` },
            { media: { url: scene.imageReferenceDataUri } },
          ],
        });
        operation = generateResponse.operation;
      } catch (error: any) {
        console.error('Erro ao iniciar processamento de movimento:', error?.message || error);
        continue;
      }

      if (!operation) continue;

      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
      }

      if (operation.error) {
        console.error(`Falha no motor de movimento: ${operation.error.message}`);
        continue;
      }

      const videoMediaPart = operation.output?.message?.content.find((p) => !!p.media && p.media.contentType?.startsWith('video/'));

      if (!videoMediaPart || !videoMediaPart.media?.url) continue;

      try {
        const videoDownloadResponse = await fetch(`${videoMediaPart.media.url}&key=${process.env.GEMINI_API_KEY}`);

        if (!videoDownloadResponse.ok) continue;

        const videoArrayBuffer = await videoDownloadResponse.arrayBuffer();
        const videoBuffer = Buffer.from(videoArrayBuffer);
        const base64Video = videoBuffer.toString('base64');
        const contentType = videoMediaPart.media.contentType || 'video/mp4';

        videoDataUris.push(`data:${contentType};base64,${base64Video}`);
      } catch (e) {
        console.error('Erro ao processar mídia final:', e);
      }
    }

    if (videoDataUris.length === 0) {
      throw new Error('Não foi possível gerar os movimentos cinematográficos solicitados.');
    }

    return videoDataUris;
  }
);
