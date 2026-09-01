// Import mongoose and Schema constructor from mongoose library
import mongoose, { Schema } from "mongoose";

// Import mongoose-aggregate-paginate-v2 to enable paginated product listings & filtering
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// Define the Product Schema structure and validation constraints
const productSchema = new Schema(
    {
        // Name / Title of the product
        name: {
            // Data type must be String
            type: String,
            // Required field with validation message
            required: [true, "Product name is required"],
            // Strip whitespace
            trim: true,
            // Index for faster search queries
            index: true
        },
        // Detailed description of the product features
        description: {
            // Data type must be String
            type: String,
            // Required field with validation message
            required: [true, "Product description is required"]
        },
        // Main thumbnail / display image URL from Cloudinary
        mainImage: {
            // Data type must be String (Cloudinary URL)
            type: String,
            // Required field
            required: true
        },
        // Optional gallery sub-images (array of Cloudinary URLs)
        subImages: [
            {
                // Data type must be String
                type: String
            }
        ],
        // Product price in standard decimal currency units
        price: {
            // Data type must be Number
            type: Number,
            // Required field
            required: [true, "Product price is required"],
            // Price cannot be negative
            min: [0, "Price cannot be negative"],
            // Default price
            default: 0
        },
        // Total available inventory units in stock
        stock: {
            // Data type must be Number
            type: Number,
            // Stock cannot be negative
            min: [0, "Stock cannot be negative"],
            // Default inventory stock starts at 0
            default: 0
        },
        // Reference to the parent Category
        category: {
            // ObjectId reference type
            type: Schema.Types.ObjectId,
            // Target model name
            ref: "Category",
            // Required field
            required: true
        },
        // Reference to the user / seller who created the product listing
        owner: {
            // ObjectId reference type
            type: Schema.Types.ObjectId,
            // Target model name
            ref: "User"
        }
    },
    {
        // Automatically inject createdAt and updatedAt timestamp timestamps
        timestamps: true
    }
);

// Plug in the aggregate pagination helper into the product schema
productSchema.plugin(mongooseAggregatePaginate);

// Compile and export the Product model from the defined schema
export const Product = mongoose.model("Product", productSchema);
