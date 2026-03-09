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
  prompt: `Você é um roteirista especializado em criar planos de produção cinematográfica. Seu objetivo é transformar uma visão bruta em um roteiro detalhado para produção de vídeo consistente.

Gere o seguinte:
1. Sinopse: Resumo impactante.
2. Roteiro: Detalhado com diálogos e ações cinematográficas.
3. Descrições de Cena: Focadas em cenário, iluminação e ângulos de câmera profissionais.
4. Identidade de Personagem: Detalhes visuais únicos para garantir consistência em todos os clipes.

{{#if textInput}}
Visão Inicial do Diretor:
[INICIO]
{{{textInput}}}
[FIM]
{{else if imageDataUri}}
Referência Visual Fornecida: {{media url=imageDataUri}}
{{else if videoDataUri}}
Referência em Movimento Fornecida: {{media url=videoDataUri}}
{{else if audioDataUri}}
Visão em Áudio Fornecida: {{media url=audioDataUri}}
{{else}}
ERRO: Nenhuma referência criativa foi fornecida.
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
      throw new Error('Falha ao processar o roteiro criativo.');
    }
    return output;
  }
);
