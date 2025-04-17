import '../styles/globals.css';
import { useEffect } from 'react';
import { initTracking } from '../lib/tracking';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize tracking on app load
    if (typeof window !== 'undefined') {
      try {
        initTracking();
      } catch (error) {
        console.error('Error initializing tracking:', error);
      }
    }
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}

export default MyApp;