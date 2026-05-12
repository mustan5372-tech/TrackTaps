import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Import API handlers
import loginHandler from './api/pod/login.js';
import classroomsHandler from './api/pod/classrooms.js';
import attendanceHandler from './api/pod/attendance.js';
import contactHandler from './api/contact.js';

// API Routes
app.post('/api/pod/login', (req, res) => loginHandler(req, res));
app.get('/api/pod/classrooms', (req, res) => classroomsHandler(req, res));
app.get('/api/pod/attendance', (req, res) => attendanceHandler(req, res));
app.post('/api/contact', (req, res) => contactHandler(req, res));

// Serve static files from dist (built Vite app)
const distPath = join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  // Development mode - just show a message
  app.get('*', (req, res) => {
    res.json({ 
      message: 'TrackTaps API Server',
      status: 'running',
      note: 'Run "npm run build" to build the frontend'
    });
  });
}

app.listen(PORT, () => {
  console.log(`🚀 TrackTaps server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api/pod/`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/`);
});
