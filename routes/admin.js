import express from 'express';
import { renderAdminPage, blockUser, unblockUser, showAdminLogin, adminLogin ,adminLogout} from '../controllers/adminController.js';
import User from '../models/Users.js';

const router = express.Router();

// Middleware to protect admin routes
async function requireAdmin(req, res, next) {
  if (req.cookies && req.cookies.admin === '1') {
    // Double-check user role in DB for extra security
    const admin = await User.findOne({ email: 'aswincp554@gmail.com' });
    if (admin && admin.role === 'admin') return next();
  }
  return res.redirect('/admin/login');
}

// Admin login routes
router.get('/login', showAdminLogin);
router.post('/login', adminLogin);

// Admin panel routes
router.get('/', requireAdmin, renderAdminPage);
router.post('/block/:id', requireAdmin, blockUser);
router.post('/unblock/:id', requireAdmin, unblockUser);
router.get('/logout', adminLogout);

export default router; 