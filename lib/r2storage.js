// lib/r2Storage.js - R2 Storage Client

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client (compatible with S3 SDK)
export function getR2Client() {
  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_BUCKET_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  
  return client;
}

// Upload image to R2
export async function uploadImageToR2(imageBuffer, fileName, contentType = 'image/jpeg') {
  try {
    const client = getR2Client();
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `images/${fileName}`,
      Body: imageBuffer,
      ContentType: contentType,
    });
    
    await client.send(command);
    
    // Return the public URL to the file
    return `${process.env.R2_BUCKET_ENDPOINT}/evapost/${fileName}`;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
}

// Get a signed URL for temporary access to a private file
export async function getSignedR2Url(fileName, expiresIn = 3600) {
  try {
    const client = getR2Client();
    
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: `images/${fileName}`,
    });
    
    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}