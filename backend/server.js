import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import apiRouter from './routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database on Startup
initDb();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server if not imported by test suite
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] Salary Management Backend running on http://localhost:${PORT}`);
  });
}

export default app;
