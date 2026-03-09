'use server';
/**
 * @fileOverview A Genkit flow for recreating and enhancing cinematic scenes with consistency.
 *
 * - createConsistentCinematicScenes - A function that handles the scene enhancement process.
 * - CreateConsistentCinematicScenesInput - The input type for the createConsistentCinematicScenes function.
 * - CreateConsistentCinematicScenesOutput - The return type for the createConsistentCinematicScenes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CreateConsistentCinematicScenesInputSchema = z.object({
  referenceImageUri: z
    .string()
    .describe(
      "A reference image for the scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  sceneDescription: z
    .string()
    .describe(
      'A detailed text description of the scene, including desired camera angles, lighting, environment, and character actions, emphasizing cinematic language.'
    ),
  characterProfileDescription: z
    .string()
    .describe(
      'A detailed text description of the character\'s appearance, face, body, clothes, and any specific visual DNA to maintain consistency across scenes.'
    ),
  aspectRatio: z
    .enum(['1:1', '16:9', '9:16', '4:3', '3:4'])
    .describe('The desired aspect ratio for the output image.'),
  resolution: z
    .enum(['1K', '2K'])
    .describe('The desired resolution for the output image.'),
  negativePrompt: z
    .string()
    .optional()
    .describe('Optional text to describe elements to avoid in the generated image.'),
});
export type CreateConsistentCinematicScenesInput = z.infer<
  typeof CreateConsistentCinematicScenesInputSchema
>;

const CreateConsistentCinematicScenesOutputSchema = z.object({
  enhancedImageUri: z
    .string()
    .describe(
      "The generated, enhanced cinematographic image, as a data URI that includes a MIME type and uses Base64 encoding. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CreateConsistentCinematicScenesOutput = z.infer<
  typeof CreateConsistentCinematicScenesOutputSchema
>;

export async function createConsistentCinematicScenes(
  input: CreateConsistentCinematicScenesInput
): Promise<CreateConsistentCinematicScenesOutput> {
  return createConsistentCinematicScenesFlow(input);
}

const enhanceSceneImagePrompt = ai.definePrompt({
  name: 'enhanceSceneImagePrompt',
  input: { schema: CreateConsistentCinematicScenesInputSchema },
  output: { schema: CreateConsistentCinematicScenesOutputSchema },
  prompt: `You are an expert cinematographic visual artist tasked with enhancing a scene into an ultra-realistic, high-definition image, maintaining perfect visual consistency.

Instructions:
1. Recreate and enhance the provided reference image using the scene description and character profile.
2. Ensure ultra-realism, high definition, and cinematographic quality in terms of lighting, composition, and visual impact.
3. Maintain absolute consistency for the character: same face, body, clothes, lighting, environment, and color grading across all scenes. Use the provided character profile description as the definitive source for character consistency.
4. Apply the detailed scene description, incorporating appropriate cinematic camera shots (e.g., Extreme Long Shot, Long Shot, Medium Long Shot, Medium Shot, Medium Close Up, Close Up, Extreme Close Up, Low Angle Shot, High Angle Shot) where suitable.
5. The final image should adhere to an aspect ratio of {{{aspectRatio}}} and aim for a resolution of {{{resolution}}}.

Character Profile for Consistency: {{{characterProfileDescription}}}

Scene Description: {{{sceneDescription}}}

Elements to avoid (if any): {{{negativePrompt}}}

Reference Image: {{media url=referenceImageUri}}`,
});

const createConsistentCinematicScenesFlow = ai.defineFlow(
  {
    name: 'createConsistentCinematicScenesFlow',
    inputSchema: CreateConsistentCinematicScenesInputSchema,
    outputSchema: CreateConsistentCinematicScenesOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-3.1-flash-image-preview',
      prompt: [
        {
          text: enhanceSceneImagePrompt.prompt!,
        },
        {
          media: { url: input.referenceImageUri },
        },
      ],
      config: {
        // No direct config for output resolution or aspect ratio for gemini-3.1-flash-image-preview, conveying via prompt text.
        // If negativePrompt is provided, add it to the config.
        negativePrompt: input.negativePrompt || undefined,
      },
    });

    if (!media) {
      throw new Error('Failed to generate enhanced image.');
    }

    return {
      enhancedImageUri: media.url,
    };
  }
);
