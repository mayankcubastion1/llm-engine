import { Router, Request, Response } from 'express';
import { LLMClientFactory } from '../services/llm-client.factory';
import { ChatCompletionRequest, InternalChatCompletionRequest } from '../types/llm.types';
import { buildLLMConfig } from '../utils/provider.detector';
import { LLMConfigService } from '../services/llm-config.service';

const router = Router();

router.post('/chat/completions', async (req: Request, res: Response) => {
  try {
    const request: ChatCompletionRequest = req.body;

    if (!request.messages || !Array.isArray(request.messages)) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const llmConfigService = new LLMConfigService();
    const defaultConfig = await llmConfigService.getDefaultConfig();

    if (!defaultConfig) {
      res.status(500).json({
        error: 'No default LLM configuration found',
        message: 'Please configure a default LLM provider in the database'
      });
      return;
    }

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

    const llmClient = new LLMClientFactory(config);
    const response = await llmClient.chatCompletion(internalRequest);

    res.json(response);
  } catch (error) {
    console.error('Error processing chat completion:', error);
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
