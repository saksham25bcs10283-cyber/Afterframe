import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB, getDbStatus } from './config/db.js';
import { isTmdbConfigured } from './services/tmdb.js';

import authRoutes from './routes/authRoutes.js';
import tmdbRoutes from './routes/tmdbRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Health & diagnostics endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDbStatus();
  const tmdbReady = isTmdbConfigured();

  const isHealthy = dbStatus.connected && tmdbReady;

  res.json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'AfterFrame API',
    version: '1.0.0',
    tagline: "The film doesn't end at the credits.",
    database: {
      connected: dbStatus.connected,
      uriConfigured: dbStatus.uriConfigured,
      readyState: dbStatus.readyState,
      error: dbStatus.error
    },
    tmdb: {
      configured: tmdbReady,
      note: tmdbReady ? 'Live TMDB API connected' : 'Using curated offline catalog until TMDB credentials are added to server/.env'
    },
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/events', eventRoutes);

// 404 Route Handler for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint Not Found',
    path: req.originalUrl,
    message: 'The requested AfterFrame API route does not exist.'
  });
});

// Production Client Static Asset Serving & SPA Fallback
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[AfterFrame Server] Running on http://localhost:${PORT}`);
    console.log(`[AfterFrame Server] TMDB configured: ${isTmdbConfigured()}`);
  });
}

export default app;
