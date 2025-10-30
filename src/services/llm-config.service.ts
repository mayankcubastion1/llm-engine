import { pool } from '../config/database.config';
import { decryptApiKey } from '../utils/encryption.util';

export interface LLMConfigRow {
  id: string;
  name: string;
  provider_name: string;
  model_name: string;
  api_key_encrypted: string;
  temperature: number;
  max_tokens: number;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LLMConfigDecrypted {
  id: string;
  name: string;
  providerName: string;
  modelName: string;
  apiKey: string;
  endpoint: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
}

export class LLMConfigService {
  async getDefaultConfig(): Promise<LLMConfigDecrypted | null> {
    try {
      const result = await pool.query<LLMConfigRow>(
        'SELECT * FROM ai_llm_configs WHERE is_default = TRUE LIMIT 1'
      );

      if (result.rows.length === 0) {
        return null;
      }

      const config = result.rows[0];
      const decryptedApiKey = decryptApiKey(config.api_key_encrypted);
      const endpoint = this.getEndpointFromProvider(config.provider_name);

      return {
        id: config.id,
        name: config.name,
        providerName: config.provider_name,
        modelName: config.model_name,
        apiKey: decryptedApiKey,
        endpoint,
        temperature: Number(config.temperature),
        maxTokens: config.max_tokens,
        isDefault: config.is_default,
      };
    } catch (error) {
      console.error('Error fetching default LLM config:', error);
      throw error;
    }
  }

  private getEndpointFromProvider(providerName: string): string {
    const lowerProvider = providerName.toLowerCase();

    if (lowerProvider.includes('azure')) {
      return lowerProvider;
    }

    if (lowerProvider.includes('openai')) {
      return 'https://api.openai.com/v1';
    }

    return lowerProvider;
  }
}
