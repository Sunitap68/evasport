import { MongoClient } from 'mongodb';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// MongoDB setup
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return { db: cachedDb };

  if (!cachedClient) {
    cachedClient = await MongoClient.connect(uri);
  }

  const db = cachedClient.db(dbName);
  cachedDb = db;
  return { db };
}

// S3 setup (R2-compatible)
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// List and generate signed URLs for all S3 objects
async function getSignedUrlMap(bucketName) {
  const command = new ListObjectsV2Command({ Bucket: bucketName });
  const response = await s3.send(command);

  if (!response.Contents) return {};

  const signedUrlMap = {};

  await Promise.all(
    response.Contents.map(async (item) => {
      const key = item.Key;
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      try {
        const url = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
        signedUrlMap[key] = url;
      } catch (err) {
        console.warn(`Failed to generate signed URL for ${key}`, err);
      }
    })
  );

  return signedUrlMap;
}

// API handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page = 1, limit = 20, startDate, endDate, includeRecent } = req.query;
    const { db } = await connectToDatabase();

    const totalCount = (
      await db.collection('metrics').findOne({ metric_type: 'photo_creation' })
    )?.total_count || 0;

    const data = { totalCount };

    // Get recent photo metadata
    if (includeRecent) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const recentPhotos = await db.collection('photos')
        .find({})
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // Generate signed URL map from S3
      const signedUrlMap = await getSignedUrlMap(process.env.R2_BUCKET_NAME);

      // Match filenames using regex
      const enrichedPhotos = recentPhotos.map((photo) => {
        const filename = photo.filename;
        const matchedKey = Object.keys(signedUrlMap).find((key) =>
          new RegExp(`${filename}$`).test(key)
        );
        const file_url = matchedKey ? signedUrlMap[matchedKey] : null;
        return { ...photo, file_url };
      });

      data.recentPhotos = enrichedPhotos;
    }

    // Get photos grouped by date
    if (startDate && endDate) {
      const photosByDate = await db.collection('photos').aggregate([
        {
          $match: {
            created_at: {
              $gte: new Date(startDate),
              $lte: new Date(endDate),
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray();

      data.photosByDate = photosByDate;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching photo stats:', error);
    res.status(500).json({ error: 'Failed to retrieve photo statistics' });
  }
}
