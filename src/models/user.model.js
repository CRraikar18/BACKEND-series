// Import mongoose and Schema constructor from the mongoose library
import mongoose, { Schema } from "mongoose";
// Import jsonwebtoken library to create and sign authentication tokens
import jwt from "jsonwebtoken";
// Import bcrypt library to securely hash and compare passwords
import bcrypt from "bcrypt";
// Define the User Schema structure and validation constraints
const userSchema = new Schema(
    {
        // Unique username identifier for the user account
        username: {
            // Data type must be String
            type: String,
            // Required field with custom error message
            required: true,
            // Enforce uniqueness across all documents in the collection
            unique: true,
            // Convert to lowercase to prevent casing duplicates
            lowercase: true,
            // Remove leading and trailing whitespace
            trim: true,
            // Index the field in MongoDB for rapid lookup queries
            index: true
        },
        // Unique email address of the user
        email: {
            // Data type must be String
            type: String,
            // Required field
            required: true,
            // Must be unique in the database
            unique: true,
            // Lowercase normalization
            lowercase: true,
            // Trim whitespace
            trim: true
        },
        // Full legal or display name of the user
        fullName: {
            // Data type must be String
            type: String,
            // Required field
            required: true,
            // Trim whitespace
            trim: true,
            // Index for search optimization
            index: true
        },
        // Cloudinary URL string for the user profile avatar image
        avatar: {
            // Data type must be String (URL from Cloudinary)
            type: String,
            // Avatar is mandatory for profile creation
            required: true
        },
        // Role of the user in the ecommerce system (User vs Admin)
        role: {
            // Data type must be String
            type: String,
            // Restrict allowed values to standard ecommerce roles
            enum: ["USER", "ADMIN"],
            // Default role assigned to new registrations
            default: "USER"
        },
        // Bcrypt hashed password string
        password: {
            // Data type must be String
            type: String,
            // Required field with validation message
            required: [true, "Password is required"]
        },
        // Long-lived refresh token stored for session invalidation and renewal
        refreshToken: {
            // Data type must be String
            type: String
        }
    },
    {
        // Automatically manage 'createdAt' and 'updatedAt' timestamp fields
        timestamps: true
    }
);

// Mongoose Pre-save Hook: Executes immediately before saving a document to the database
userSchema.pre("save", async function () {
    // Only hash password if the password field was modified or is new
    if (!this.isModified("password")) return;
    // Hash password with a salt round factor of 10
    this.password = await bcrypt.hash(this.password, 10);
});
// Custom Instance Method: Compares plain-text candidate password with hashed DB password
userSchema.methods.isPasswordCorrect = async function (password) {
    // Return boolean result of bcrypt comparison
    return await bcrypt.compare(password, this.password);
};
// Custom Instance Method: Generates a short-lived signed JWT Access Token
userSchema.methods.generateAccessToken = function () {
    // Sign payload containing user ID, email, username, and fullName
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        // Use the Access Token Secret from environment variables
        process.env.ACCESS_TOKEN_SECRET,
        {
            // Set token expiration from environment variables
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};
// Custom Instance Method: Generates a long-lived signed JWT Refresh Token
userSchema.methods.generateRefreshToken = function () {
    // Sign payload containing only the user ID
    return jwt.sign(
        {
            _id: this._id
        },
        // Use the Refresh Token Secret from environment variables
        process.env.REFRESH_TOKEN_SECRET,
        {
            // Set refresh token expiration from environment variables
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};
// Compile and export the User model from the defined schema
export const User = mongoose.model("User", userSchema);