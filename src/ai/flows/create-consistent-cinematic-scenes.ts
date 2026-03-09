'use server';
/**
 * @fileOverview Recria e aprimora cenas cinematográficas com consistência visual.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CreateConsistentCinematicScenesInputSchema = z.object({
  referenceImageUri: z.string().describe("Imagem de referência (data URI Base64)."),
  sceneDescription: z.string().describe('Descrição detalhada da cena.'),
  characterProfileDescription: z.string().describe('Descrição visual do personagem para manter consistência.'),
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

const enhanceSceneImagePrompt = ai.definePrompt({
  name: 'enhanceSceneImagePrompt',
  input: { schema: CreateConsistentCinematicScenesInputSchema },
  output: { schema: CreateConsistentCinematicScenesOutputSchema },
  prompt: `Você é um artista visual especializado em cinematografia. Sua tarefa é aprimorar uma cena em uma imagem ultra-realista de alta definição, mantendo consistência visual perfeita.

Instruções:
1. Recrie a imagem de referência usando a descrição da cena e o perfil do personagem.
2. Garanta qualidade cinematográfica em iluminação e composição.
3. Mantenha o personagem idêntico: mesmo rosto, corpo e roupas em todas as cenas.
4. Aplique a proporção {{{aspectRatio}}} e resolução {{{resolution}}}.

Perfil do Personagem: {{{characterProfileDescription}}}
Descrição da Cena: {{{sceneDescription}}}
Evitar: {{{negativePrompt}}}

Referência: {{media url=referenceImageUri}}`,
});

const createConsistentCinematicScenesFlow = ai.defineFlow(
  {
    name: 'createConsistentCinematicScenesFlow',
    inputSchema: CreateConsistentCinematicScenesInputSchema,
    outputSchema: CreateConsistentCinematicScenesOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: [
        { text: enhanceSceneImagePrompt.prompt! },
        { media: { url: input.referenceImageUri } },
      ],
      config: {
        negativePrompt: input.negativePrompt || undefined,
      },
    });

    if (!media) {
      throw new Error('Falha ao gerar imagem aprimorada.');
    }

    return { enhancedImageUri: media.url };
  }
);
