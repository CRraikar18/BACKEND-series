// Import asyncHandler to wrap asynchronous controller logic and auto-catch errors
import asyncHandler from "../utils/asyncHandler.js";

// Import custom ApiError class for throwing structured HTTP errors
import ApiError from "../utils/ApiError.js";

// Import custom ApiResponse class for sending uniform JSON responses
import { ApiResponse } from "../utils/ApiResponse.js";

// Import Category model
import { Category } from "../models/category.model.js";

// =========================================================================
// 1. CREATE CATEGORY (Admin Only)
// =========================================================================
export const createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Category name is required");
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({
        name: name.trim().toLowerCase()
    });

    if (existingCategory) {
        throw new ApiError(409, "Category with this name already exists");
    }

    // Create category
    const category = await Category.create({
        name: name.trim().toLowerCase()
    });

    return res
        .status(201)
        .json(new ApiResponse(201, category, "Category created successfully"));
});

// =========================================================================
// 2. GET ALL CATEGORIES (Public)
// =========================================================================
export const getAllCategories = asyncHandler(async (req, res) => {
    // Fetch all categories sorted alphabetically
    const categories = await Category.find({}).sort({ name: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

// =========================================================================
// 3. GET CATEGORY BY ID (Public)
// =========================================================================
export const getCategoryById = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category fetched successfully"));
});

// =========================================================================
// 4. UPDATE CATEGORY (Admin Only)
// =========================================================================
export const updateCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Category name is required");
    }

    const category = await Category.findByIdAndUpdate(
        categoryId,
        {
            $set: {
                name: name.trim().toLowerCase()
            }
        },
        { new: true }
    );

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category updated successfully"));
});

// =========================================================================
// 5. DELETE CATEGORY (Admin Only)
// =========================================================================
export const deleteCategory = asyncHandler(async (req, res) => {
    const { categoryId } = req.params;

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Category deleted successfully"));
});
