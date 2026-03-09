'use server';
/**
 * @fileOverview Gera um roteiro cinematográfico detalhado a partir de uma ideia inicial.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDetailedScriptFromPromptInputSchema = z.object({
  textInput: z.string().optional().describe('Uma ideia inicial para o projeto de vídeo.'),
  imageDataUri:
    z.string()
      .optional()
      .describe(
        "Uma imagem representando a ideia inicial (data URI Base64)."
      ),
  videoDataUri:
    z.string()
      .optional()
      .describe(
        "Um vídeo representando a ideia inicial (data URI Base64)."
      ),
  audioDataUri:
    z.string()
      .optional()
      .describe(
        "Um áudio representando a ideia inicial (data URI Base64)."
      ),
});

export type GenerateDetailedScriptFromPromptInput = z.infer<typeof GenerateDetailedScriptFromPromptInputSchema>;

const GenerateDetailedScriptFromPromptOutputSchema = z.object({
  synopsis: z.string().describe('Um resumo envolvente e conciso de toda a história.'),
  script: z.string().describe('O roteiro completo e detalhado, incluindo diálogos e ações.'),
  sceneDescriptions: z.array(z.string()).describe('Descrições visuais detalhadas para cada cena.'),
  characterDescriptions: z.array(z.string()).describe('Descrições abrangentes dos personagens principais para manter a consistência visual.'),
});

export type GenerateDetailedScriptFromPromptOutput = z.infer<typeof GenerateDetailedScriptFromPromptOutputSchema>;

export async function generateDetailedScriptFromPrompt(input: GenerateDetailedScriptFromPromptInput): Promise<GenerateDetailedScriptFromPromptOutput> {
  return generateDetailedScriptFromPromptFlow(input);
}

const detailedScriptPrompt = ai.definePrompt({
  name: 'detailedScriptPrompt',
  input: { schema: GenerateDetailedScriptFromPromptInputSchema },
  output: { schema: GenerateDetailedScriptFromPromptOutputSchema },
  prompt: `Você é um roteirista especializado em criar scripts cinematográficos curtos e impactantes. Seu objetivo é transformar uma ideia bruta em um roteiro detalhado para produção de vídeo. Cada cena deve ser ideal para um clipe de 8 segundos, focando na consistência visual de personagens e ambiente.

Gere o seguinte:
1. Sinopse: Resumo conciso.
2. Roteiro: Detalhado com diálogos e ações.
3. Descrições de Cena: Focadas em cenário, iluminação e ângulos de câmera (ex: Close Up, Low Angle).
4. Descrições de Personagem: Detalhes físicos e vestimentas para garantir que o personagem seja o mesmo em todas as cenas.

{{#if textInput}}
Ideia Inicial:
[INICIO DA IDEIA]
{{{textInput}}}
[FIM DA IDEIA]
{{else if imageDataUri}}
Ideia Inicial (Imagem): {{media url=imageDataUri}}
{{else if videoDataUri}}
Ideia Inicial (Vídeo): {{media url=videoDataUri}}
{{else if audioDataUri}}
Ideia Inicial (Áudio): {{media url=audioDataUri}}
{{else}}
ERRO: Nenhuma ideia fornecida.
{{/if}}`,
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
      throw new Error('Falha ao gerar o roteiro detalhado.');
    }
    return output;
  }
);
