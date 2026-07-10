import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageCropperModal.css';

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropperModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1)); // Default square but can freely adjust
  }

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) {
      // If no crop, just return the original or cancel
      onCancel();
      return;
    }
    
    // If the user didn't change the crop or it's zero width
    if (!completedCrop.width || !completedCrop.height) {
      onCancel();
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        onComplete(blob);
      },
      'image/jpeg',
      0.95
    );
  };

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-content">
        <div className="crop-modal-header">
          <h3>Crop & Adjust</h3>
          <button type="button" className="crop-modal-close" onClick={onCancel}>✕</button>
        </div>
        
        <div className="crop-area">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
          >
            <img 
              ref={imgRef}
              src={imageSrc}
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', width: 'auto' }}
              alt="Crop me" 
            />
          </ReactCrop>
        </div>
        
        <div className="crop-modal-footer">
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-save" onClick={handleSave}>Save Crop</button>
        </div>
      </div>
    </div>
  );
}
