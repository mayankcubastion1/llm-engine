import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat.routes';
import { PORT } from './config/env.config';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', chatRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'LLM Engine API',
    endpoints: {
      health: 'GET /api/health',
      chatCompletions: 'POST /api/chat/completions'
    }
  });
});

app.listen(PORT, () => {
  console.log(`LLM Engine running on port ${PORT}`);
});
