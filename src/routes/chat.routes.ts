import { Router, Request, Response } from 'express';
import { LLMClientFactory } from '../services/llm-client.factory';
import { ChatCompletionRequest } from '../types/llm.types';
import { buildLLMConfig } from '../utils/provider.detector';

const router = Router();

router.post('/chat/completions', async (req: Request, res: Response) => {
  try {
    const request: ChatCompletionRequest = req.body;

    if (!request.endpoint || typeof request.endpoint !== 'string') {
      res.status(400).json({ error: 'endpoint is required' });
      return;
    }

    if (!request.apiKey || typeof request.apiKey !== 'string') {
      res.status(400).json({ error: 'apiKey is required' });
      return;
    }

    if (!request.messages || !Array.isArray(request.messages)) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    const config = buildLLMConfig(
      request.endpoint,
      request.apiKey,
      request.deploymentName,
      request.model
    );

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
  res.json({
    status: 'healthy',
    service: 'llm-engine'
  });
});

export default router;
