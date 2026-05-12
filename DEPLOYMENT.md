# TrackTaps Deployment Guide

## Local Development

### Setup
```bash
npm install
```

### Development Mode (Frontend only with Vite)
```bash
npm run dev
```
This runs Vite dev server on `http://localhost:5173`

### Development Mode (Full Stack with API)
```bash
npm run build
npm run dev:server
```
This builds the frontend and runs the Express server on `http://localhost:3000` with both frontend and API routes.

### Production Build
```bash
npm run build
npm start
```
This builds the frontend and starts the production server.

---

## Vercel Deployment

### Prerequisites
1. Push code to GitHub/GitLab
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard

### Environment Variables (Add to Vercel)
```
RESEND_API_KEY=re_your_key_here
CONTACT_RECEIVER_EMAIL=your-email@example.com
NODE_ENV=production
```

### Deployment Steps
1. Push to main branch
2. Vercel automatically deploys
3. Server runs on `https://your-project.vercel.app`

### How It Works
- `npm run build` - Builds Vite frontend to `/dist`
- `npm start` - Starts Express server that:
  - Serves static files from `/dist`
  - Handles API routes (`/api/pod/*`)
  - Falls back to `index.html` for SPA routing

---

## Architecture

```
TrackTaps
├── src/                    # React frontend (Vite)
│   └── pages/Pod.jsx      # Pod dashboard component
├── api/                    # Express API handlers
│   └── pod/
│       ├── login.js       # POST /api/pod/login
│       ├── classrooms.js  # GET /api/pod/classrooms
│       └── attendance/
│           └── batch.js   # GET /api/pod/attendance/batch
├── server.mjs             # Express server
├── vite.config.js         # Vite configuration
├── vercel.json            # Vercel deployment config
└── package.json           # Dependencies & scripts
```

---

## Troubleshooting

### 404 NOT_FOUND on Vercel
- Ensure `npm run build` completes successfully
- Check that `/dist` folder is created
- Verify `server.mjs` is in root directory

### API calls failing
- Check browser console for actual error messages
- Verify Pod.ai credentials in environment variables
- Check Vercel logs: `vercel logs`

### Local development issues
- Clear `node_modules`: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Rebuild: `npm run build`

---

## API Endpoints

### Login
```
POST /api/pod/login
Body: { username, password }
Response: { auth_token, user: { name, email } }
```

### Get Classrooms
```
GET /api/pod/classrooms
Headers: Authorization: Token {auth_token}
Response: { classrooms: [...] }
```

### Get Attendance
```
GET /api/pod/attendance/batch?classroom={token}
Headers: Authorization: Token {auth_token}
Response: { total, attended, averagePercent, missed }
```
