import OpenAI from 'openai';
import { AzureOpenAI as AzureOpenAIClient } from 'openai';
import { LLMConfig, InternalChatCompletionRequest, ChatCompletionResponse } from '../types/llm.types';

export class LLMClientFactory {
  private config: LLMConfig;
  private client: OpenAI | AzureOpenAIClient;

  constructor(config: LLMConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  private createClient(): OpenAI | AzureOpenAIClient {
    if (this.config.provider === 'azure') {
      if (!this.config.endpoint || !this.config.deploymentName) {
        throw new Error('Azure provider requires endpoint and deploymentName');
      }

      return new AzureOpenAIClient({
        endpoint: this.config.endpoint,
        apiKey: this.config.apiKey,
        deployment: this.config.deploymentName,
        apiVersion: '2024-08-01-preview'
      });
    } else {
      return new OpenAI({
        apiKey: this.config.apiKey
      });
    }
  }

  async chatCompletion(request: InternalChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const params: any = {
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
        top_p: request.topP ?? 1,
        frequency_penalty: request.frequencyPenalty ?? 0,
        presence_penalty: request.presencePenalty ?? 0,
      };

      if (this.config.provider === 'azure') {
        params.model = this.config.deploymentName;
      } else {
        params.model = this.config.model ?? 'gpt-4o';
      }

      const completion = await this.client.chat.completions.create(params);

      return {
        id: completion.id,
        object: completion.object,
        created: completion.created,
        model: completion.model,
        choices: completion.choices.map((choice: any) => ({
          index: choice.index,
          message: {
            role: choice.message.role as 'system' | 'user' | 'assistant',
            content: choice.message.content || ''
          },
          finishReason: choice.finish_reason || 'stop'
        })),
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      throw new Error(`LLM API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getProviderInfo(): { provider: string; model?: string; deployment?: string } {
    return {
      provider: this.config.provider,
      model: this.config.model,
      deployment: this.config.deploymentName
    };
  }
}
