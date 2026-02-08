import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// Create a cropped image from the crop area
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size to the crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped portion
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as data URL (JPEG for smaller size)
  return canvas.toDataURL('image/jpeg', 0.8);
}

export default function ImageCropper({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (croppedAreaPixels) {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onComplete(croppedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col"
      style={{ background: 'linear-gradient(180deg, #0a0e1a 0%, #111827 100%)' }}
    >
      {/* Cropper area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>

      {/* Controls */}
      <div className="px-6 py-4 space-y-4" style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        {/* Zoom slider */}
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-xs font-medium w-12 uppercase tracking-wider">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-white/50 rounded-xl font-medium hover:bg-white/5 transition-all border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
