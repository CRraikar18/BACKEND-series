// Import asyncHandler to wrap asynchronous controller logic and auto-catch errors
import asyncHandler from "../utils/asyncHandler.js";

// Import custom ApiError class for throwing structured HTTP errors
import ApiError from "../utils/ApiError.js";

// Import custom ApiResponse class for sending uniform JSON responses
import { ApiResponse } from "../utils/ApiResponse.js";

// Import Cart and Product models
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

// Helper function to populate cart product details and calculate cart total amount
const formatCartResponse = async (cartId) => {
    const populatedCart = await Cart.findById(cartId).populate({
        path: "items.product",
        select: "name price mainImage stock"
    });

    if (!populatedCart) return null;

    let cartTotal = 0;
    populatedCart.items.forEach((item) => {
        if (item.product?.price) {
            cartTotal += item.product.price * item.quantity;
        }
    });

    return {
        _id: populatedCart._id,
        customer: populatedCart.customer,
        items: populatedCart.items,
        cartTotal,
        createdAt: populatedCart.createdAt,
        updatedAt: populatedCart.updatedAt
    };
};

// =========================================================================
// 1. GET USER CART
// =========================================================================
export const getUserCart = asyncHandler(async (req, res) => {
    // Find or create cart for the logged-in user
    let cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            customer: req.user._id,
            items: []
        });
    }

    const formattedCart = await formatCartResponse(cart._id);

    return res
        .status(200)
        .json(new ApiResponse(200, formattedCart, "User cart fetched successfully"));
});

// =========================================================================
// 2. ADD ITEM TO CART
// =========================================================================
export const addItemToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
        throw new ApiError(400, "Product ID is required");
    }

    const requestedQuantity = parseInt(quantity, 10);
    if (isNaN(requestedQuantity) || requestedQuantity < 1) {
        throw new ApiError(400, "Quantity must be at least 1");
    }

    // Verify product exists and check stock availability
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    if (product.stock < requestedQuantity) {
        throw new ApiError(400, `Insufficient stock. Only ${product.stock} items available`);
    }

    // Find or create cart
    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        cart = await Cart.create({
            customer: req.user._id,
            items: []
        });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
        // Increment quantity of existing item
        cart.items[existingItemIndex].quantity += requestedQuantity;
    } else {
        // Add new item to cart
        cart.items.push({
            product: productId,
            quantity: requestedQuantity
        });
    }

    await cart.save();

    const formattedCart = await formatCartResponse(cart._id);

    return res
        .status(200)
        .json(new ApiResponse(200, formattedCart, "Item added to cart successfully"));
});

// =========================================================================
// 3. UPDATE CART ITEM QUANTITY
// =========================================================================
export const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity)) {
        throw new ApiError(400, "Valid quantity is required");
    }

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
        throw new ApiError(404, "Item not found in cart");
    }

    if (parsedQuantity <= 0) {
        // If quantity is 0 or negative, remove item from cart
        cart.items.splice(itemIndex, 1);
    } else {
        // Verify stock availability
        const product = await Product.findById(productId);
        if (product && product.stock < parsedQuantity) {
            throw new ApiError(400, `Insufficient stock. Only ${product.stock} items available`);
        }
        cart.items[itemIndex].quantity = parsedQuantity;
    }

    await cart.save();

    const formattedCart = await formatCartResponse(cart._id);

    return res
        .status(200)
        .json(new ApiResponse(200, formattedCart, "Cart updated successfully"));
});

// =========================================================================
// 4. REMOVE ITEM FROM CART
// =========================================================================
export const removeItemFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
    );

    await cart.save();

    const formattedCart = await formatCartResponse(cart._id);

    return res
        .status(200)
        .json(new ApiResponse(200, formattedCart, "Item removed from cart successfully"));
});

// =========================================================================
// 5. CLEAR ENTIRE CART
// =========================================================================
export const clearCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    cart.items = [];
    await cart.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { items: [], cartTotal: 0 }, "Cart cleared successfully"));
});
