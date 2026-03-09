'use server';
/**
 * @fileOverview Recria e aprimora cenas cinematográficas com consistência visual.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CreateConsistentCinematicScenesInputSchema = z.object({
  referenceImageUri: z.string().describe("Imagem de referência (data URI Base64)."),
  sceneDescription: z.string().describe('Descrição detalhada da cena.'),
  characterProfileDescription: z.string().describe('Descrição visual do personagem.'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).describe('Proporção da imagem.'),
  resolution: z.enum(['1K', '2K']).describe('Resolução desejada.'),
  negativePrompt: z.string().optional().describe('Elementos a evitar.'),
});

export type CreateConsistentCinematicScenesInput = z.infer<typeof CreateConsistentCinematicScenesInputSchema>;

const CreateConsistentCinematicScenesOutputSchema = z.object({
  enhancedImageUri: z.string().describe("Imagem aprimorada (data URI Base64)."),
});

export type CreateConsistentCinematicScenesOutput = z.infer<typeof CreateConsistentCinematicScenesOutputSchema>;

export async function createConsistentCinematicScenes(
  input: CreateConsistentCinematicScenesInput
): Promise<CreateConsistentCinematicScenesOutput> {
  return createConsistentCinematicScenesFlow(input);
}

const createConsistentCinematicScenesFlow = ai.defineFlow(
  {
    name: 'createConsistentCinematicScenesFlow',
    inputSchema: CreateConsistentCinematicScenesInputSchema,
    outputSchema: CreateConsistentCinematicScenesOutputSchema,
  },
  async (input) => {
    try {
      const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { text: `Enhance this cinematic scene keeping visual identity consistent: ${input.characterProfileDescription}. Scene details: ${input.sceneDescription}. Style: Ultra-realistic, 4k.` },
          { media: { url: input.referenceImageUri } },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          ]
        }
      });

      if (!media) {
        throw new Error('Falha no refinamento visual.');
      }

      return { enhancedImageUri: media.url };
    } catch (error) {
      console.error('Erro no refinamento:', error);
      throw new Error('Erro ao processar refinamento visual.');
    }
  }
);
