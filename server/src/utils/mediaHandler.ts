import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import type { Express } from "express";

export interface MediaUploadOptions {
  folder: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpg" | "png" | "webp";
}

export interface MediaUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  duration?: number;
}

export class MediaHandler {
  private static readonly ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  private static readonly ALLOWED_VIDEO_TYPES = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];
  private static readonly ALLOWED_AUDIO_TYPES = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
  ];
  private static readonly ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "text/plain",
    "application/msword",
  ];

  private static readonly MAX_FILE_SIZES = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    audio: 50 * 1024 * 1024, // 50MB
    document: 25 * 1024 * 1024, // 25MB
  };

  static validateFile(file: Express.Multer.File): {
    isValid: boolean;
    error?: string;
    type?: string;
  } {
    const { mimetype, size } = file;

    // Determine file type
    let fileType: string;
    if (this.ALLOWED_IMAGE_TYPES.includes(mimetype)) {
      fileType = "image";
    } else if (this.ALLOWED_VIDEO_TYPES.includes(mimetype)) {
      fileType = "video";
    } else if (this.ALLOWED_AUDIO_TYPES.includes(mimetype)) {
      fileType = "audio";
    } else if (this.ALLOWED_DOCUMENT_TYPES.includes(mimetype)) {
      fileType = "document";
    } else {
      return { isValid: false, error: "File type not supported" };
    }

    // Check file size
    const maxSize =
      this.MAX_FILE_SIZES[fileType as keyof typeof this.MAX_FILE_SIZES];
    if (size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds limit of ${
          maxSize / (1024 * 1024)
        }MB for ${fileType} files`,
      };
    }

    return { isValid: true, type: fileType };
  }

  static async optimizeImage(
    buffer: Buffer,
    options: MediaUploadOptions
  ): Promise<Buffer> {
    try {
      let sharpInstance = sharp(buffer);

      // Resize if dimensions specified
      if (options.maxWidth || options.maxHeight) {
        sharpInstance = sharpInstance.resize(
          options.maxWidth,
          options.maxHeight,
          {
            fit: "inside",
            withoutEnlargement: true,
          }
        );
      }

      // Convert format and set quality
      const format = options.format || "webp";
      const quality = options.quality || 80;

      switch (format) {
        case "jpg":
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case "png":
          sharpInstance = sharpInstance.png({ quality });
          break;
        case "webp":
        default:
          sharpInstance = sharpInstance.webp({ quality });
          break;
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      console.error("Error optimizing image:", error);
      return buffer; // Return original if optimization fails
    }
  }

  static async uploadToCloudinary(
    buffer: Buffer,
    options: MediaUploadOptions,
    fileType: string
  ): Promise<MediaUploadResult> {
    return new Promise((resolve, reject) => {
      const resourceType =
        fileType === "video"
          ? "video"
          : fileType === "audio"
          ? "video"
          : "image";

      const uploadOptions: any = {
        resource_type: resourceType,
        folder: options.folder,
        public_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      };

      // Add transformation for images
      if (fileType === "image") {
        uploadOptions.transformation = [
          {
            quality: "auto:good",
            fetch_format: "auto",
          },
        ];
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
              duration: result.duration,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  static async processAndUpload(
    file: Express.Multer.File,
    options: MediaUploadOptions
  ): Promise<MediaUploadResult> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    let processedBuffer = file.buffer;

    // Optimize images
    if (validation.type === "image") {
      processedBuffer = await this.optimizeImage(file.buffer, options);
    }

    return await this.uploadToCloudinary(
      processedBuffer,
      options,
      validation.type!
    );
  }

  static async deleteFromCloudinary(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted media from Cloudinary: ${publicId}`);
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
    }
  }

  static generateThumbnail(videoUrl: string): string {
    // Generate video thumbnail URL using Cloudinary transformations
    const publicId = this.extractPublicId(videoUrl);
    return cloudinary.url(publicId, {
      resource_type: "video",
      transformation: [
        { width: 300, height: 200, crop: "fill" },
        { quality: "auto" },
        { format: "jpg" },
      ],
    });
  }

  private static extractPublicId(url: string): string {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.split(".")[0];
  }
}
