const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const multer = require('multer');
const path = require('path');

class AzureBlobService {
    constructor() {
        this.accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        this.containerName = process.env.AZURE_BLOB_CONTAINER_NAME || 'videos';
        
        // Initialize Azure Blob Service Client
        if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
            // Using connection string (easier for development)
            this.blobServiceClient = BlobServiceClient.fromConnectionString(
                process.env.AZURE_STORAGE_CONNECTION_STRING
            );
        } else {
            // Using Azure AD authentication (production)
            const credential = new DefaultAzureCredential();
            this.blobServiceClient = new BlobServiceClient(
                `https://${this.accountName}.blob.core.windows.net`,
                credential
            );
        }
        
        this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    }

    // Initialize container (create if not exists)
    async initializeContainer() {
        try {
            await this.containerClient.createIfNotExists({
                access: 'blob' // Public read access for videos
            });
            console.log(`✅ Azure Blob container '${this.containerName}' ready`);
        } catch (error) {
            console.error('❌ Error initializing Azure Blob container:', error);
            throw error;
        }
    }

    // Upload video file to Azure Blob Storage
    async uploadVideo(file, folder = 'courses') {
        try {
            // Generate unique filename
            const fileExtension = path.extname(file.originalname);
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
            
            // Get blob client
            const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
            
            // Upload file with metadata
            const uploadOptions = {
                blobHTTPHeaders: {
                    blobContentType: file.mimetype,
                    blobCacheControl: 'public, max-age=31536000' // 1 year cache
                },
                metadata: {
                    originalName: file.originalname,
                    uploadDate: new Date().toISOString(),
                    fileSize: file.size.toString()
                }
            };

            await blockBlobClient.uploadData(file.buffer, uploadOptions);
            
            // Return the public URL
            const videoUrl = blockBlobClient.url;
            
            console.log(`✅ Video uploaded successfully: ${fileName}`);
            return {
                url: videoUrl,
                fileName: fileName,
                originalName: file.originalname,
                size: file.size,
                mimeType: file.mimetype
            };
            
        } catch (error) {
            console.error('❌ Error uploading video to Azure Blob:', error);
            throw error;
        }
    }

    // Upload thumbnail image
    async uploadThumbnail(file, folder = 'thumbnails') {
        try {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
            
            const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
            
            const uploadOptions = {
                blobHTTPHeaders: {
                    blobContentType: file.mimetype,
                    blobCacheControl: 'public, max-age=31536000'
                }
            };

            await blockBlobClient.uploadData(file.buffer, uploadOptions);
            
            return {
                url: blockBlobClient.url,
                fileName: fileName
            };
            
        } catch (error) {
            console.error('❌ Error uploading thumbnail:', error);
            throw error;
        }
    }

    // Delete video from Azure Blob Storage
    async deleteVideo(fileName) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
            await blockBlobClient.deleteIfExists();
            console.log(`✅ Video deleted: ${fileName}`);
        } catch (error) {
            console.error('❌ Error deleting video:', error);
            throw error;
        }
    }

    // Generate signed URL for private videos (for VIP content)
    async generateSignedUrl(fileName, expiresInMinutes = 60) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
            
            // Generate SAS token for temporary access
            const sasOptions = {
                containerName: this.containerName,
                blobName: fileName,
                permissions: 'r', // read-only
                expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000)
            };
            
            // Note: This requires additional setup for SAS tokens
            // For now, return the direct URL (suitable for public content)
            return blockBlobClient.url;
            
        } catch (error) {
            console.error('❌ Error generating signed URL:', error);
            throw error;
        }
    }
}

// Multer configuration for Azure Blob Storage
const createAzureMulterConfig = () => {
    return multer({
        storage: multer.memoryStorage(), // Store in memory for Azure upload
        limits: {
            fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB default
        },
        fileFilter: (req, file, cb) => {
            // Allow video files
            if (file.fieldname === 'video') {
                const allowedMimes = [
                    'video/mp4',
                    'video/mpeg',
                    'video/quicktime',
                    'video/x-msvideo', // .avi
                    'video/x-ms-wmv'   // .wmv
                ];
                
                if (allowedMimes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Chỉ chấp nhận file video (MP4, MPEG, MOV, AVI, WMV)'), false);
                }
            }
            // Allow image files for thumbnails
            else if (file.fieldname === 'thumbnail') {
                const allowedMimes = [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                    'image/gif'
                ];
                
                if (allowedMimes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Chỉ chấp nhận file hình ảnh (JPEG, PNG, WebP, GIF)'), false);
                }
            } else {
                cb(new Error('Trường file không hợp lệ'), false);
            }
        }
    });
};

module.exports = {
    AzureBlobService,
    createAzureMulterConfig
};
