import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import dotenv from 'dotenv';
dotenv.config();

export const showLogin = (req, res) => {
  if (req.cookies && req.cookies.admin === '1') return res.redirect('/admin');
  if (req.cookies && req.cookies.token) return res.redirect('/chat');
  const error = req.query.error === 'blocked' ? 'You have been blocked by the admin.' : undefined;
  res.render("login", { error });
};
export const showRegister = (req, res) => {
  if (req.cookies && req.cookies.token) return res.redirect('/chat');
  res.render("register");
};

export const registerUser = async (req, res) => {
  const { email, username, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.send("User already exists. Please login.");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, username, password: hashedPassword });

  const token = jwt.sign(
    { email: user.email, username: user.username },
    process.env.JWT_SECRET
  );

  res.cookie("token", token, { httpOnly: true });
  res.redirect("/chat");
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).render('login', { error: 'All fields are required.' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).render('login', { error: 'User not found.' });
  if (!user.password) return res.status(400).render('login', { error: 'No password stored for this user.' });
  if (user.blocked) return res.status(403).render('login', { error: 'You are blocked by the admin. Please contact support.' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).render('login', { error: 'Invalid password.' });

  const token = jwt.sign(
    { email: user.email, username: user.username },
    process.env.JWT_SECRET
  );

  res.cookie("token", token, { httpOnly: true });
  res.redirect("/chat");
};

export const showChat = (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.render("chat", { username: req.user.username });
};

export const logoutUser = (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
};
