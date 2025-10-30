# LLM Engine

A unified API service that automatically routes requests to either Azure OpenAI or standard OpenAI based on the endpoint provided in each request. This allows your applications to work with multiple LLM providers through a single, consistent interface.

## Features

- **Automatic Provider Detection**: Analyzes endpoint URLs to determine whether to use Azure OpenAI or standard OpenAI
- **Single API Interface**: One endpoint for all LLM requests, regardless of provider
- **Request-Level Credentials**: Pass credentials with each request for maximum flexibility
- **TypeScript**: Fully typed for better development experience
- **Express-based**: Fast, minimal REST API

## How It Works

The engine examines the `endpoint` field in each request:
- URLs containing `azure.com` or `openai.azure.com` → Azure OpenAI
- All other URLs → Standard OpenAI

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```bash
PORT=3000
```

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

## API Endpoints

### POST /api/chat/completions

Send chat completion requests to either Azure OpenAI or standard OpenAI.

#### Azure OpenAI Example

```bash
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://your-resource.openai.azure.com/",
    "apiKey": "your-azure-api-key",
    "deploymentName": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "maxTokens": 1000
  }'
```

#### Standard OpenAI Example

```bash
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://api.openai.com/v1",
    "apiKey": "your-openai-api-key",
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "maxTokens": 1000
  }'
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `endpoint` | string | Yes | The LLM provider endpoint URL |
| `apiKey` | string | Yes | API key for authentication |
| `deploymentName` | string | Azure only | Deployment name (required for Azure) |
| `model` | string | OpenAI only | Model name (e.g., "gpt-4o", defaults to "gpt-4o") |
| `messages` | array | Yes | Array of message objects with `role` and `content` |
| `temperature` | number | No | Sampling temperature (0-2, default: 0.7) |
| `maxTokens` | number | No | Maximum tokens to generate (default: 1000) |
| `topP` | number | No | Nucleus sampling parameter (default: 1) |
| `frequencyPenalty` | number | No | Frequency penalty (default: 0) |
| `presencePenalty` | number | No | Presence penalty (default: 0) |

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
├── routes/
│   └── chat.routes.ts           # API route handlers
├── services/
│   └── llm-client.factory.ts    # LLM client factory (handles both providers)
├── utils/
│   └── provider.detector.ts     # Provider detection logic
└── types/
    └── llm.types.ts             # TypeScript type definitions
```

## Integration Example

```typescript
async function callLLM(endpoint: string, apiKey: string, deploymentOrModel: string) {
  const isAzure = endpoint.includes('azure.com');

  const payload = {
    endpoint,
    apiKey,
    ...(isAzure
      ? { deploymentName: deploymentOrModel }
      : { model: deploymentOrModel }
    ),
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  };

  const response = await fetch('http://localhost:3000/api/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return await response.json();
}
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

## License

ISC