import { pool } from '../src/config/database.config';
import { encryptApiKey } from '../src/utils/encryption.util';
import dotenv from 'dotenv';

dotenv.config();

interface ConfigInput {
  name: string;
  providerName: string;
  modelName: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  isDefault?: boolean;
}

async function insertConfig(config: ConfigInput) {
  try {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Inserting LLM configuration',
      name: config.name,
      provider: config.providerName,
      model: config.modelName,
      timestamp: new Date().toISOString()
    }));

    const encryptedApiKey = encryptApiKey(config.apiKey);

    const result = await pool.query(
      `INSERT INTO ai_llm_configs
       (name, provider_name, model_name, api_key_encrypted, temperature, max_tokens, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, provider_name, model_name, is_default`,
      [
        config.name,
        config.providerName,
        config.modelName,
        encryptedApiKey,
        config.temperature || 0.7,
        config.maxTokens || 1000,
        config.isDefault !== undefined ? config.isDefault : true
      ]
    );

    console.log(JSON.stringify({
      level: 'info',
      message: 'Configuration inserted successfully',
      result: result.rows[0],
      timestamp: new Date().toISOString()
    }));

    return result.rows[0];
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to insert configuration',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }));
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.log(`
Usage: tsx scripts/insert-config.ts <name> <provider> <model> <apiKey> [temperature] [maxTokens] [isDefault]

Examples:
  tsx scripts/insert-config.ts "Production GPT-4" "openai" "gpt-4" "sk-..." 0.7 2000 true
  tsx scripts/insert-config.ts "Azure GPT-35" "azure-openai" "gpt-35-turbo" "your-key" 0.5 1500 false

Providers:
  - openai (OpenAI API)
  - azure-openai (Azure OpenAI, provide full endpoint URL as provider)
  - Or any custom endpoint URL
    `);
    process.exit(1);
  }

  const config: ConfigInput = {
    name: args[0],
    providerName: args[1],
    modelName: args[2],
    apiKey: args[3],
    temperature: args[4] ? parseFloat(args[4]) : 0.7,
    maxTokens: args[5] ? parseInt(args[5]) : 1000,
    isDefault: args[6] ? args[6].toLowerCase() === 'true' : true
  };

  await insertConfig(config);

  await pool.end();
  console.log(JSON.stringify({
    level: 'info',
    message: 'Script completed',
    timestamp: new Date().toISOString()
  }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Script failed',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString()
  }));
  process.exit(1);
});
