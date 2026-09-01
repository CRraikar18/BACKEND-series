// Import asyncHandler to wrap asynchronous controller logic and auto-catch errors
import asyncHandler from "../utils/asyncHandler.js";

// Import custom ApiError class for throwing structured HTTP errors
import ApiError from "../utils/ApiError.js";

// Import custom ApiResponse class for sending uniform JSON responses
import { ApiResponse } from "../utils/ApiResponse.js";

// Import Product and Category models
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

// Import Cloudinary upload helper
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Import mongoose for ObjectId conversion
import mongoose from "mongoose";

// =========================================================================
// 1. CREATE PRODUCT (Admin Only)
// =========================================================================
export const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, stock, category } = req.body;

    const trimmedCategory = category ? category.trim() : "";

    // Validate text inputs
    if ([name, description, trimmedCategory].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Name, description, and category are required");
    }

    if (price === undefined || isNaN(price) || Number(price) < 0) {
        throw new ApiError(400, "A valid non-negative price is required");
    }

    if (stock === undefined || isNaN(stock) || Number(stock) < 0) {
        throw new ApiError(400, "A valid non-negative stock quantity is required");
    }

    // Verify category exists in database
    const categoryExists = await Category.findById(trimmedCategory);
    if (!categoryExists) {
        throw new ApiError(404, "Selected category does not exist");
    }

    // Handle Main Image upload (Mandatory)
    const mainImageLocalPath = req.files?.mainImage?.[0]?.path;
    if (!mainImageLocalPath) {
        throw new ApiError(400, "Product main image is required");
    }

    const mainImage = await uploadOnCloudinary(mainImageLocalPath);
    if (!mainImage || !mainImage.url) {
        throw new ApiError(500, "Failed to upload main image to Cloudinary");
    }

    // Handle Sub Images upload (Optional gallery images)
    const subImagesUrls = [];
    if (req.files?.subImages && req.files.subImages.length > 0) {
        for (const file of req.files.subImages) {
            const uploadedSubImage = await uploadOnCloudinary(file.path);
            if (uploadedSubImage?.url) {
                subImagesUrls.push(uploadedSubImage.url);
            }
        }
    }

    // Create Product in MongoDB
    const product = await Product.create({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        category: trimmedCategory,
        mainImage: mainImage.url,
        subImages: subImagesUrls,
        owner: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, product, "Product created successfully"));
});

// =========================================================================
// 2. GET ALL PRODUCTS (Public with Search, Filter & Pagination)
// =========================================================================
export const getAllProducts = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        category,
        sortBy = "createdAt",
        sortType = "desc"
    } = req.query;

    const pipeline = [];

    // Filter by search query (matching product name or description)
    if (query.trim() !== "") {
        pipeline.push({
            $match: {
                $or: [
                    { name: { $regex: query.trim(), $options: "i" } },
                    { description: { $regex: query.trim(), $options: "i" } }
                ]
            }
        });
    }

    // Filter by specific Category ID if provided
    if (category) {
        pipeline.push({
            $match: {
                category: new mongoose.Types.ObjectId(category)
            }
        });
    }

    // Join with Category collection for category details
    pipeline.push({
        $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryDetails"
        }
    });

    pipeline.push({
        $unwind: {
            path: "$categoryDetails",
            preserveNullAndEmptyArrays: true
        }
    });

    // Sorting stage
    const sortOrder = sortType.toLowerCase() === "asc" ? 1 : -1;
    pipeline.push({
        $sort: {
            [sortBy]: sortOrder
        }
    });

    // Execute aggregation with pagination plugin
    const aggregateQuery = Product.aggregate(pipeline);
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const paginatedProducts = await Product.aggregatePaginate(aggregateQuery, options);

    return res
        .status(200)
        .json(new ApiResponse(200, paginatedProducts, "Products fetched successfully"));
});

// =========================================================================
// 3. GET PRODUCT BY ID (Public)
// =========================================================================
export const getProductById = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId)
        .populate("category", "name")
        .populate("owner", "fullName email username");

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product details fetched successfully"));
});

// =========================================================================
// 4. UPDATE PRODUCT (Admin Only)
// =========================================================================
export const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { name, description, price, stock, category } = req.body;

    const updatedFields = {};
    if (name) updatedFields.name = name;
    if (description) updatedFields.description = description;
    if (price !== undefined) updatedFields.price = Number(price);
    if (stock !== undefined) updatedFields.stock = Number(stock);
    if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) throw new ApiError(404, "Category not found");
        updatedFields.category = category;
    }

    const product = await Product.findByIdAndUpdate(
        productId,
        { $set: updatedFields },
        { new: true }
    );

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product updated successfully"));
});

// =========================================================================
// 5. UPDATE PRODUCT MAIN IMAGE (Admin Only)
// =========================================================================
export const updateProductMainImage = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const mainImageLocalPath = req.file?.path;

    if (!mainImageLocalPath) {
        throw new ApiError(400, "Main image file is missing");
    }

    const mainImage = await uploadOnCloudinary(mainImageLocalPath);
    if (!mainImage?.url) {
        throw new ApiError(500, "Failed to upload image to Cloudinary");
    }

    const product = await Product.findByIdAndUpdate(
        productId,
        { $set: { mainImage: mainImage.url } },
        { new: true }
    );

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, product, "Product main image updated successfully"));
});

// =========================================================================
// 6. DELETE PRODUCT (Admin Only)
// =========================================================================
export const deleteProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Product deleted successfully"));
});
