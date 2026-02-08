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
      {/* Menu Button - glass effect */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-1 transition-all backdrop-blur-md"
        style={{
          background: isOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}
      >
        <span className="w-4 h-[1.5px] bg-white/60 rounded-full transition-all" />
        <span className="w-4 h-[1.5px] bg-white/60 rounded-full transition-all" />
        <span className="w-4 h-[1.5px] bg-white/60 rounded-full transition-all" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-14 right-0 rounded-xl overflow-hidden min-w-44 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)'
          }}
        >
          <button
            onClick={handleExport}
            className="w-full px-4 py-3 text-left text-white/70 hover:bg-white/5 flex items-center gap-3 transition-all text-sm font-medium"
          >
            <svg className="w-4.5 h-4.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Data
          </button>
          <button
            onClick={handleImportClick}
            className="w-full px-4 py-3 text-left text-white/70 hover:bg-white/5 flex items-center gap-3 transition-all border-t border-white/5 text-sm font-medium"
          >
            <svg className="w-4.5 h-4.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
