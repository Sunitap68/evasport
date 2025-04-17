// pages/api/track.js

import { connectToDatabase } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event_name, event_data } = req.body;
    
    if (!event_name) {
      return res.status(400).json({ error: 'No event name provided' });
    }
    
    // Connect to database
    const db = await connectToDatabase();
    
    // Store the event
    await db.collection('events').insertOne({
      event_name,
      event_data,
      created_at: new Date()
    });
    
    // Also update aggregated metrics if needed
    if (event_name === 'page_view') {
      await db.collection('metrics').updateOne(
        { metric_type: 'page_views' },
        { $inc: { total_count: 1 } },
        { upsert: true }
      );
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking event:', error);
    // Still return success to client even if there was an error
    // to avoid affecting user experience
    return res.status(200).json({ success: true });
  }
}