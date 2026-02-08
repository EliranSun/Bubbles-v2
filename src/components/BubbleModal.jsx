import { useState, useRef } from 'react';
import { resizeImage } from '../utils/imageUtils';
import ImageCropper from './ImageCropper';

// Category options with colors
export const CATEGORIES = {
  Family: '#F472B6',    // Pink
  Friends: '#60A5FA',   // Blue
  Household: '#FBBF24', // Amber
  Wife: '#F87171',      // Red/Rose
  Creative: '#A78BFA',  // Purple
  Health: '#34D399',    // Green
};

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

// Format date/time for the input defaults
function toLocalDateTimeStrings(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return { date: `${y}-${m}-${d}`, time: `${h}:${min}` };
}

export default function BubbleModal({ bubble, onSave, onClose }) {
  const [name, setName] = useState(bubble?.name || '');
  const [image, setImage] = useState(bubble?.image || null);
  const [history, setHistory] = useState(bubble?.history || []);
  const [category, setCategory] = useState(bubble?.category || '');
  const [isResizing, setIsResizing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Read file as data URL for cropper
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawImageForCrop(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedDataUrl) => {
    setIsResizing(true);
    try {
      // Resize the cropped image
      const resizedImage = await resizeImage(croppedDataUrl, 400);
      setImage(resizedImage);
    } catch (error) {
      console.error('Failed to resize image:', error);
    } finally {
      setIsResizing(false);
      setRawImageForCrop(null);
    }
  };

  const handleCropCancel = () => {
    setRawImageForCrop(null);
  };

  const handleSave = () => {
    onSave({
      ...bubble,
      name: name.trim() || null,
      image,
      history,
      category: category || null
    });
  };

  const removeHistoryEntry = (index) => {
    setHistory(prev => prev.filter((_, i) => i !== index));
  };

  const openDatePicker = () => {
    const now = new Date();
    const defaults = toLocalDateTimeStrings(now);
    setSelectedDate(defaults.date);
    setSelectedTime(defaults.time);
    setShowDatePicker(true);
  };

  const confirmDatePicker = () => {
    const timestamp = new Date(`${selectedDate}T${selectedTime}`).getTime();
    if (!isNaN(timestamp)) {
      setHistory(prev => [...prev, timestamp]);
    }
    setShowDatePicker(false);
  };

  const addNow = () => {
    setHistory(prev => [...prev, Date.now()]);
    setShowDatePicker(false);
  };
  const title = bubble?.name || 'New Activity';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div
        className="w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col rounded-2xl shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white/90 truncate pr-4 tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto flex-grow">
          {/* Name input */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
              Activity Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter activity name..."
              className="w-full px-4 py-3 rounded-xl transition-all text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            />
          </div>

          {/* Category dropdown */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategory('')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  !category
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
                }`}
              >
                None
              </button>
              {Object.entries(CATEGORIES).map(([catName, color]) => (
                <button
                  key={catName}
                  onClick={() => setCategory(catName)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    category === catName
                      ? 'border text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent'
                  }`}
                  style={category === catName ? {
                    backgroundColor: `${color}20`,
                    borderColor: `${color}60`
                  } : {}}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {catName}
                </button>
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
              Image
            </label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {isResizing ? (
                  <svg className="w-6 h-6 animate-spin text-white/30" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>

              {/* Upload button */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white/8 hover:bg-white/12 text-white/70 hover:text-white/90 rounded-lg font-medium transition-all text-sm border border-white/8"
                >
                  Upload Image
                </button>
                {image && (
                  <button
                    onClick={() => setImage(null)}
                    className="px-4 py-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg font-medium transition-all text-sm"
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                History {history.length > 0 && `(${history.length})`}
              </label>
              <button
                onClick={openDatePicker}
                className="px-3 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border border-indigo-500/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Record
              </button>
            </div>
            {history.length > 0 ? (
              <div
                className="rounded-xl max-h-48 overflow-y-auto"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                {[...history].reverse().map((timestamp, reversedIndex) => {
                  const originalIndex = history.length - 1 - reversedIndex;
                  return (
                    <div
                      key={`${timestamp}-${originalIndex}`}
                      className={`flex items-center justify-between px-4 py-3 text-sm text-white/50 ${
                        reversedIndex > 0 ? 'border-t border-white/5' : ''
                      }`}
                    >
                      <span className="font-light">{formatHistoryDate(timestamp)}</span>
                      <button
                        onClick={() => removeHistoryEntry(originalIndex)}
                        className="p-1 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0 ml-2"
                        title="Delete entry"
                      >
                        <svg className="w-4 h-4 text-white/20 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-xl px-4 py-6 text-center text-white/25 text-sm font-light"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                No activity recorded yet. Tap the bubble to log activity!
              </div>
            )}
          </div>

          {/* Created info */}
          {bubble?.createdAt && (
            <div className="text-xs text-white/30 font-light tracking-wide">
              Created {new Date(bubble.createdAt).toLocaleDateString([], {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-white/5 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-white/50 rounded-xl font-medium hover:bg-white/5 transition-all border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Date Selection Dialog */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-xs mx-4 overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="px-5 py-4 border-b border-white/5">
              <h3 className="text-base font-semibold text-white/90 tracking-wide">Select Date & Time</h3>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    colorScheme: 'dark'
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Time</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-white/5">
              <button
                onClick={() => setShowDatePicker(false)}
                className="flex-1 px-3 py-2.5 text-white/50 rounded-xl font-medium hover:bg-white/5 transition-all text-sm border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={addNow}
                className="flex-1 px-3 py-2.5 bg-white/8 text-white/70 rounded-xl font-medium hover:bg-white/12 transition-all text-sm border border-white/8"
              >
                Now
              </button>
              <button
                onClick={confirmDatePicker}
                className="flex-1 px-3 py-2.5 text-white rounded-xl font-medium transition-all text-sm"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper */}
      {rawImageForCrop && (
        <ImageCropper
          imageSrc={rawImageForCrop}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
