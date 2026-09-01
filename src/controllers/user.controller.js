// Import asyncHandler to wrap asynchronous controller logic and auto-catch errors
import asyncHandler from "../utils/asyncHandler.js";

// Import custom ApiError class for throwing structured HTTP errors
import ApiError from "../utils/ApiError.js";

// Import custom ApiResponse class for sending uniform JSON responses
import { ApiResponse } from "../utils/ApiResponse.js";

// Import User model to perform database operations
import { User } from "../models/user.model.js";

// Import Cloudinary upload helper to upload local files to cloud storage
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Import jsonwebtoken to verify refresh tokens
import jwt from "jsonwebtoken";

// Cookie security options for setting HTTP-only tokens
const cookieOptions = {
    // Prevent client-side JavaScript from accessing cookies (XSS protection)
    httpOnly: true,
    // Enable HTTPS transmission in production
    secure: process.env.NODE_ENV === "production"
};

// Helper function to generate both Access and Refresh tokens and persist Refresh Token to DB
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // Fetch user from DB by ID
        const user = await User.findById(userId);
        
        // Generate tokens using custom User model instance methods
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token to user document in MongoDB
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};

// =========================================================================
// 1. REGISTER USER CONTROLLER
// =========================================================================
export const registerUser = asyncHandler(async (req, res) => {
    // Step 1: Extract user input from request body
    const { fullName, email, username, password } = req.body;

    // Step 2: Validate that all required text fields are non-empty
    if ([fullName, email, username, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields (fullName, email, username, password) are required");
    }

    // Step 3: Check if user with same username or email already exists in DB
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with this username or email already exists");
    }

    // Step 4: Check if avatar file was received by Multer
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    // Step 5: Upload avatar image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar || !avatar.url) {
        throw new ApiError(500, "Failed to upload avatar image to Cloudinary");
    }

    // Step 6: Create user record in MongoDB (password will be automatically hashed by pre-save hook)
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        password,
        username: username.toLowerCase()
    });

    // Step 7: Fetch created user excluding sensitive password & refreshToken fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Step 8: Return successful 201 Created response
    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// =========================================================================
// 2. LOGIN USER CONTROLLER
// =========================================================================
export const loginUser = asyncHandler(async (req, res) => {
    // Step 1: Extract credentials from request body
    const { email, username, password } = req.body;

    // Step 2: Verify username or email is provided
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    // Step 3: Find user in DB
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Step 4: Validate password using instance method
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Step 5: Generate Access & Refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Step 6: Fetch logged-in user without sensitive fields
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Step 7: Set cookies and send response
    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

// =========================================================================
// 3. LOGOUT USER CONTROLLER
// =========================================================================
export const logoutUser = asyncHandler(async (req, res) => {
    // Step 1: Remove refresh token from user document in MongoDB
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // Removes the refreshToken field
            }
        },
        {
            new: true
        }
    );

    // Step 2: Clear access and refresh cookies
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// =========================================================================
// 4. REFRESH ACCESS TOKEN CONTROLLER
// =========================================================================
export const refreshAccessToken = asyncHandler(async (req, res) => {
    // Step 1: Grab incoming refresh token from cookies or request body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request: Refresh token is missing");
    }

    try {
        // Step 2: Decode and verify refresh token using REFRESH_TOKEN_SECRET
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Step 3: Fetch user from DB
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // Step 4: Verify if incoming token matches the one stored in MongoDB
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or has been revoked");
        }

        // Step 5: Generate fresh tokens
        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        // Step 6: Return new cookies & tokens
        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

// =========================================================================
// 5. CHANGE CURRENT PASSWORD CONTROLLER
// =========================================================================
export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both oldPassword and newPassword are required");
    }

    // Find the user by ID
    const user = await User.findById(req.user?._id);

    // Verify if old password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    // Set new password (will be automatically hashed by pre-save hook on save)
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// =========================================================================
// 6. GET CURRENT LOGGED IN USER
// =========================================================================
export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

// =========================================================================
// 7. UPDATE ACCOUNT DETAILS CONTROLLER (fullName & email)
// =========================================================================
export const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "fullName and email are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

// =========================================================================
// 8. UPDATE USER AVATAR CONTROLLER
// =========================================================================
export const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // Upload new avatar image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading avatar to Cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});
