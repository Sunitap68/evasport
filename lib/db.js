import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

let cachedClient = null;
let cachedDb = null;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!dbName) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

export async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  if (!cachedClient) {
    cachedClient = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  const db = cachedClient.db(dbName);
  cachedDb = db;
  return db;
}

export async function getPhotoStats() {
  const db = await connectToDatabase();
  const totalCount = await db.collection('photos').countDocuments();
  return { totalCount };
}

export async function getRecentPhotos(page = 1, limit = 12) {
  const db = await connectToDatabase();
  const skip = (page - 1) * limit;
  return db.collection('photos')
    .find({})
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

export async function getPhotosByDate(startDate, endDate) {
  const db = await connectToDatabase();
  return db.collection('photos')
    .find({
      created_at: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .sort({ created_at: -1 })
    .toArray();
}