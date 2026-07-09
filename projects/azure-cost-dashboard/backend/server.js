// Azure Cost Visibility Dashboard - Express server entry point.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const costsRouter = require('./routes/costs');
const alertsRouter = require('./routes/alerts');
const logicAppsRouter = require('./routes/logicapps');
const analystRouter = require('./routes/analyst');
const idleRouter = require('./routes/idle');
const errorHandler = require('./middleware/errorHandler');
const basicAuth = require('./middleware/basicAuth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Optional HTTP Basic Auth — enforced only when AUTH_USER/AUTH_PASSWORD are set.
// Applied before routes and static assets so it guards the whole app.
app.use(basicAuth);

// Health check (exempt from auth inside the middleware).
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/costs', costsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/logicapps', logicAppsRouter);
app.use('/api/analyst', analystRouter);
app.use('/api/idle', idleRouter);

// In a production build, serve the compiled frontend from this same origin so
// the SPA and its /api calls share one host (and one set of Basic credentials).
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: any non-API route returns index.html.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Central error handler — must be registered after routes.
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Azure Cost Dashboard backend listening on port ${PORT}`);
  if (!basicAuth.authEnabled()) {
    // eslint-disable-next-line no-console
    console.warn(
      '[auth] AUTH_USER/AUTH_PASSWORD not set — API is unauthenticated. Set both before exposing this server.'
    );
  }
});

module.exports = app;
