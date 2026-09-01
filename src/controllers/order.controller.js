// Import asyncHandler to wrap asynchronous controller logic and auto-catch errors
import asyncHandler from "../utils/asyncHandler.js";

// Import custom ApiError class for throwing structured HTTP errors
import ApiError from "../utils/ApiError.js";

// Import custom ApiResponse class for sending uniform JSON responses
import { ApiResponse } from "../utils/ApiResponse.js";

// Import Order, Cart, and Product models
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

// =========================================================================
// 1. CREATE ORDER (Checkout Cart Items)
// =========================================================================
export const createOrder = asyncHandler(async (req, res) => {
    const { address } = req.body;

    if (!address || address.trim() === "") {
        throw new ApiError(400, "Delivery address is required");
    }

    // Fetch user's cart and populate product details
    const cart = await Cart.findOne({ customer: req.user._id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "Your shopping cart is empty");
    }

    let totalPrice = 0;
    const orderItems = [];

    // Verify stock availability and prepare order items snapshot
    for (const item of cart.items) {
        const product = item.product;

        if (!product) {
            throw new ApiError(404, "A product in your cart no longer exists");
        }

        if (product.stock < item.quantity) {
            throw new ApiError(
                400,
                `Insufficient stock for "${product.name}". Available: ${product.stock}, in cart: ${item.quantity}`
            );
        }

        const itemTotal = product.price * item.quantity;
        totalPrice += itemTotal;

        orderItems.push({
            product: product._id,
            quantity: item.quantity,
            price: product.price // Save snapshot price at checkout
        });

        // Deduct inventory stock
        product.stock -= item.quantity;
        await product.save({ validateBeforeSave: false });
    }

    // Create the Order document in MongoDB
    const order = await Order.create({
        customer: req.user._id,
        orderItems,
        address: address.trim(),
        totalPrice,
        status: "PENDING",
        paymentStatus: "PENDING"
    });

    // Clear the user's shopping cart after successful checkout
    cart.items = [];
    await cart.save();

    return res
        .status(201)
        .json(new ApiResponse(201, order, "Order placed successfully"));
});

// =========================================================================
// 2. GET LOGGED-IN USER ORDERS
// =========================================================================
export const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ customer: req.user._id })
        .populate("orderItems.product", "name mainImage price")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "User orders fetched successfully"));
});

// =========================================================================
// 3. GET ORDER BY ID
// =========================================================================
export const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
        .populate("customer", "fullName email username")
        .populate("orderItems.product", "name mainImage price");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Ensure only the owner or an ADMIN can view the order
    if (order.customer._id.toString() !== req.user._id.toString() && req.user.role !== "ADMIN") {
        throw new ApiError(403, "You do not have permission to view this order");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order details fetched successfully"));
});

// =========================================================================
// 4. GET ALL ORDERS (Admin Only)
// =========================================================================
export const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({})
        .populate("customer", "fullName email username")
        .populate("orderItems.product", "name mainImage price")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, orders, "All orders fetched successfully"));
});

// =========================================================================
// 5. UPDATE ORDER STATUS (Admin Only)
// =========================================================================
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, paymentStatus } = req.body;

    const updatedFields = {};
    if (status) {
        const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            throw new ApiError(400, "Invalid order status value");
        }
        updatedFields.status = status;
    }

    if (paymentStatus) {
        const validPaymentStatuses = ["PENDING", "PAID", "FAILED"];
        if (!validPaymentStatuses.includes(paymentStatus)) {
            throw new ApiError(400, "Invalid payment status value");
        }
        updatedFields.paymentStatus = paymentStatus;
    }

    const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: updatedFields },
        { new: true }
    );

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, order, "Order status updated successfully"));
});
