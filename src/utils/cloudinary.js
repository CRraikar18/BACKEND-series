// Import Cloudinary v2 SDK for cloud-based media management
import { v2 as cloudinary } from "cloudinary";

// Import Node.js native filesystem module to remove temporary local files from disk
import fs from "fs";

// Configure Cloudinary credentials using environment variables
cloudinary.config({
    // Account Cloud Name identifier
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    // Public API Key
    api_key: process.env.CLOUDINARY_API_KEY,
    // Private Secret API Key
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload local files to Cloudinary and clean up local temporary files
const uploadOnCloudinary = async (localFilePath) => {
    try {
        // If no file path is provided, exit early by returning null
        if (!localFilePath) return null;

        // Upload the file to Cloudinary with automatic file type detection (image, raw, etc.)
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // Log confirmation of successful upload
        console.log("File uploaded on Cloudinary successfully: ", response.url);

        // Remove the temporary file from the local server disk after successful cloud upload
        fs.unlinkSync(localFilePath);

        // Return the complete Cloudinary response object containing secure_url and public_id
        return response;
    } catch (error) {
        // Remove the locally saved temporary file if the upload operation failed to prevent disk clogging
        fs.unlinkSync(localFilePath);

        // Return null indicating that the upload could not be completed
        return null;
    }
};

// Export the uploadOnCloudinary function as a named export
export { uploadOnCloudinary };
