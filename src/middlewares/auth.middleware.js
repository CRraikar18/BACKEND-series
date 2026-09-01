// Import ApiError utility to throw standardized error responses
import ApiError from "../utils/ApiError.js";

// Import asyncHandler utility to catch async exceptions automatically
import asyncHandler from "../utils/asyncHandler.js";

// Import jsonwebtoken to verify and decode access tokens
import jwt from "jsonwebtoken";

// Import User model to fetch user document from database
import { User } from "../models/user.model.js";

// Middleware function to verify JWT access token on protected routes
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Extract token from incoming request cookies OR Authorization Bearer header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        // If no token is found, throw 401 Unauthorized error
        if (!token) {
            throw new ApiError(401, "Unauthorized request: No token provided");
        }

        // Verify token authenticity using the Access Token Secret
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Query user from MongoDB by decoded user ID, excluding sensitive password and refreshToken fields
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        // If user no longer exists in DB, throw 401 Unauthorized error
        if (!user) {
            throw new ApiError(401, "Invalid Access Token: User not found");
        }

        // Attach verified user document to Express request object for downstream controllers
        req.user = user;

        // Proceed to next middleware or route controller handler
        next();
    } catch (error) {
        // Wrap and forward any token decoding/verification errors as 401 Unauthorized
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

// Middleware function to restrict access to ADMIN only routes (e.g. creating/updating products & categories)
export const verifyAdmin = asyncHandler(async (req, _, next) => {
    // Check if user exists on request and has the ADMIN role
    if (!req.user || req.user.role !== "ADMIN") {
        // Throw 403 Forbidden error if user is not an administrator
        throw new ApiError(403, "Access denied: Administrator privileges required");
    }
    // Proceed if user is verified as an Admin
    next();
});
