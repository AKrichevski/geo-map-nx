import express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { setupSocketHandlers } from './websocket/socket-handlers';
import { setupRoutes } from './controllers';
import { initializeDatabase } from '@geo-map-app/db';

dotenv.config();

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3333;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  const app = express();
  const server = http.createServer(app);

  const corsOptions = {
    origin: isProd
      ? frontendUrl
      : ['http://localhost:4200', 'http://localhost:4201', 'http://localhost:4202'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  };

  const cors = await import('cors');

  app.use(cors.default(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const io = new Server(server, {
    cors: corsOptions
  });

  setupSocketHandlers(io);
  setupRoutes(app);

  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }

  if (isProd) {
    app.use(express.static(path.join(__dirname, '../../../map-client')));
    app.get('*', (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(__dirname, '../../../map-client/index.html'));
    });
  }

  server.listen(port, () => {
    console.log(`Listening at http://localhost:${port} (${isProd ? 'production' : 'development'} mode)`);
    console.log(`API base URL: http://localhost:${port}/api`);
    console.log(`WebSocket server running on the same port`);
  });
}

bootstrap().catch(err => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
