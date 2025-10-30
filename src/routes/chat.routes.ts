import { Router, Request, Response } from 'express';
import { LLMClientFactory } from '../services/llm-client.factory';
import { getLLMConfig } from '../config/env.config';
import { ChatCompletionRequest } from '../types/llm.types';

const router = Router();

router.post('/chat/completions', async (req: Request, res: Response) => {
  try {
    const request: ChatCompletionRequest = req.body;

    if (!request.messages || !Array.isArray(request.messages)) {
      res.status(400).json({ error: 'Invalid request: messages array is required' });
      return;
    }

    const config = getLLMConfig();
    const llmClient = new LLMClientFactory(config);

    const response = await llmClient.chatCompletion(request);

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
  try {
    const config = getLLMConfig();
    const llmClient = new LLMClientFactory(config);
    const providerInfo = llmClient.getProviderInfo();

    res.json({
      status: 'healthy',
      provider: providerInfo
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
