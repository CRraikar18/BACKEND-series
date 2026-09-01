// Import multer package for handling multipart/form-data requests
import multer from "multer";

// Configure local disk storage destination and custom filename generation
const storage = multer.diskStorage({
    // Define destination folder where incoming uploaded files will be stored temporarily
    destination: function (req, file, cb) {
        // Store files inside public/temp folder
        cb(null, "./public/temp");
    },
    // Define naming convention for stored files to preserve original filename
    filename: function (req, file, cb) {
        // Save file using its original filename
        cb(null, file.originalname);
    }
});

// Export configured multer upload middleware instance
export const upload = multer({
    storage
});
