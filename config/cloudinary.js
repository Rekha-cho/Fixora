const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('☁️  Cloudinary configured successfully.');
} else {
    console.warn('⚠️  Cloudinary credentials missing in .env. Falling back to local storage uploads.');
    // Create local public/uploads directory if it doesn't exist
    const localUploadsDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(localUploadsDir)) {
        fs.mkdirSync(localUploadsDir, { recursive: true });
    }
}

/**
 * Uploads a local file to Cloudinary (or falls back to moving it to the public/uploads folder).
 * @param {string} localFilePath Path to the temporary file on disk
 * @returns {Promise<string>} The uploaded image URL (Cloud URL or local relative web URL)
 */
const uploadImage = async (localFilePath) => {
    try {
        if (!localFilePath) return '';

        if (isCloudinaryConfigured) {
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(localFilePath, {
                folder: 'fixora_complaints',
                resource_type: 'image'
            });

            // Clean up temporary local file asynchronously
            fs.unlink(localFilePath, (err) => {
                if (err) console.error('Failed to delete temp upload file:', err.message);
            });

            console.log(`✅ [Cloudinary] Image uploaded successfully: ${result.secure_url}`);
            return result.secure_url;
        } else {
            // Fallback: Move file from temp 'uploads/' to public 'public/uploads/'
            const fileName = path.basename(localFilePath);
            const destinationPath = path.join(__dirname, '../public/uploads', fileName);

            await fs.promises.rename(localFilePath, destinationPath);
            
            console.log(`ℹ️ [Fallback] Image saved locally at: /uploads/${fileName}`);
            // Return local relative URL (served via express.static)
            return `/uploads/${fileName}`;
        }
    } catch (error) {
        console.error('❌ [Upload Error] File upload utility failed:', error.message);
        // Clean up temp file on failure
        if (fs.existsSync(localFilePath)) {
            fs.unlink(localFilePath, () => {});
        }
        throw error;
    }
};

module.exports = {
    uploadImage,
    isCloudinaryConfigured
};
