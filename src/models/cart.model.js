// Import mongoose and Schema constructor from mongoose library
import mongoose, { Schema } from "mongoose";

// Define the Cart Item sub-schema for individual items within a shopping cart
const cartItemSchema = new Schema({
    // Reference to the added Product
    product: {
        // ObjectId reference type
        type: Schema.Types.ObjectId,
        // Target model name
        ref: "Product",
        // Required field
        required: true
    },
    // Quantity of this product added to cart
    quantity: {
        // Data type must be Number
        type: Number,
        // Quantity is required
        required: true,
        // Minimum quantity is 1
        min: [1, "Quantity must be at least 1"],
        // Default quantity starts at 1
        default: 1
    }
});

// Define the Cart Schema structure
const cartSchema = new Schema(
    {
        // Reference to the user who owns this shopping cart
        customer: {
            // ObjectId reference type
            type: Schema.Types.ObjectId,
            // Target model name
            ref: "User",
            // Required field
            required: true,
            // One cart per user
            unique: true
        },
        // Array of cart items
        items: [cartItemSchema]
    },
    {
        // Automatically inject createdAt and updatedAt timestamp timestamps
        timestamps: true
    }
);

// Compile and export the Cart model
export const Cart = mongoose.model("Cart", cartSchema);
