import { useState, useRef, useEffect } from 'react';

export default function Menu({ onExport, onImport }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleExport = () => {
    onExport();
    setIsOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      setIsOpen(false);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div ref={menuRef} className="fixed top-6 right-6 z-40">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-white/90 hover:bg-white rounded-xl shadow-lg flex flex-col items-center justify-center gap-1.5 transition-all"
      >
        <span className="w-5 h-0.5 bg-gray-700 rounded-full" />
        <span className="w-5 h-0.5 bg-gray-700 rounded-full" />
        <span className="w-5 h-0.5 bg-gray-700 rounded-full" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-14 right-0 bg-white rounded-xl shadow-xl overflow-hidden min-w-40 border border-gray-100">
          <button
            onClick={handleExport}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Data
          </button>
          <button
            onClick={handleImportClick}
            className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-t border-gray-100"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Data
          </button>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
