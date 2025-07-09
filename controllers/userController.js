import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config();

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
  // Password strength check
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).render('register', {
      error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
      email,
      username
    });
  }
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.isVerified) {
      // User exists and is verified
      return res.status(400).render('register', { error: 'User already exists. Please login.', email, username });
    } else {
      // User exists but not verified
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&error=Please verify your account with the OTP sent to your email.`);
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpCreatedAt = new Date();
  const user = await User.create({ email, username, password: hashedPassword, otp, isVerified: false, otpCreatedAt });

  // Send OTP to user's email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    });
  } catch (err) {
    console.error('Error sending OTP email:', err);
    return res.send('Error sending OTP email. Please try again.');
  }

  // Redirect to OTP verification page
  res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).render('login', { error: 'All fields are required.' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).render('login', { error: 'User not found.' });
  if (!user.password) return res.status(400).render('login', { error: 'No password stored for this user.' });
  if (user.blocked) return res.status(403).render('login', { error: 'You are blocked by the admin. Please contact support.' });
  if (!user.isVerified) {
    // Redirect to OTP verification if not verified
    return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&error=Please verify your account with the OTP sent to your email.`);
  }

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

export const showOtpForm = (req, res) => {
  const { email, error } = req.query;
  if (!email) return res.redirect('/register');
  res.render('otp', { email, error });
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.redirect('/register');
  // Check OTP expiry (1 minute)
  const now = new Date();
  if (!user.otp || !user.otpCreatedAt || (now - user.otpCreatedAt) > 60 * 1000) {
    user.otp = undefined;
    user.otpCreatedAt = undefined;
    return res.render('otp', { email, error: 'OTP expired. Please request a new one.' });
  }
  if (user.otp !== otp) {
    // Show error in OTP input
    return res.render('otp', { email, error: 'Incorrect OTP. Please try again.' });
  }
  user.isVerified = true;
  user.otp = undefined;
  user.otpCreatedAt = undefined;
  await user.save();
  // Log in user after verification
  const token = jwt.sign(
    { email: user.email, username: user.username },
    process.env.JWT_SECRET
  );
  res.cookie("token", token, { httpOnly: true });
  res.redirect('/chat');
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.redirect('/register');
  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpCreatedAt = new Date();
  await user.save();
  // Send OTP to user's email
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your New OTP Code',
      text: `Your new OTP code is: ${otp}`,
    });
  } catch (err) {
    console.error('Error resending OTP email:', err);
    return res.render('otp', { email, error: 'Error resending OTP. Please try again.' });
  }
  res.render('otp', { email, error: 'A new OTP has been sent to your email.' });
};
