import { Router, Request, Response } from 'express';
import { LLMClientFactory } from '../services/llm-client.factory';
import { ChatCompletionRequest, InternalChatCompletionRequest } from '../types/llm.types';
import { buildLLMConfig } from '../utils/provider.detector';
import { LLMConfigService } from '../services/llm-config.service';

const router = Router();

router.post('/chat/completions', async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substring(7);

  try {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Received chat completion request',
      requestId,
      body: req.body,
      timestamp: new Date().toISOString()
    }));

    const request: ChatCompletionRequest = req.body;

    if (!request.messages || !Array.isArray(request.messages)) {
      console.log(JSON.stringify({
        level: 'warn',
        message: 'Invalid request: messages array missing',
        requestId,
        timestamp: new Date().toISOString()
      }));
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Request validated, fetching LLM config',
      requestId,
      messageCount: request.messages.length,
      timestamp: new Date().toISOString()
    }));

    const llmConfigService = new LLMConfigService();
    const defaultConfig = await llmConfigService.getDefaultConfig();

    if (!defaultConfig) {
      console.log(JSON.stringify({
        level: 'error',
        message: 'No default LLM configuration found',
        requestId,
        timestamp: new Date().toISOString()
      }));
      res.status(500).json({
        error: 'No default LLM configuration found',
        message: 'Please configure a default LLM provider in the database'
      });
      return;
    }

    console.log(JSON.stringify({
      level: 'info',
      message: 'Building LLM config',
      requestId,
      provider: defaultConfig.providerName,
      model: defaultConfig.modelName,
      endpoint: defaultConfig.endpoint,
      timestamp: new Date().toISOString()
    }));

    const config = buildLLMConfig(
      defaultConfig.endpoint,
      defaultConfig.apiKey,
      defaultConfig.modelName
    );

    const internalRequest: InternalChatCompletionRequest = {
      messages: request.messages,
      endpoint: defaultConfig.endpoint,
      apiKey: defaultConfig.apiKey,
      model: defaultConfig.modelName,
      temperature: defaultConfig.temperature,
      maxTokens: defaultConfig.maxTokens
    };

    console.log(JSON.stringify({
      level: 'info',
      message: 'Sending request to LLM',
      requestId,
      messages: internalRequest.messages,
      model: internalRequest.model,
      temperature: internalRequest.temperature,
      maxTokens: internalRequest.maxTokens,
      timestamp: new Date().toISOString()
    }));

    const llmClient = new LLMClientFactory(config);
    const response = await llmClient.chatCompletion(internalRequest);

    console.log(JSON.stringify({
      level: 'info',
      message: 'LLM response received',
      requestId,
      response,
      timestamp: new Date().toISOString()
    }));

    res.json(response);
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Error processing chat completion',
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }));
    res.status(500).json({
      error: 'Failed to process chat completion',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'llm-engine'
  });
});

export default router;
