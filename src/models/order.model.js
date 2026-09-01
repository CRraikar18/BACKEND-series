// Import mongoose and Schema constructor from mongoose library
import mongoose, { Schema } from "mongoose";

// Define the Ordered Item sub-schema storing snapshot details at the moment of purchase
const orderItemSchema = new Schema({
    // Reference to the purchased Product
    product: {
        // ObjectId reference type
        type: Schema.Types.ObjectId,
        // Target model name
        ref: "Product",
        // Required field
        required: true
    },
    // Quantity of items purchased
    quantity: {
        // Data type must be Number
        type: Number,
        // Required field
        required: true,
        // Minimum purchase quantity is 1
        min: 1
    },
    // Fixed price per unit at the time of purchase (prevents historical price discrepancies)
    price: {
        // Data type must be Number
        type: Number,
        // Required field
        required: true
    }
});

// Define the Order Schema structure and status tracking
const orderSchema = new Schema(
    {
        // Reference to the user who placed the order
        customer: {
            // ObjectId reference type
            type: Schema.Types.ObjectId,
            // Target model name
            ref: "User",
            // Required field
            required: true
        },
        // Array of purchased order items
        orderItems: [orderItemSchema],
        // Physical shipping address information
        address: {
            // Data type must be String
            type: String,
            // Required field
            required: [true, "Delivery address is required"]
        },
        // Total price calculated for the entire order
        totalPrice: {
            // Data type must be Number
            type: Number,
            // Required field
            required: true
        },
        // Order fulfillment lifecycle status
        status: {
            // Data type must be String
            type: String,
            // Allowed status transitions
            enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
            // Default initial status
            default: "PENDING"
        },
        // Payment settlement status
        paymentStatus: {
            // Data type must be String
            type: String,
            // Allowed payment status states
            enum: ["PENDING", "PAID", "FAILED"],
            // Default initial payment status
            default: "PENDING"
        }
    },
    {
        // Automatically inject createdAt and updatedAt timestamp timestamps
        timestamps: true
    }
);

// Compile and export the Order model
export const Order = mongoose.model("Order", orderSchema);
