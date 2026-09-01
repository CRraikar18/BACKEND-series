// Import mongoose and Schema constructor from mongoose library
import mongoose, { Schema } from "mongoose";

// Define the Category Schema structure for organizing products
const categorySchema = new Schema(
    {
        // Category display name (e.g., Electronics, Fashion, Books)
        name: {
            // Data type must be String
            type: String,
            // Required field with validation message
            required: [true, "Category name is required"],
            // Ensure unique category names to prevent duplicates
            unique: true,
            // Lowercase normalization
            lowercase: true,
            // Strip leading and trailing whitespace
            trim: true
        }
    },
    {
        // Automatically inject createdAt and updatedAt timestamp timestamps
        timestamps: true
    }
);

// Compile and export the Category model
export const Category = mongoose.model("Category", categorySchema);
