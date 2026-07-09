import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { journalRoutes } from './routes/journal';
import { habitsRoutes } from './routes/habits';
import { planningRoutes } from './routes/planning';
import { bibleRoutes } from './routes/bible';

const app = new Hono();

app.use('*', cors({
  origin: 'http://localhost:3000',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.route('/api/auth', authRoutes);
app.use('/api/journal/*', authMiddleware);
app.route('/api/journal', journalRoutes);
app.use('/api/habits/*', authMiddleware);
app.route('/api/habits', habitsRoutes);
app.use('/api/planning/*', authMiddleware);
app.route('/api/planning', planningRoutes);
app.use('/api/bible/*', authMiddleware);
app.route('/api/bible', bibleRoutes);

export { app };
