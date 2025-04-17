// pages/api/save-photo.js

import { connectToDatabase } from '../../lib/db';
import { uploadImageToR2 } from '../../lib/r2storage';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image_data, image_id, user_name, timestamp, session_id } = req.body;
    
    if (!image_data) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    // Extract the base64 data
    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create a unique filename with timestamp
    const date = new Date();
    const formattedDate = date.toISOString().slice(0, 10); // YYYY-MM-DD
    const formattedTime = date.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    
    const sanitizedName = (user_name || 'anonymous')
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);
    
    // Create a unique filename
    const filename = `${formattedDate}_${formattedTime}_${sanitizedName}_${Math.random().toString(36).substring(2, 10)}.jpg`;
    
    // Upload to R2
    const fileUrl = await uploadImageToR2(buffer, filename);
    
    // Store metadata in database
    const db = await connectToDatabase();
    await db.collection('photos').insertOne({
      filename,
      image_id,
      user_name,
      created_at: new Date(timestamp),
      session_id,
      file_url: fileUrl,
    });
    
    // Update the metrics collection
    await db.collection('metrics').updateOne(
      { metric_type: 'photo_creation' },
      { 
        $inc: { total_count: 1 },
        $push: { 
          recent_creations: {
            $each: [{ image_id, user_name, timestamp }],
            $slice: -100 // Keep only the last 100 entries
          }
        }
      },
      { upsert: true }
    );
    
    return res.status(200).json({ 
      success: true,
      filename,
      url: fileUrl
    });
  } catch (error) {
    console.error('Error saving photo:', error);
    return res.status(500).json({ error: 'Failed to save photo' });
  }
}