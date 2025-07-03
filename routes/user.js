import express from "express";
const router = express.Router();

import { authMiddleware, requireAdmin } from "../middlewares/authMiddleware.js";
// import {
//   renderAdminPage,
//   blockUser,
//   unblockUser,
//   showAdminLogin,
//   adminLogin,
//   adminLogout,
// } from "../controllers/adminController.js";

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

// router.get("/admin/login", showAdminLogin);
// router.post("/admin/login", adminLogin);
// router.get("/admin/logout", adminLogout);

// // Admin routes
// router.get("/admin", requireAdmin, renderAdminPage);
// router.post("/admin/block/:id", requireAdmin, blockUser);
// router.post("/admin/unblock/:id", requireAdmin, unblockUser);

export default router;
