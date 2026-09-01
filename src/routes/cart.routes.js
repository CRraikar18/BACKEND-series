// Import Router from express
import { Router } from "express";

// Import cart controllers
import {
    getUserCart,
    addItemToCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCart
} from "../controllers/cart.controller.js";

// Import auth middleware (Cart is strictly for logged-in users)
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Create express router instance
const router = Router();

// Apply verifyJWT middleware to all cart routes
router.use(verifyJWT);

// GET /api/v1/cart (Fetch current user's shopping cart)
// DELETE /api/v1/cart (Clear entire cart)
router.route("/").get(getUserCart).delete(clearCart);

// POST /api/v1/cart/add (Add product to cart)
router.route("/add").post(addItemToCart);

// PATCH & DELETE /api/v1/cart/items/:productId (Update quantity or remove item)
router
    .route("/items/:productId")
    .patch(updateCartItemQuantity)
    .delete(removeItemFromCart);

// Export cart router
export default router;
