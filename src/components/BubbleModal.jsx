import { useState, useRef } from 'react';
import { resizeImage } from '../utils/imageUtils';

// Format date for history display
function formatHistoryDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === new Date(now - 86400000).toDateString();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function BubbleModal({ bubble, onSave, onClose }) {
  const [name, setName] = useState(bubble?.name || '');
  const [image, setImage] = useState(bubble?.image || null);
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsResizing(true);
      try {
        const resizedImage = await resizeImage(file, 400);
        setImage(resizedImage);
      } catch (error) {
        console.error('Failed to resize image:', error);
      } finally {
        setIsResizing(false);
      }
    }
  };

  const handleSave = () => {
    onSave({
      ...bubble,
      name: name.trim() || null,
      image
    });
  };

  const history = bubble?.history || [];
  const title = bubble?.name || 'New Activity';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800 truncate pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-grow">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter activity name..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex-shrink-0">
                {isResizing ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Upload Image
                </button>
                {image && (
                  <button
                    onClick={() => setImage(null)}
                    className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* History section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              History {history.length > 0 && `(${history.length} total)`}
            </label>
            {history.length > 0 ? (
              <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
                {[...history].reverse().map((timestamp, index) => (
                  <div
                    key={timestamp}
                    className={`px-4 py-3 text-sm text-gray-600 ${
                      index > 0 ? 'border-t border-gray-200' : ''
                    }`}
                  >
                    {formatHistoryDate(timestamp)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-6 text-center text-gray-400 text-sm">
                No activity recorded yet. Tap the bubble to log activity!
              </div>
            )}
          </div>

          {/* Created info */}
          {bubble?.createdAt && (
            <div className="text-sm text-gray-500">
              Created: {new Date(bubble.createdAt).toLocaleDateString([], {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
