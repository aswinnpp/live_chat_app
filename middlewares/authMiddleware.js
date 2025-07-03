import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from "../models/Users.js";
dotenv.config();

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: payload.email });
    if (!user) return res.redirect('/login');
    if (user.blocked) {
      res.clearCookie('token');
      return res.redirect('/login?error=blocked');
    }
    req.user = user;
    next();
  } catch (err) {
    return res.redirect("/login");
  }
};



