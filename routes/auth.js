import express from 'express';
import { checkAdminCredentials, generateToken } from '../middleware/admin.js';

const router = express.Router();

/**
 * admin login page
 * @route GET /admin/login
 */
router.get("/admin/login", (req, res) => {
  res.render("admin/login.ejs");
});

/**
 * handle admin login
 * @route POST /admin/login
 */
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const isValid = await checkAdminCredentials(username, password);
    
    if (isValid) {
      const token = generateToken(username);
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      res.redirect('/');
    } else {
      res.render("admin/login.ejs", { error: "invalid credentials" });
    }
  } catch (err) {
    console.error("login error:", err);
    res.render("admin/login.ejs", { error: "login failed" });
  }
});

/**
 * admin logout
 * @route POST /admin/logout
 */
router.post("/admin/logout", (req, res) => {
  res.clearCookie('adminToken');
  res.redirect('/');
});

export default router;
