'use server';
/**
 * @fileOverview A flow to generate initial reference images for scenes based on a detailed script.
 *
 * - generateSceneReferenceImages - A function that handles the image generation process.
 * - GenerateSceneReferenceImagesInput - The input type for the generateSceneReferenceImages function.
 * - GenerateSceneReferenceImagesOutput - The return type for the generateSceneReferenceImages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const GenerateSceneReferenceImagesInputSchema = z.object({
  scriptDetails: z.object({
    sceneDescriptions: z.array(z.string()).describe('Detailed descriptions for each scene.'),
    characterDescription: z.string().describe('A detailed description of the main character to maintain consistency.'),
  }).describe('The detailed script information for generating images.'),
  gridFormat: z.enum(['2x2', '2x3', '2x4', '2x5']).describe('The desired grid format, which determines the number of scenes to generate images for.'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).describe('The aspect ratio for the generated images (e.g., 16:9).'),
  resolution: z.enum(['1K', '2K']).describe('The desired resolution for the generated images (e.g., 1K for 1024x1024, 2K for 2048x2048).'),
});
export type GenerateSceneReferenceImagesInput = z.infer<typeof GenerateSceneReferenceImagesInputSchema>;

const GenerateSceneReferenceImagesOutputSchema = z.object({
  referenceImageUrls: z.array(z.string().url()).describe('An array of data URIs for the generated reference images.'),
});
export type GenerateSceneReferenceImagesOutput = z.infer<typeof GenerateSceneReferenceImagesOutputSchema>;

/**
 * Helper function to map grid format to the number of scenes/images to generate.
 */
function getNumberOfScenes(gridFormat: GenerateSceneReferenceImagesInput['gridFormat']): number {
  switch (gridFormat) {
    case '2x2':
      return 4;
    case '2x3':
      return 6;
    case '2x4':
      return 8;
    case '2x5':
      return 10;
    default:
      return 0; // Should not happen with enum validation
  }
}

/**
 * Generates initial reference images for scenes based on a detailed script and user-defined visual parameters.
 * Each image is generated using the gemini-3.1-flash-image-preview model.
 */
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
    const { scriptDetails, gridFormat, aspectRatio, resolution } = input;
    const numberOfScenes = getNumberOfScenes(gridFormat);
    // Ensure we don't try to generate more images than scene descriptions provided
    const sceneDescriptionsToUse = scriptDetails.sceneDescriptions.slice(0, numberOfScenes);
    const characterDescription = scriptDetails.characterDescription;

    const referenceImageUrls: string[] = [];

    // Construct prompt modifiers for resolution and aspect ratio
    const resolutionText = resolution === '1K' ? 'detailed, high-quality' : 'ultra-detailed, extremely high-resolution';
    const aspectRatioText = `in a ${aspectRatio} aspect ratio`;

    for (let i = 0; i < sceneDescriptionsToUse.length; i++) {
      const scenePrompt = `Generate a ${resolutionText} image of the following scene, keeping the main character described in mind. Strive for consistency in the character's appearance, clothing, and the environment across all images if possible. The image should be ${aspectRatioText} and cinematic.

Scene description: "${sceneDescriptionsToUse[i]}"
Character description: "${characterDescription}"`;

      const { media } = await ai.generate({
        model: googleAI.model('gemini-3.1-flash-image-preview'),
        prompt: scenePrompt,
      });

      if (media && media.url) {
        referenceImageUrls.push(media.url);
      } else {
        console.error(`Failed to generate image for scene ${i}: No media URL returned.`);
        throw new Error(`Failed to generate reference image for scene: "${sceneDescriptionsToUse[i]}".`);
      }
    }

    return { referenceImageUrls };
  }
);
