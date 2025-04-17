// components/ImageCropper.js
import { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import "cropperjs/dist/cropper.css";
import styles from '../styles/Home.module.css';

export default function ImageCropper({ isOpen, onClose, onCropComplete }) {
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState('Choose Photo');
  const cropperRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrop = () => {
    if (cropperRef.current && cropperRef.current.cropper) {
      const cropper = cropperRef.current.cropper;

      const width = 417;
      const height = 527;

      const croppedCanvas = cropper.getCroppedCanvas({
        width,
        height,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });

      if (!croppedCanvas) return;

      // Create a new canvas for applying the shape mask
      const maskedCanvas = document.createElement('canvas');
      maskedCanvas.width = width;
      maskedCanvas.height = height;

      const ctx = maskedCanvas.getContext('2d');

      // Draw the original cropped image
      ctx.drawImage(croppedCanvas, 0, 0);

      // Apply the rounded-top mask
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      const radius = width / 2;
      ctx.moveTo(0, height);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.quadraticCurveTo(width, 0, width, radius);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Convert to base64
      const croppedImageData = maskedCanvas.toDataURL('image/png');
      onCropComplete(croppedImageData);

      // Reset
      setImage(null);
      setFileName('Choose Photo');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h3>Adjust Your Photo</h3>
        <label className={styles.customFileUpload}>
          {fileName}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
          />
        </label>
        
        <div className={styles.cropContainer}>
          {image ? (
            <Cropper
              src={image}
              style={{ height: 350, width: '100%' }}
              aspectRatio={417 / 527}
              guides={true}
              viewMode={2}
              autoCropArea={0.8}
              ref={cropperRef}
            />
          ) : (
            <div className={styles.emptyPreview}>
              No image selected
            </div>
          )}
        </div>
        
        <div className={styles.modalButtons}>
          <button 
            className={styles.btn}
            onClick={handleCrop}
            disabled={!image}
          >
            Use This Photo
          </button>
          <button 
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}