// Optional HTTP Basic Auth for the whole app.
//
// When AUTH_USER and AUTH_PASSWORD are both set, every request (except the
// health check) must present matching Basic credentials. This is a good fit for
// a single-origin deployment: the browser prompts once, then attaches the
// credentials to every same-origin request — including the SPA's /api fetches —
// so no secret is ever baked into the frontend bundle.
//
// When the vars are unset, auth is disabled (convenient for local dev / mock
// mode). server.js logs a warning at startup in that case.

const crypto = require('crypto');

// Constant-time string comparison that tolerates differing lengths.
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function authEnabled() {
  return Boolean(process.env.AUTH_USER && process.env.AUTH_PASSWORD);
}

function basicAuth(req, res, next) {
  if (!authEnabled()) return next();

  // Keep the health check open so container liveness probes don't need creds.
  if (req.path === '/api/health') return next();

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString();
    const sep = decoded.indexOf(':');
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    if (safeEqual(user, process.env.AUTH_USER) && safeEqual(pass, process.env.AUTH_PASSWORD)) {
      return next();
    }
  }

  res.set('WWW-Authenticate', 'Basic realm="Azure Cost Dashboard"');
  return res.status(401).json({ error: true, message: 'Authentication required.' });
}

module.exports = basicAuth;
module.exports.authEnabled = authEnabled;
