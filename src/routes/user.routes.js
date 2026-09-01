// Import Router from express
import { Router } from "express";

// Import user controllers
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar
} from "../controllers/user.controller.js";

// Import multer upload middleware for handling avatar file uploads
import { upload } from "../middlewares/multer.middleware.js";

// Import auth middleware for securing private routes
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Create express router instance
const router = Router();

// ==========================================
// 🔓 PUBLIC ROUTES (No login required)
// ==========================================

// POST /api/v1/users/register (Catches avatar image with Multer and calls registerUser)
router.route("/register").post(
    upload.single("avatar"),
    registerUser
);

// POST /api/v1/users/login (Validates credentials and issues tokens)
router.route("/login").post(loginUser);

// POST /api/v1/users/refresh-token (Generates new access & refresh tokens)
router.route("/refresh-token").post(refreshAccessToken);

// ==========================================
// 🔒 SECURED ROUTES (Login required via verifyJWT)
// ==========================================

// POST /api/v1/users/logout (Clears cookies and invalidates refresh token)
router.route("/logout").post(verifyJWT, logoutUser);

// POST /api/v1/users/change-password (Changes password after verifying old password)
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

// GET /api/v1/users/current-user (Fetches logged-in user profile details)
router.route("/current-user").get(verifyJWT, getCurrentUser);

// PATCH /api/v1/users/update-account (Updates fullName and email)
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

// PATCH /api/v1/users/avatar (Uploads new avatar to Cloudinary & updates user avatar)
router.route("/avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
);

// Export user router
export default router;
