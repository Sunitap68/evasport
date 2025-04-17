// lib/tracking.js - Fixed version with exported initTracking function

// Initialize tracking and return session ID
export function initTracking() {
  // Generate a session ID if not already set
  let sid = null;
  
  if (typeof window !== 'undefined') {
    // Try to get existing session ID from localStorage
    sid = localStorage.getItem('session_id');
    
    // If no session ID exists, create a new one
    if (!sid) {
      sid = generateSessionId();
      localStorage.setItem('session_id', sid);
    }
    
    // Set up basic analytics tracking
    console.log('Tracking initialized with session ID:', sid);
    
    // You could initialize more advanced tracking here
    // e.g., Google Analytics, Mixpanel, etc.
  }
  
  return sid;
}

// Helper function to generate a unique session ID
function generateSessionId() {
  return 'sid_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Track events
export function trackEvent(eventName, eventData = {}) {
  // Initialize tracking if not already done
  const sid = initTracking();
  
  // Add session ID to event data
  const enhancedData = { 
    ...eventData,
    session_id: sid,
    timestamp: new Date().toISOString()
  };
  
  // Log the event (for development)
  console.log(`Event: ${eventName}`, enhancedData);
  
  // Send to backend API
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_name: eventName,
        event_data: enhancedData
      }),
      // Don't wait for response
      keepalive: true
    });
  } catch (error) {
    console.error('Error sending tracking data:', error);
  }
  
  return sid;
}

// Track photo creation and save the image
export async function trackPhotoCreation(imageData, userName) {
  // Initialize tracking if not done already
  const sid = initTracking();
  
  try {
    // Create a unique image identifier with timestamp
    const timestamp = new Date();
    const formattedTimestamp = timestamp.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const imageId = `photo_${formattedTimestamp}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Send tracking data and image to backend
    const response = await fetch('/api/save-photo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_data: imageData,
        image_id: imageId,
        user_name: userName || 'anonymous',
        timestamp: timestamp.toISOString(),
        session_id: sid,
        user_agent: navigator.userAgent,
      }),
    });
    
    if (!response.ok) {
      console.error('Error saving photo:', await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.filename; // Return the generated filename
  } catch (error) {
    console.error('Failed to save photo:', error);
    return null;
  }
}