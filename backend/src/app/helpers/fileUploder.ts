// /* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
// import { memoryStorage } from 'multer';
// import streamifier from 'streamifier';
// import { v2 as cloudinary } from 'cloudinary';
// import { HttpException } from '@nestjs/common';
// import config from '../config';

// cloudinary.config({
//   cloud_name: config.cloudinary.name,
//   api_key: config.cloudinary.apiKey,
//   api_secret: config.cloudinary.apiSecret,
// });

// const uploadConfig = {
//   storage: memoryStorage(),
//   // limits: {
//   //   fileSize: 10 * 1024 * 1024, // 10 MB
//   // },
// };

// const uploadToCloudinary = async (
//   file: Express.Multer.File,
// ): Promise<{ url: string; public_id: string }> => {
//   if (!file || !file.buffer?.length) {
//     throw new HttpException('No valid file provided', 400);
//   }

//   if (file.mimetype && !file.mimetype.startsWith('image/')) {
//     throw new HttpException('Only image files are allowed', 400);
//   }

//   return new Promise((resolve, reject) => {
//     const uploadStream = cloudinary.uploader.upload_stream(
//       {
//         folder: 'healthcare_app',
//         resource_type: 'image',
//         transformation: {
//           width: 500,
//           height: 500,
//           crop: 'limit',
//         },
//       },
//       (error, result) => {
//         if (error) return reject(error);

//         if (!result) {
//           return reject(new Error('Upload failed - no result returned'));
//         }
//         resolve({
//           url: result.secure_url,
//           public_id: result.public_id,
//         });
//       },
//     );

//     streamifier.createReadStream(file.buffer).pipe(uploadStream);
//   });
// };

// const deleteFromCloudinary = async (public_id: string): Promise<void> => {
//   if (!public_id) return;
//   try {
//     await cloudinary.uploader.destroy(public_id);
//   } catch (error) {
//     console.error('Cloudinary delete failed:', error);
//   }
// };

// export const fileUpload = {
//   uploadToCloudinary,
//   deleteFromCloudinary,
//   uploadConfig,
// };

import { memoryStorage } from 'multer';
import streamifier from 'streamifier';
import { v2 as cloudinary } from 'cloudinary';
import { HttpException } from '@nestjs/common';
import config from '../config';

type AllowedUploadType = 'image' | 'pdf';
export type CloudinaryResourceType = 'image' | 'raw';

type UploadOptions = {
  allowedTypes?: AllowedUploadType[];
  maxSizeBytes?: number;
};

cloudinary.config({
  cloud_name: config.cloudinary.name,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadConfig = {
  storage: memoryStorage(),
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
  },
};

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder = 'mess_management',
  options: UploadOptions = {},
): Promise<{
  url: string;
  public_id: string;
  resource_type: CloudinaryResourceType;
}> => {
  if (!file || !file.buffer?.length) {
    throw new HttpException('No valid file provided', 400);
  }

  const allowedTypes = options.allowedTypes ?? ['image'];
  const isImage = file.mimetype?.startsWith('image/');
  const isPdf = file.mimetype === 'application/pdf';
  const isAllowed =
    (allowedTypes.includes('image') && isImage) ||
    (allowedTypes.includes('pdf') && isPdf);

  if (!isAllowed) {
    throw new HttpException(
      `Only ${allowedTypes.join(' or ')} files are allowed`,
      400,
    );
  }

  if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
    throw new HttpException('File is too large', 400);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isPdf ? 'raw' : 'image',
        ...(isImage && {
          transformation: { width: 1200, height: 1200, crop: 'limit' },
        }),
      },
      (error, result) => {
        if (error) {
          reject(new Error(error.message || 'Cloudinary upload failed'));
          return;
        }
        if (!result)
          return reject(new Error('Upload failed - no result returned'));
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: isPdf ? 'raw' : 'image',
        });
      },
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: CloudinaryResourceType = 'image',
): Promise<void> => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
  }
};

export const fileUpload = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadConfig,
};
