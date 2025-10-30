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
      console.log(JSON.stringify({
        level: 'info',
        message: 'Fetching default LLM config from database',
        timestamp: new Date().toISOString()
      }));

      const result = await pool.query<LLMConfigRow>(
        'SELECT * FROM ai_llm_configs WHERE is_default = TRUE LIMIT 1'
      );

      console.log(JSON.stringify({
        level: 'info',
        message: 'Database query completed',
        rowsFound: result.rows.length,
        timestamp: new Date().toISOString()
      }));

      if (result.rows.length === 0) {
        console.log(JSON.stringify({
          level: 'warn',
          message: 'No default LLM config found in database',
          timestamp: new Date().toISOString()
        }));
        return null;
      }

      const config = result.rows[0];

      console.log(JSON.stringify({
        level: 'info',
        message: 'Default config found',
        configId: config.id,
        configName: config.name,
        provider: config.provider_name,
        model: config.model_name,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        timestamp: new Date().toISOString()
      }));

      const decryptedApiKey = decryptApiKey(config.api_key_encrypted);
      const endpoint = this.getEndpointFromProvider(config.provider_name);

      const decryptedConfig = {
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

      console.log(JSON.stringify({
        level: 'info',
        message: 'Config decrypted and processed successfully',
        configId: decryptedConfig.id,
        endpoint: decryptedConfig.endpoint,
        timestamp: new Date().toISOString()
      }));

      return decryptedConfig;
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Error fetching default LLM config',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }));
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
