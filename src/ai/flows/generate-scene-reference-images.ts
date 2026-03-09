'use server';
/**
 * @fileOverview Gera imagens de referência iniciais para as cenas baseadas no roteiro.
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
    const { scriptDetails, gridFormat, aspectRatio } = input;
    const numberOfScenes = getNumberOfScenes(gridFormat);
    const sceneDescriptionsToUse = (scriptDetails.sceneDescriptions || []).slice(0, numberOfScenes);
    const characterDescription = scriptDetails.characterDescription || "A central subject";

    const referenceImageUrls: string[] = [];

    // Processamento sequencial para garantir estabilidade visual
    for (let i = 0; i < sceneDescriptionsToUse.length; i++) {
      // Prompt simplificado para evitar bloqueios de filtros de segurança sensíveis
      const scenePrompt = `High-end cinematic production shot: ${sceneDescriptionsToUse[i]}. Focus: ${characterDescription}. Professional studio lighting, photorealistic style, high definition.`;

      try {
        const { media } = await ai.generate({
          model: 'googleai/imagen-3.0-generate-001',
          prompt: scenePrompt,
          config: {
            // Ajuste para permitir conteúdo criativo cinematográfico sem disparar falsos positivos
            safetySettings: [
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            ]
          }
        });

        if (media && media.url) {
          referenceImageUrls.push(media.url);
        } else {
          console.warn(`Aviso: Falha na captura da cena ${i + 1}.`);
        }
      } catch (error: any) {
        console.error(`Erro técnico na cena ${i + 1}:`, error?.message || error);
        // Continua para as próximas cenas mesmo em caso de erro individual
      }
    }

    if (referenceImageUrls.length === 0) {
      throw new Error("Não foi possível gerar os esboços visuais. Por favor, tente ajustar sua descrição para algo mais focado no cenário e personagem.");
    }

    return { referenceImageUrls };
  }
);
