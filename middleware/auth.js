import { verifyToken } from './admin.js';

/**
 * middleware to check admin status and set req.isAdmin
 * this runs on every request to determine if user is logged in as admin
 */
export function checkAdminStatus(req, res, next) {
  const token = req.cookies?.adminToken;
  if (token) {
    const decoded = verifyToken(token);
    req.isAdmin = decoded && decoded.isAdmin;
  } else {
    req.isAdmin = false;
  }
  next();
}
