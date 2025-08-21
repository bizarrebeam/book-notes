import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

/**
 * hash a password using bcrypt
 * @param {string} password - plain text password
 * @returns {Promise<string>} - hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * verify a password against a hash
 * @param {string} password - plain text password
 * @param {string} hash - hashed password
 * @returns {Promise<boolean>} - whether password matches
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * generate a jwt token for admin
 * @param {string} username - admin username
 * @returns {string} - jwt token
 */
export function generateToken(username) {
  return jwt.sign(
    { username, isAdmin: true },
    JWT_SECRET,
    { expiresIn: '7d' } // token expires in 7 days
  );
}

/**
 * verify a jwt token
 * @param {string} token - jwt token
 * @returns {object|null} - decoded token or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * middleware to require admin authentication
 */
export function requireAdmin(req, res, next) {
  const token = req.cookies?.adminToken;
  
  if (!token) {
    return res.redirect('/admin/login');
  }
  
  const decoded = verifyToken(token);
  if (!decoded || !decoded.isAdmin) {
    return res.redirect('/admin/login');
  }
  
  req.admin = decoded;
  next();
}

/**
 * check admin credentials against environment variables
 * @param {string} username - provided username
 * @param {string} password - provided password
 * @returns {Promise<boolean>} - whether credentials are valid
 */
export async function checkAdminCredentials(username, password) {
  if (!ADMIN_PASSWORD_HASH) {
    console.error('ADMIN_PASSWORD_HASH environment variable not set');
    return false;
  }
  
  if (username !== ADMIN_USERNAME) {
    return false;
  }
  
  return await verifyPassword(password, ADMIN_PASSWORD_HASH);
}