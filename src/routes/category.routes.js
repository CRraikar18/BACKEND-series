// Import Router from express
import { Router } from "express";

// Import category controllers
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from "../controllers/category.controller.js";

// Import authentication and role-checking middlewares
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

// Create express router instance
const router = Router();

// ==========================================
// 🔓 PUBLIC CATEGORY ROUTES
// ==========================================

// GET /api/v1/categories (List all categories)
router.route("/").get(getAllCategories);

// GET /api/v1/categories/:categoryId (Get single category details)
router.route("/:categoryId").get(getCategoryById);

// ==========================================
// 🔒 ADMIN ONLY CATEGORY ROUTES
// ==========================================

// POST /api/v1/categories (Admin creates new category)
router.route("/").post(verifyJWT, verifyAdmin, createCategory);

// PATCH & DELETE /api/v1/categories/:categoryId (Admin updates/deletes category)
router
    .route("/:categoryId")
    .patch(verifyJWT, verifyAdmin, updateCategory)
    .delete(verifyJWT, verifyAdmin, deleteCategory);

// Export category router
export default router;
