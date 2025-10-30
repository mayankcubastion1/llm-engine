import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.routes';

dotenv.config();

const PORT = process.env.PORT || 3000;
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
