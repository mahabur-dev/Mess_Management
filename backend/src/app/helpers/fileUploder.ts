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

cloudinary.config({
  cloud_name: config.cloudinary.name,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadConfig = {
  storage: memoryStorage(),
};

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder = 'mess_management',
): Promise<{ url: string; public_id: string }> => {
  if (!file || !file.buffer?.length) {
    throw new HttpException('No valid file provided', 400);
  }

  if (file.mimetype && !file.mimetype.startsWith('image/')) {
    throw new HttpException('Only image files are allowed', 400);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: { width: 500, height: 500, crop: 'limit' },
      },
      (error, result) => {
        if (error) {
          reject(new Error(error.message || 'Cloudinary upload failed'));
          return;
        }
        if (!result)
          return reject(new Error('Upload failed - no result returned'));
        resolve({ url: result.secure_url, public_id: result.public_id });
      },
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete failed:', error);
  }
};

export const fileUpload = {
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadConfig,
};
