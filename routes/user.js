import express from "express";
const router = express.Router();

import { authMiddleware } from "../middlewares/authMiddleware.js";


import {
  showLogin,
  showRegister,
  registerUser,
  loginUser,
  showChat,
  logoutUser,
} from "../controllers/userController.js";

router.get("/", (req, res) => res.redirect("/login"));

router.get("/login", showLogin);
router.get("/register", showRegister);

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/chat", authMiddleware, showChat);
router.get("/logout", logoutUser);



export default router;
