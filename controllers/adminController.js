import User from '../models/Users.js';
import bcrypt from 'bcrypt';

// Render admin page with all users
export const renderAdminPage = async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const users = await User.find({role:'user'});
  res.render('admin', { users });
};

// Block a user
export const blockUser = async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndUpdate(id, { blocked: true });
  res.redirect('/admin');
};

// Unblock a user
export const unblockUser = async (req, res) => {
  const { id } = req.params;
  await User.findByIdAndUpdate(id, { blocked: false });
  res.redirect('/admin');
};

// Render admin login page
export const showAdminLogin = (req, res) => {
  if (req.cookies && req.cookies.admin === '1') return res.render('/admin');
  res.render('adminLogin');
};

// Handle admin login POST
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
 
  const admin = await User.findOne({ email });
  if (!admin) return res.status(404).render('adminLogin', { error: 'Admin not found.' });
  if (admin.role !== 'admin') return res.status(403).render('adminLogin', { error: 'You do not have admin privileges.' });
  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(401).render('adminLogin', { error: 'Invalid admin credentials.' });
  // Set admin session (simple cookie for now)
  res.cookie('admin', '1', { httpOnly: true });
  // Use client-side script to replace history so back button doesn't go to /admin/login
  res.send(`<script>window.location.replace('/admin');</script>`);
};

export const adminLogout = (req, res) => {
  res.clearCookie('admin');
  res.redirect('/admin/login');
};