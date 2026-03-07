const jwt = require('jsonwebtoken');
const { getSql } = require('../db/init');

/**
 * Authenticate JWT token from Authorization header.
 * Sets req.user with decoded data.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data
    const sql = getSql();
    const users = await sql`SELECT id, name, email, role, tenant_id, business_id FROM users WHERE id = ${decoded.id} AND is_active = true`;
    
    if (!users.length) {
      return res.status(401).json({
        success: false,
        error: 'User not found or deactivated.',
      });
    }

    req.user = users[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
  }
}

/**
 * Require specific role(s). Must be used after authenticate middleware.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Service-to-service authentication using SERVICE_KEY header.
 */
function serviceAuth(req, res, next) {
  const serviceKey = req.headers['x-service-key'];

  if (!serviceKey || serviceKey !== process.env.SERVICE_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Invalid service key.',
    });
  }

  next();
}

/**
 * Optional auth — doesn't fail if no token, just sets req.user if present.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sql = getSql();
    const users = await sql`SELECT id, name, email, role, tenant_id, business_id FROM users WHERE id = ${decoded.id} AND is_active = true`;
    if (users.length) {
      req.user = users[0];
    }
  } catch (err) {
    // Ignore errors for optional auth
  }

  next();
}

module.exports = { authenticate, authorize, serviceAuth, optionalAuth };
