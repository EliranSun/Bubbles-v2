export default function AddBubbleButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-8 right-8 w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 active:scale-95"
    >
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
