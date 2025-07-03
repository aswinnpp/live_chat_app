import express from "express";
const router = express.Router();

import {
  showLogin,
  showRegister,
  registerUser,
  loginUser,
  showChat,
  logoutUser
} from '../controllers/userController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';
import { renderAdminPage, blockUser, unblockUser,showAdminLogin,adminLogin,adminLogout } from '../controllers/adminController.js';
import User from '../models/Users.js';

router.get("/", (req, res) => res.redirect("/login"));

router.get("/login", showLogin);
router.get("/register", showRegister);

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/chat", authMiddleware, showChat);
router.get("/logout", logoutUser);

// Admin login routes
router.get('/admin/login', showAdminLogin);
router.post('/admin/login', adminLogin);
router.get('/admin/logout', adminLogout);


// Middleware to protect admin routes
async function requireAdmin(req, res, next) {
  if (req.cookies && req.cookies.admin === '1') {
    // Double-check user role in DB for extra security
    const admin = await User.findOne({ email: 'aswincp554@gmail.com' });
    if (admin && admin.role === 'admin') return next();
  }
  return res.redirect('/admin/login');
}

// Admin routes
router.get('/admin', requireAdmin, renderAdminPage);
router.post('/admin/block/:id', requireAdmin, blockUser);
router.post('/admin/unblock/:id', requireAdmin, unblockUser);

export default router;
