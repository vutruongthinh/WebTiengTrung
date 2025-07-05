const express = require('express');
const router = express.Router();
const { AzureBlobService, createAzureMulterConfig } = require('../utils/azureBlobService');
const { Video, Course } = require('../models');
const auth = require('../middleware/auth');

// Initialize Azure Blob Service
const azureBlobService = new AzureBlobService();
const upload = createAzureMulterConfig();

// Upload video endpoint
router.post('/upload', 
    auth, // Require authentication
    upload.fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]), 
    async (req, res) => {
        try {
            const { course_id, title, description, order_index, is_preview } = req.body;
            
            // Validate required fields
            if (!req.files.video || !course_id || !title) {
                return res.status(400).json({
                    success: false,
                    message: 'Video file, course ID và tiêu đề là bắt buộc'
                });
            }

            // Check if course exists and user has permission
            const course = await Course.findByPk(course_id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy khóa học'
                });
            }

            // Upload video to Azure Blob Storage
            const videoFile = req.files.video[0];
            let videoUploadResult;
            
            if (process.env.NODE_ENV === 'production') {
                // Use Azure Blob Storage in production
                videoUploadResult = await azureBlobService.uploadVideo(videoFile, `course-${course_id}`);
            } else {
                // Use local storage in development
                videoUploadResult = {
                    url: `/uploads/videos/${videoFile.filename || 'temp-video.mp4'}`,
                    fileName: videoFile.filename || 'temp-video.mp4',
                    originalName: videoFile.originalname,
                    size: videoFile.size,
                    mimeType: videoFile.mimetype
                };
            }

            // Upload thumbnail if provided
            let thumbnailUrl = null;
            if (req.files.thumbnail) {
                const thumbnailFile = req.files.thumbnail[0];
                
                if (process.env.NODE_ENV === 'production') {
                    const thumbnailResult = await azureBlobService.uploadThumbnail(thumbnailFile, `thumbnails/course-${course_id}`);
                    thumbnailUrl = thumbnailResult.url;
                } else {
                    thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename || 'temp-thumb.jpg'}`;
                }
            }

            // Create video record in database
            const video = await Video.create({
                course_id,
                title,
                description: description || '',
                video_url: videoUploadResult.url,
                thumbnail_url: thumbnailUrl,
                duration_seconds: 0, // Will be updated later by video processing
                order_index: parseInt(order_index) || 0,
                is_preview: is_preview === 'true',
                resources: {
                    originalFileName: videoUploadResult.originalName,
                    fileSize: videoUploadResult.size,
                    mimeType: videoUploadResult.mimeType,
                    azureFileName: videoUploadResult.fileName
                }
            });

            // Update course video count and duration
            await course.increment('total_videos');

            res.status(201).json({
                success: true,
                message: 'Video đã được tải lên thành công',
                data: {
                    video: video.toJSON(),
                    upload_info: {
                        storage_type: process.env.NODE_ENV === 'production' ? 'azure_blob' : 'local',
                        file_size: videoUploadResult.size,
                        original_name: videoUploadResult.originalName
                    }
                }
            });

        } catch (error) {
            console.error('❌ Video upload error:', error);
            
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tải lên video',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

// Get video streaming URL (with access control)
router.get('/:videoId/stream', auth, async (req, res) => {
    try {
        const { videoId } = req.params;
        const user = req.user;

        // Get video and course information
        const video = await Video.findByPk(videoId, {
            include: [{
                model: Course,
                as: 'course'
            }]
        });

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy video'
            });
        }

        // Check if user can access this video
        const canAccess = video.canUserAccess(user, video.course);
        if (!canAccess) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem video này'
            });
        }

        // Generate streaming URL
        let streamingUrl;
        if (process.env.NODE_ENV === 'production') {
            // For VIP content, generate signed URL
            if (video.course.required_tier === 'vip' && !video.is_preview) {
                streamingUrl = await azureBlobService.generateSignedUrl(
                    video.resources.azureFileName, 
                    120 // 2 hours access
                );
            } else {
                streamingUrl = video.video_url; // Public URL for free content
            }
        } else {
            streamingUrl = video.video_url; // Local development
        }

        res.json({
            success: true,
            data: {
                streaming_url: streamingUrl,
                video_info: {
                    id: video.id,
                    title: video.title,
                    duration: video.getFormattedDuration(),
                    thumbnail: video.thumbnail_url,
                    is_preview: video.is_preview
                }
            }
        });

    } catch (error) {
        console.error('❌ Video streaming error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải video'
        });
    }
});

// Delete video
router.delete('/:videoId', auth, async (req, res) => {
    try {
        const { videoId } = req.params;
        
        const video = await Video.findByPk(videoId);
        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy video'
            });
        }

        // Delete from Azure Blob Storage if in production
        if (process.env.NODE_ENV === 'production' && video.resources.azureFileName) {
            await azureBlobService.deleteVideo(video.resources.azureFileName);
        }

        // Delete from database
        await video.destroy();

        res.json({
            success: true,
            message: 'Video đã được xóa thành công'
        });

    } catch (error) {
        console.error('❌ Video deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa video'
        });
    }
});

module.exports = router;
