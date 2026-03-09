
'use server';
/**
 * @fileOverview Finalização e aprimoramento de capturas com consistência visual profissional.
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
        model: 'googleai/gemini-3.1-flash-image-preview',
        prompt: [
          { text: `Finalização visual ultra-realista. Preserve a identidade visual idêntica: ${input.characterProfileDescription}. Detalhes da cena: ${input.sceneDescription}. Estilo: 4K, iluminação profissional cinematográfica, texturas detalhadas.` },
          { media: { url: input.referenceImageUri } },
        ],
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
          ]
        }
      });

      if (!media) {
        throw new Error('Falha no aprimoramento visual.');
      }

      return { enhancedImageUri: media.url };
    } catch (error) {
      throw new Error('Erro ao processar o aprimoramento visual das cenas.');
    }
  }
);
