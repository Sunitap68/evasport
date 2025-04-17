  // components/FrameEditor.js
  import { useEffect, useRef, useState } from 'react';
  import styles from '../styles/Home.module.css';

  // Frame image constants from original code
  const CIRCLE_X = 537;
  const CIRCLE_Y = 113.6;
  const CIRCLE_DIAMETER = 430;

  export default function FrameEditor({ canvasRef, name, croppedImage, onFrameLoad }) {
    const frameImageRef = useRef(null);
    
    useEffect(() => {
      // Create the Image object inside useEffect to ensure it runs client-side only
      if (typeof window !== 'undefined') {
        frameImageRef.current = new Image();
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const frameImage = frameImageRef.current;
        
        frameImage.onload = function() {
          // Set canvas size to match frame dimensions
          canvas.width = frameImage.naturalWidth;
          canvas.height = frameImage.naturalHeight;
          
          // Call the update function
          updateCanvas();
          
          // Notify parent component that frame is loaded
          onFrameLoad();
        };
        
        // Load the frame image
        frameImage.src = '/frame.png';
      }
      
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Update canvas whenever props change
    useEffect(() => {
      if (typeof window !== 'undefined') {
        updateCanvas();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, croppedImage]);
    
    const updateCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas || !frameImageRef.current) return;
    
      const ctx = canvas.getContext('2d');
      const frameImage = frameImageRef.current;
    
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    
      // Draw frame
      if (frameImage.complete) {
        ctx.drawImage(frameImage, 0, 0);
    
        if (croppedImage) {
          const userImg = new Image();
          userImg.onload = function () {
            ctx.save();
    
            // Clip using custom rounded-rect path
            const width = CIRCLE_DIAMETER;
            const height = CIRCLE_DIAMETER + 100; // extra height for vertical extension
            const x = CIRCLE_X;
            const y = CIRCLE_Y;
            const radius = width / 2;
    
            ctx.beginPath();
            ctx.moveTo(x, y + radius); // start at bottom of top curve
            ctx.arcTo(x, y, x + radius, y, radius); // top-left curve
            ctx.arcTo(x + width, y, x + width, y + radius, radius); // top-right curve
            ctx.lineTo(x + width, y + height); // right side
            ctx.lineTo(x, y + height); // bottom side
            ctx.closePath();
            ctx.clip();
    
            // Draw cropped image inside
            ctx.drawImage(userImg, x, y, width, height);
            ctx.restore();
    
            addNameToCanvas();
          };
          userImg.src = croppedImage;
        } else {
          addNameToCanvas();
        }
      }
    };
    
    const addNameToCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (name && name.trim()) {
        // Adjust position based on the frame's design
        const nameX = canvas.width / 2;
        const nameY = 713;
        
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(name.trim(), nameX, nameY);
      }
    };

    return (
      <canvas ref={canvasRef} className={styles.previewCanvas} />
    );
  } 