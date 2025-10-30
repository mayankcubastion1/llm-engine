import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.routes';
import { testConnection } from './config/database.config';

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

const startServer = async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`LLM Engine running on port ${PORT}`);
  });
};

startServer();
