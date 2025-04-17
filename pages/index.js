// Add these imports to your index.js file
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import styles from '../styles/Home.module.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"

// Import components with dynamic loading to avoid SSR issues
const ImageCropper = dynamic(() => import('../components/ImageCropper'), { ssr: false });
const FrameEditor = dynamic(() => import('../components/FrameEditor'), { ssr: false });

// Import tracking after checking for client-side
let trackEvent, trackPhotoCreation;
if (typeof window !== 'undefined') {
  import('../lib/tracking').then(module => {
    trackEvent = module.trackEvent;
    trackPhotoCreation = module.trackPhotoCreation;
  });
}
export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [croppedImage, setCroppedImage] = useState(null);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const canvasRef = useRef(null);
  
  // Track page view when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && trackEvent) {
      trackEvent('page_view', { page: 'home' });
    }
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
    if (typeof window !== 'undefined' && trackEvent) {
      trackEvent('open_upload_modal');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (typeof window !== 'undefined' && trackEvent) {
      trackEvent('close_modal');
    }
  };

  const handleCropComplete = (imageData) => {
    setCroppedImage(imageData);
    setShowModal(false);
    if (typeof window !== 'undefined' && trackEvent) {
      trackEvent('image_cropped');
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    // Debounced tracking for input changes
    if (e.target.value.trim() !== '' && typeof window !== 'undefined' && trackEvent) {
      trackEvent('name_entered');
    }
  };

  const handleSaveImage = async () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.9);
      
      // First, track and save the photo to the server
      if (typeof window !== 'undefined' && trackPhotoCreation) {
        setIsSaving(true);
        
        try {
          const savedFilename = await trackPhotoCreation(dataURL, name);
          
          // If successfully saved to server, trigger local download as well
          const link = document.createElement('a');
          link.download = savedFilename || 'event-invitation.jpg';
          link.href = dataURL;
          link.click();
          
          if (typeof window !== 'undefined' && trackEvent) {
            trackEvent('image_saved', { 
              has_name: name.trim() !== '',
              has_image: !!croppedImage,
              filename: savedFilename
            });
          }
          
          setIsSaving(false);
          setSaveSuccess(true);
          
          // Reset success message after a few seconds
          setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
          console.error('Error saving image:', error);
          setIsSaving(false);
          setSaveError(true);
          
          // Reset error message after a few seconds
          setTimeout(() => setSaveError(false), 3000);
        }
      } else {
        // Fallback to client-side download only if tracking isn't available
        const link = document.createElement('a');
        link.download = 'event-invitation.jpg';
        link.href = dataURL;
        link.click();
      }
    }
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Event Invitation Creator</title>
        <meta name="description" content="Create personalized event invitations" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className={styles.main}>
        
        <div className={styles.finalPreview}>
          <FrameEditor 
            canvasRef={canvasRef}
            name={name}
            croppedImage={croppedImage}
            onFrameLoad={() => setFrameLoaded(true)}
          />
          {/* {croppedImage && <div className={styles.placeholderText}>Upload your photo to preview your invitation</div>} */}
        </div>
        
        <div className={styles.unifiedFrame}>
          <input 
            type="text" 
            id="nameInput" 
            placeholder="Enter your name"
            value={name}
            onChange={handleNameChange}
            className={styles.nameInput}
            />
          <button 
            className={styles.btn}
            onClick={handleOpenModal}
            >
            Upload Your Photo
          </button>
          <button 
            className={`${styles.btn} ${styles.btnSuccess}`}
            disabled={!croppedImage || isSaving}
            onClick={handleSaveImage}
            >
            {isSaving ? 'Saving...' : 'Save & Share'}
          </button>
          
          {saveSuccess && (
            <div className={styles.successMessage}>
              Photo saved successfully!
            </div>
          )}
          
          {saveError && (
            <div className={styles.errorMessage}>
              There was an error saving your photo. Please try again.
            </div>
          )}
        </div>
        <h1 className={styles.productBy}>Designed by Arjitay</h1>
      </main>

      {/* Image Cropper Modal */}
      <ImageCropper 
        isOpen={showModal}
        onClose={handleCloseModal}
        onCropComplete={handleCropComplete}
        />
<Analytics/>
<SpeedInsights/>
    </div>
  );
}