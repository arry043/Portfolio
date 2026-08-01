import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Attaches `req.user` when a valid Bearer token is present.
 * Does NOT reject the request when token is missing or invalid —
 * downstream handlers should check `req.user` to distinguish
 * guest from authenticated requests.
 */
export const optionalAuth = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer')) {
    return next();
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (user) {
      req.user = user;
    }
  } catch {
    // Token invalid or expired — continue as guest
  }

  next();
};
