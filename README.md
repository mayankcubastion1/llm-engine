# LLM Engine

A unified API service that automatically routes requests to either Azure OpenAI or standard OpenAI based on configuration stored in a PostgreSQL database. This allows your applications to work with multiple LLM providers through a single, consistent interface without managing credentials in your application code.

## Features

- **Database-Driven Configuration**: LLM credentials and settings stored securely in PostgreSQL
- **Automatic Provider Detection**: Analyzes endpoint URLs to determine whether to use Azure OpenAI or standard OpenAI
- **Single API Interface**: One endpoint for all LLM requests, no credentials required in API calls
- **Encrypted API Keys**: API keys are encrypted at rest using AES encryption
- **TypeScript**: Fully typed for better development experience
- **Express-based**: Fast, minimal REST API

## How It Works

1. LLM configurations (endpoints, API keys, models) are stored in a PostgreSQL database table
2. API keys are encrypted using AES encryption before storage
3. The application fetches the default configuration from the database
4. When you make a chat completion request, you only send messages - the engine handles everything else
5. The engine automatically routes to the appropriate provider based on the stored configuration

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

Create a `.env` file:

```bash
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=llm_engine
DB_USER=postgres
DB_PASSWORD=postgres

# Encryption Key (must be 32 characters for AES-256)
API_KEY_ENCRYPTION_KEY=your-32-character-encryption-key
```

### Database Configuration

The application connects to an existing PostgreSQL database that contains the `ai_llm_configs` table. Ensure your database connection details are set correctly in the environment variables above.

**Expected Table Schema:**

The application expects the following table to exist in your database:

```sql
CREATE TABLE ai_llm_configs (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider_name llm_provider NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    temperature NUMERIC DEFAULT 0.7,
    max_tokens INT DEFAULT 2000,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**How It Works:**

- The application queries the table for the row where `is_default = TRUE`
- The `api_key_encrypted` field is decrypted using the `API_KEY_ENCRYPTION_KEY` environment variable
- For OpenAI providers, set `provider_name` to `'openai'`
- For Azure OpenAI providers, set `provider_name` to the full Azure endpoint URL (e.g., `'https://your-resource.openai.azure.com/'`)

## Running the Service

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Docker
```bash
# Build the image
docker build -t llm-engine .

# Run the container
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_NAME=llm_engine \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your-password \
  -e API_KEY_ENCRYPTION_KEY=your-32-character-key \
  llm-engine
```

## API Endpoints

### POST /api/chat/completions

Send chat completion requests. The engine automatically uses the default LLM configuration from the database.

#### Request Format

```bash
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

Note: Only send messages! All other parameters (temperature, max_tokens, model, credentials) are fetched from the database configuration.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | array | Yes | Array of message objects with `role` and `content` |

#### Response Format

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finishReason": "stop"
    }
  ],
  "usage": {
    "promptTokens": 10,
    "completionTokens": 9,
    "totalTokens": 19
  }
}
```

### GET /api/health

Check if the service is running.

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "service": "llm-engine"
}
```

## Architecture

```
src/
├── index.ts                      # Express app entry point
├── config/
│   └── database.config.ts       # PostgreSQL connection configuration
├── routes/
│   └── chat.routes.ts           # API route handlers
├── services/
│   ├── llm-client.factory.ts    # LLM client factory (handles both providers)
│   └── llm-config.service.ts    # Database service for LLM configs
├── utils/
│   ├── provider.detector.ts     # Provider detection logic
│   └── encryption.util.ts       # API key encryption/decryption
└── types/
    └── llm.types.ts             # TypeScript type definitions
```

## Integration Example

```typescript
async function callLLM(message: string) {
  const payload = {
    messages: [
      { role: 'user', content: message }
    ]
  };

  const response = await fetch('http://localhost:3000/api/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

// Simple - no credentials needed!
const response = await callLLM('Hello, how are you?');
console.log(response.choices[0].message.content);
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing required fields)
- `500` - Internal Server Error (LLM API errors)

Error response format:
```json
{
  "error": "Failed to process chat completion",
  "message": "Detailed error message"
}
```

## Deployment

### Jenkins Pipeline

The project includes a Jenkinsfile for CI/CD deployment. Required Jenkins parameters:

- `targetImage`: Docker image name (e.g., "llm-engine")
- `build_number`: Build number for image tagging
- `harbor_cred`: Harbor registry credentials ID
- `argocd_server`: ArgoCD server URL
- `argocd_appName`: ArgoCD application name
- `argocd_jenkinsDeployRole`: ArgoCD authentication token credential ID
- `argocd_statefuleset_name`: StatefulSet name to restart

The pipeline:
1. Clones the repository
2. Builds the Docker image
3. Pushes to Harbor registry
4. Restarts the StatefulSet via ArgoCD

## License

ISC