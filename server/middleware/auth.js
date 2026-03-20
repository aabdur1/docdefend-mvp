import jwt from 'jsonwebtoken';

/**
 * Express middleware that resolves the Anthropic API key from auth headers.
 *
 * Priority:
 * 1. Authorization: Bearer <jwt> → verify → use server ANTHROPIC_API_KEY
 * 2. x-api-key header → use that key directly (bring-your-own-key)
 * 3. Neither → 401
 *
 * Sets req.anthropicKey for downstream use by getAnthropicClient().
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  // Path 1: JWT authentication
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(503).json({
        error: 'Authentication service unavailable',
        message: 'Server is not configured for password authentication. Please use an API key.',
      });
    }

    try {
      jwt.verify(token, jwtSecret);
    } catch {
      return res.status(401).json({
        error: 'Invalid or expired session',
        message: 'Your session has expired. Please sign in again.',
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        error: 'Server API key not configured',
        message: 'The server Anthropic API key is not set. Please contact the administrator.',
      });
    }

    req.anthropicKey = process.env.ANTHROPIC_API_KEY;
    return next();
  }

  // Path 2: Bring-your-own API key
  if (apiKey) {
    req.anthropicKey = apiKey;
    return next();
  }

  // Path 3: No auth
  return res.status(401).json({
    error: 'Authentication required',
    message: 'Please sign in or provide an Anthropic API key.',
  });
}
