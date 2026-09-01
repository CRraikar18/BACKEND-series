// Import Router from express
import { Router } from "express";

// Import product controllers
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    updateProductMainImage,
    deleteProduct
} from "../controllers/product.controller.js";

// Import authentication and role-checking middlewares
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

// Import multer upload middleware for handling product images
import { upload } from "../middlewares/multer.middleware.js";

// Create express router instance
const router = Router();

// ==========================================
// 🔓 PUBLIC PRODUCT ROUTES
// ==========================================

// GET /api/v1/products (List products with search & pagination)
router.route("/").get(getAllProducts);

// GET /api/v1/products/:productId (Get single product details)
router.route("/:productId").get(getProductById);

// ==========================================
// 🔒 ADMIN ONLY PRODUCT ROUTES
// ==========================================

// POST /api/v1/products (Admin creates new product with mainImage & subImages)
router.route("/").post(
    verifyJWT,
    verifyAdmin,
    upload.fields([
        {
            name: "mainImage",
            maxCount: 1
        },
        {
            name: "subImages",
            maxCount: 4
        }
    ]),
    createProduct
);

// PATCH & DELETE /api/v1/products/:productId (Admin updates/deletes product)
router
    .route("/:productId")
    .patch(verifyJWT, verifyAdmin, updateProduct)
    .delete(verifyJWT, verifyAdmin, deleteProduct);

// PATCH /api/v1/products/:productId/main-image (Admin updates product main image)
router.route("/:productId/main-image").patch(
    verifyJWT,
    verifyAdmin,
    upload.single("mainImage"),
    updateProductMainImage
);

// Export product router
export default router;
