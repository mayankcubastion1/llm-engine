import dotenv from 'dotenv';
import { LLMConfig } from '../types/llm.types';

dotenv.config();

export function getLLMConfig(): LLMConfig {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT;

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const openaiModel = process.env.OPENAI_MODEL;

  if (azureEndpoint && azureApiKey && azureDeployment) {
    return {
      provider: 'azure',
      endpoint: azureEndpoint,
      apiKey: azureApiKey,
      deploymentName: azureDeployment
    };
  }

  if (openaiApiKey) {
    return {
      provider: 'openai',
      apiKey: openaiApiKey,
      model: openaiModel || 'gpt-4o'
    };
  }

  throw new Error('No valid LLM configuration found. Please set either Azure or OpenAI environment variables.');
}

export const PORT = process.env.PORT || 3000;
