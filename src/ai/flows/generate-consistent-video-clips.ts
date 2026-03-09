'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate 8-second video clips
 * for a sequence of cinematic scenes using the Veo-3.1 model.
 * It aims to ensure visual consistency and natural transitions between clips by using
 * scene descriptions and image references as input, and by leveraging the model's
 * capabilities for coherent video generation.
 *
 * - generateConsistentVideoClips - A function that orchestrates the video generation process for multiple scenes.
 * - GenerateConsistentVideoClipsInput - The input type for the generateConsistentVideoClips function.
 * - GenerateConsistentVideoClipsOutput - The return type for the generateConsistentVideoClips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Define the input schema for a single scene
const SceneInputSchema = z.object({
  sceneTextDescription: z
    .string()
    .describe(
      'Detailed textual description of the scene for video generation, including actions, emotions, and environment details to ensure continuity.'
    ),
  imageReferenceDataUri: z
    .string()
    .describe(
      "Data URI of the refined cinematic scene image, used as visual reference for the video generation. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

// Define the overall input schema for the flow
const GenerateConsistentVideoClipsInputSchema = z.object({
  scenes: z.array(SceneInputSchema).describe('An array of scene inputs, each containing a textual description and an image reference for video generation.'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3', '3:4']).describe('The aspect ratio for the generated videos.'),
});

export type GenerateConsistentVideoClipsInput = z.infer<typeof GenerateConsistentVideoClipsInputSchema>;

// Define the output schema for the flow
const GenerateConsistentVideoClipsOutputSchema = z.array(
  z.string().describe('Data URI of the generated 8-second video clip for a scene (e.g., data:video/mp4;base64,...).')
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
          model: googleAI.model('veo-3.1-generate-preview'), // Using the model specified in the PRD
          prompt: [
            { text: scene.sceneTextDescription },
            { media: { url: scene.imageReferenceDataUri } }, // Use the scene's reference image
          ],
          config: {
            aspectRatio: input.aspectRatio,
            // For Veo 3.1, durationSeconds is not configurable and defaults to 8 seconds.
            // personGeneration: 'allow_all' is the only option for Veo 3.1.
            personGeneration: 'allow_all',
          },
        });
        operation = generateResponse.operation;
      } catch (error) {
        console.error('Initial video generation request failed:', error);
        throw new Error('Failed to start video generation for a scene.');
      }


      if (!operation) {
        throw new Error('Expected the model to return an operation for video generation.');
      }

      // Poll the operation until it completes
      while (!operation.done) {
        // Sleep for a few seconds before checking again to avoid hammering the API
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
      }

      if (operation.error) {
        console.error('Video generation operation failed:', operation.error);
        throw new Error(`Failed to generate video: ${operation.error.message || 'Unknown error'}`);
      }

      const videoMediaPart = operation.output?.message?.content.find((p) => !!p.media && p.media.contentType?.startsWith('video/'));

      if (!videoMediaPart || !videoMediaPart.media?.url) {
        throw new Error('Failed to find the generated video media in the operation output.');
      }

      // The `media.url` from `operation.output` for Veo models is typically a temporary download URL
      // that requires an API key for access. To return it as a data URI to the client, we need
      // to fetch the video data and then base64 encode it.
      const fetch = (await import('node-fetch')).default; // Dynamically import node-fetch
      const videoDownloadResponse = await fetch(`${videoMediaPart.media.url}&key=${process.env.GEMINI_API_KEY}`);

      if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to fetch generated video: ${videoDownloadResponse.statusText}`);
      }

      const videoBuffer = await videoDownloadResponse.buffer(); // Get the video as a buffer
      const base64Video = videoBuffer.toString('base64');
      const contentType = videoMediaPart.media.contentType || 'video/mp4'; // Default to mp4 if not specified

      videoDataUris.push(`data:${contentType};base64,${base64Video}`);

      // NOTE ON CONTINUITY: The PRD requested extracting the last frame of the previous video
      // to use as the initial frame for the next. The Veo model API through Genkit does not
      // provide direct access to individual frames or a mechanism to automatically transfer
      // the "last frame" for continuity from a generated video. This implementation relies
      // on the 'imageReferenceDataUri' for each scene (which should already be consistent)
      // and the detailed 'sceneTextDescription' to guide the Veo model towards generating
      // visually consistent and naturally flowing video clips. It is assumed that the model's
      // understanding of the sequence and the strong visual and textual prompts will achieve
      // the desired continuity effect. If explicit frame extraction and injection is required,
      // it would necessitate external video processing libraries beyond the scope of Genkit's
      // core LLM interaction.
    }

    return videoDataUris;
  }
);
