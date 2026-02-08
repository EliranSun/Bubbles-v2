export default function AddBubbleButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-14 h-14 text-white rounded-full flex items-center justify-center z-40 active:scale-90 transition-all duration-200 backdrop-blur-sm"
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        boxShadow: '0 4px 25px rgba(99, 102, 241, 0.4), 0 0 60px rgba(99, 102, 241, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}
    >
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
