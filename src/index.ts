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
  console.log(JSON.stringify({
    level: 'info',
    message: 'Starting LLM Engine server',
    port: PORT,
    nodeEnv: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  }));

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Failed to connect to database. Exiting...',
      timestamp: new Date().toISOString()
    }));
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(JSON.stringify({
      level: 'info',
      message: 'LLM Engine server started successfully',
      port: PORT,
      endpoints: {
        root: '/',
        health: '/api/health',
        chatCompletions: '/api/chat/completions'
      },
      timestamp: new Date().toISOString()
    }));
  });
};

startServer();
