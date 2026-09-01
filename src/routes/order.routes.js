// Import Router from express
import { Router } from "express";

// Import order controllers
import {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus
} from "../controllers/order.controller.js";

// Import auth middlewares
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

// Create express router instance
const router = Router();

// Apply verifyJWT middleware to all order routes
router.use(verifyJWT);

// ==========================================
// 🔒 CUSTOMER ORDER ROUTES
// ==========================================

// POST /api/v1/orders/checkout (Place new order from cart)
router.route("/checkout").post(createOrder);

// GET /api/v1/orders/my-orders (Get logged-in user order history)
router.route("/my-orders").get(getMyOrders);

// GET /api/v1/orders/:orderId (Get specific order details)
router.route("/:orderId").get(getOrderById);

// ==========================================
// 🔒 ADMIN ONLY ORDER ROUTES
// ==========================================

// GET /api/v1/orders/admin/all (Admin gets all store orders)
router.route("/admin/all").get(verifyAdmin, getAllOrders);

// PATCH /api/v1/orders/admin/:orderId (Admin updates order or payment status)
router.route("/admin/:orderId").patch(verifyAdmin, updateOrderStatus);

// Export order router
export default router;
