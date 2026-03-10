
'use server';
/**
 * @fileOverview Gera capturas visuais iniciais para as cenas baseadas no roteiro.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSceneReferenceImagesInputSchema = z.object({
  scriptDetails: z.object({
    sceneDescriptions: z.array(z.string()).describe('Descrições das cenas.'),
    characterDescription: z.string().describe('Descrição do personagem.'),
  }),
  gridFormat: z.enum(['2x2', '2x3', '2x4', '2x5']).describe('Formato da grade.'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).describe('Proporção das imagens.'),
  resolution: z.enum(['1K', '2K']).describe('Resolução das imagens.'),
});
export type GenerateSceneReferenceImagesInput = z.infer<typeof GenerateSceneReferenceImagesInputSchema>;

const GenerateSceneReferenceImagesOutputSchema = z.object({
  referenceImageUrls: z.array(z.string()).describe('Data URIs das imagens geradas.'),
});
export type GenerateSceneReferenceImagesOutput = z.infer<typeof GenerateSceneReferenceImagesOutputSchema>;

function getNumberOfScenes(gridFormat: GenerateSceneReferenceImagesInput['gridFormat']): number {
  switch (gridFormat) {
    case '2x2': return 4;
    case '2x3': return 6;
    case '2x4': return 8;
    case '2x5': return 10;
    default: return 0;
  }
}

export async function generateSceneReferenceImages(input: GenerateSceneReferenceImagesInput): Promise<GenerateSceneReferenceImagesOutput> {
  return generateSceneReferenceImagesFlow(input);
}

const generateSceneReferenceImagesFlow = ai.defineFlow(
  {
    name: 'generateSceneReferenceImagesFlow',
    inputSchema: GenerateSceneReferenceImagesInputSchema,
    outputSchema: GenerateSceneReferenceImagesOutputSchema,
  },
  async (input) => {
    const { scriptDetails, gridFormat } = input;
    const numberOfScenes = getNumberOfScenes(gridFormat);
    const sceneDescriptionsToUse = (scriptDetails.sceneDescriptions || []).slice(0, numberOfScenes);
    const characterDescription = scriptDetails.characterDescription || "Protagonista central";

    const referenceImageUrls: string[] = [];

    for (let i = 0; i < sceneDescriptionsToUse.length; i++) {
      const scenePrompt = `Produção cinematográfica profissional de alta fidelidade: ${sceneDescriptionsToUse[i]}. Foco principal: ${characterDescription}. Estilo visual consistente, iluminação HDR, fotorrealismo extremo, composição limpa.`;

      try {
        const { candidates } = await ai.generate({
          model: 'googleai/gemini-pro-vision', // Changed model to googleai/gemini-pro-vision
          contents: [{ text: scenePrompt }],
        });

        if (candidates && candidates.length > 0 && candidates[0].media && candidates[0].media.length > 0) {
          referenceImageUrls.push(candidates[0].media[0].url);
        }
      } catch (error: any) {
        console.error("Error generating image for scene:", sceneDescriptionsToUse[i], error);
        // Silently continue to next scene if one fails, to return what was possible
      }
    }

    if (referenceImageUrls.length === 0) {
      throw new Error("Não foi possível gerar as capturas visuais. Por favor, revise sua descrição ou tente um número menor de cenas.");
    }

    return { referenceImageUrls };
  }
);
