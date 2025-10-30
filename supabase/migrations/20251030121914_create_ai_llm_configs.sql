/*
  # Create AI LLM Configurations Table

  1. New Tables
    - `ai_llm_configs`
      - `id` (uuid, primary key) - Unique identifier for each config
      - `name` (text) - Friendly name for the configuration (e.g., "Production GPT-4")
      - `provider_name` (text) - Provider identifier (e.g., "openai", "azure-openai")
      - `model_name` (text) - Model identifier (e.g., "gpt-4", "gpt-3.5-turbo")
      - `api_key_encrypted` (text) - Encrypted API key
      - `temperature` (numeric) - Model temperature setting (0.0-2.0)
      - `max_tokens` (integer) - Maximum tokens for completion
      - `is_default` (boolean) - Whether this is the default configuration
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `ai_llm_configs` table
    - Add policy for authenticated users to read configs
    - Add policy for authenticated users to manage configs

  3. Constraints
    - Only one config can be set as default at a time
    - Provider name and model name are required fields
    
  4. Important Notes
    - API keys should be encrypted before storing
    - Temperature should be between 0.0 and 2.0
    - Max tokens should be positive
*/

CREATE TABLE IF NOT EXISTS ai_llm_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_name text NOT NULL,
  model_name text NOT NULL,
  api_key_encrypted text NOT NULL,
  temperature numeric DEFAULT 0.7 CHECK (temperature >= 0.0 AND temperature <= 2.0),
  max_tokens integer DEFAULT 1000 CHECK (max_tokens > 0),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_llm_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read configs"
  ON ai_llm_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert configs"
  ON ai_llm_configs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update configs"
  ON ai_llm_configs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete configs"
  ON ai_llm_configs FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_ai_llm_configs_is_default ON ai_llm_configs(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_ai_llm_configs_provider ON ai_llm_configs(provider_name);

CREATE OR REPLACE FUNCTION ensure_single_default_llm_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE ai_llm_configs 
    SET is_default = false 
    WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_llm_config
  BEFORE INSERT OR UPDATE ON ai_llm_configs
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_llm_config();