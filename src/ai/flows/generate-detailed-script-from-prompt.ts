'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate a detailed cinematic script
 * from an initial user idea, which can be text, image, video, or audio.
 *
 * - generateDetailedScriptFromPrompt - A function that orchestrates the script generation process.
 * - GenerateDetailedScriptFromPromptInput - The input type for the generateDetailedScriptFromPrompt function.
 * - GenerateDetailedScriptFromPromptOutput - The return type for the generateDetailedScriptFromPrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDetailedScriptFromPromptInputSchema = z.object({
  textInput: z.string().optional().describe('A text input describing the initial idea for the video project.'),
  imageDataUri:
    z.string()
      .optional()
      .describe(
        "An image representing the initial idea, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
  videoDataUri:
    z.string()
      .optional()
      .describe(
        "A video representing the initial idea, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
  audioDataUri:
    z.string()
      .optional()
      .describe(
        "An audio clip representing the initial idea, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
}).describe('Input for generating a detailed script, which can be text or a media data URI.');

export type GenerateDetailedScriptFromPromptInput = z.infer<typeof GenerateDetailedScriptFromPromptInputSchema>;

const GenerateDetailedScriptFromPromptOutputSchema = z.object({
  synopsis: z.string().describe('A compelling and concise summary of the entire story.'),
  script: z.string().describe('The full, detailed script including dialogue, actions, and transitions, broken down into distinct scene segments.'),
  sceneDescriptions: z.array(z.string()).describe('Detailed visual descriptions for each scene, including setting, time of day, mood, key actions, and suggested cinematic camera angles or movements.'),
  characterDescriptions: z.array(z.string()).describe('Comprehensive descriptions for all main characters, including physical appearance, personality traits, and any unique characteristics for visual consistency.'),
}).describe('Output containing the detailed cinematic script, scene descriptions, and character details.');

export type GenerateDetailedScriptFromPromptOutput = z.infer<typeof GenerateDetailedScriptFromPromptOutputSchema>;

export async function generateDetailedScriptFromPrompt(input: GenerateDetailedScriptFromPromptInput): Promise<GenerateDetailedScriptFromPromptOutput> {
  return generateDetailedScriptFromPromptFlow(input);
}

const detailedScriptPrompt = ai.definePrompt({
  name: 'detailedScriptPrompt',
  input: { schema: GenerateDetailedScriptFromPromptInputSchema },
  output: { schema: GenerateDetailedScriptFromPromptOutputSchema },
  prompt: `You are an expert scriptwriter and creative director specializing in creating compelling, short cinematic video scripts. Your goal is to take a raw idea and develop it into a detailed script, ready for video production. Each scene in the generated script should be concise, ideally suitable for an 8-second video clip, and designed to ensure visual consistency in terms of characters, environment, and lighting across the entire narrative.

Based on the provided initial input, generate the following:
1.  **Synopsis**: A compelling and concise summary of the entire story.
2.  **Script**: A full, detailed script including dialogue (if any), actions, and transitions, broken down into distinct scene segments.
3.  **Scene Descriptions**: For each scene in the script, provide a detailed visual description. This should include the setting, time of day, mood, key actions, and suggested cinematic camera angles or movements (e.g., 'Extreme Long Shot', 'Close Up', 'Low Angle Shot') to evoke the desired feeling. Remember to describe elements that ensure environmental consistency.
4.  **Character Descriptions**: Provide comprehensive descriptions for all main characters. Include their physical appearance (e.g., hair color, clothing style, distinctive features), personality traits, and any unique characteristics that would help maintain visual consistency across different scenes (e.g., a specific prop they carry, a particular gait). This is crucial for maintaining character consistency in subsequent production steps.

Focus on creating a visually rich narrative that can be translated into short, impactful video clips.

{{#if textInput}}
Initial Idea:
[START OF IDEA]
{{{textInput}}}
[END OF IDEA]
{{else if imageDataUri}}
Initial Idea (Image): {{media url=imageDataUri}}
{{else if videoDataUri}}
Initial Idea (Video): {{media url=videoDataUri}}
{{else if audioDataUri}}
Initial Idea (Audio): {{media url=audioDataUri}}
{{else}}
**ERROR**: No initial idea input was provided.
{{/if}}

Your output MUST be a JSON object, strictly adhering to the following schema:
{{jsonSchema GenerateDetailedScriptFromPromptOutputSchema}}
`,
});

const generateDetailedScriptFromPromptFlow = ai.defineFlow(
  {
    name: 'generateDetailedScriptFromPromptFlow',
    inputSchema: GenerateDetailedScriptFromPromptInputSchema,
    outputSchema: GenerateDetailedScriptFromPromptOutputSchema,
  },
  async (input) => {
    const { output } = await detailedScriptPrompt(input);
    if (!output) {
      throw new Error('Failed to generate detailed script: output was null or undefined.');
    }
    return output;
  }
);
