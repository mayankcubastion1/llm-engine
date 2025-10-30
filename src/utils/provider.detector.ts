import { LLMConfig } from '../types/llm.types';

export function detectProvider(endpoint: string): 'azure' | 'openai' {
  const lowerEndpoint = endpoint.toLowerCase();

  if (lowerEndpoint.includes('azure.com') || lowerEndpoint.includes('openai.azure.com')) {
    return 'azure';
  }

  return 'openai';
}

export function buildLLMConfig(
  endpoint: string,
  apiKey: string,
  deploymentName?: string,
  model?: string
): LLMConfig {
  const provider = detectProvider(endpoint);

  if (provider === 'azure') {
    if (!deploymentName) {
      throw new Error('deploymentName is required for Azure OpenAI endpoints');
    }

    return {
      provider: 'azure',
      endpoint,
      apiKey,
      deploymentName
    };
  }

  return {
    provider: 'openai',
    apiKey,
    model: model || 'gpt-4o'
  };
}
