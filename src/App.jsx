import { useState, useEffect, useCallback } from 'react';
import BubbleWorld from './components/BubbleWorld';
import Bubble from './components/Bubble';
import BubbleModal from './components/BubbleModal';
import AddBubbleButton from './components/AddBubbleButton';
import Menu from './components/Menu';
import { initDB, saveBubbles, loadBubbles } from './utils/storage';

// Size calculation constants
const MIN_SIZE = 15;
const MAX_SIZE = 50;
const MAX_HOURS = 168; // 1 week

// Calculate bubble size based on time since last activity (logarithmic growth)
function calculateSize(lastActivityTime) {
  if (!lastActivityTime) return MIN_SIZE;
  const hoursSince = (Date.now() - lastActivityTime) / (1000 * 60 * 60);
  const scale = Math.log(1 + hoursSince) / Math.log(1 + MAX_HOURS);
  return MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.min(scale, 1);
}

// Get the last activity time from history or createdAt
function getLastActivity(bubble) {
  if (bubble.history && bubble.history.length > 0) {
    return bubble.history[bubble.history.length - 1];
  }
  return bubble.createdAt;
}

function App() {
  const [bubbles, setBubbles] = useState([]);
  const [editingBubbleId, setEditingBubbleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load bubbles from IndexedDB on mount
  useEffect(() => {
    async function load() {
      try {
        await initDB();
        const stored = await loadBubbles();
        // Assign new random positions to restored bubbles
        // Also migrate old data structure if needed
        const withPositions = stored.map(bubble => ({
          ...bubble,
          // Migrate old structure: timestamp -> createdAt, add history
          createdAt: bubble.createdAt || bubble.timestamp || Date.now(),
          history: bubble.history || [],
          initialX: 100 + Math.random() * (window.innerWidth - 200),
          initialY: 100 + Math.random() * (window.innerHeight - 200)
        }));
        setBubbles(withPositions);
      } catch (e) {
        console.error('Failed to load bubbles:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Save bubbles to IndexedDB when they change
  useEffect(() => {
    if (!isLoading && bubbles.length >= 0) {
      // Strip position data before saving
      const toSave = bubbles.map(({ initialX, initialY, ...rest }) => rest);
      saveBubbles(toSave).catch(e => console.error('Failed to save bubbles:', e));
    }
  }, [bubbles, isLoading]);

  const addBubble = useCallback(() => {
    const now = Date.now();
    const newBubble = {
      id: `bubble-${now}`,
      initialX: 100 + Math.random() * (window.innerWidth - 200),
      initialY: 100 + Math.random() * (window.innerHeight - 200),
      name: null,
      image: null,
      createdAt: now,
      history: []
    };
    setBubbles(prev => [...prev, newBubble]);
  }, []);

  const updateBubble = useCallback((updatedBubble) => {
    setBubbles(prev =>
      prev.map(b => b.id === updatedBubble.id ? updatedBubble : b)
    );
    setEditingBubbleId(null);
  }, []);

  const handleOpenModal = useCallback((bubbleId) => {
    setEditingBubbleId(bubbleId);
  }, []);

  // Log an activity (tap on bubble)
  const logActivity = useCallback((bubbleId) => {
    setBubbles(prev =>
      prev.map(b => {
        if (b.id === bubbleId) {
          return {
            ...b,
            history: [...(b.history || []), Date.now()]
          };
        }
        return b;
      })
    );
  }, []);

  const handleExport = useCallback(() => {
    const exportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      bubbles: bubbles.map(({ initialX, initialY, ...rest }) => rest)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habits-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [bubbles]);

  const handleImport = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.bubbles || !Array.isArray(data.bubbles)) {
          throw new Error('Invalid file format');
        }

        // Add random positions and migrate old structure if needed
        const importedBubbles = data.bubbles.map(bubble => ({
          ...bubble,
          createdAt: bubble.createdAt || bubble.timestamp || Date.now(),
          history: bubble.history || [],
          initialX: 100 + Math.random() * (window.innerWidth - 200),
          initialY: 100 + Math.random() * (window.innerHeight - 200)
        }));

        setBubbles(importedBubbles);
      } catch (error) {
        console.error('Failed to import:', error);
        alert('Failed to import file. Please make sure it\'s a valid export file.');
      }
    };
    reader.readAsText(file);
  }, []);

  const editingBubble = bubbles.find(b => b.id === editingBubbleId);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1629 25%, #111827 50%, #0d1321 75%, #0a0e1a 100%)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full animate-glow-pulse"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
              filter: 'blur(1px)'
            }}
          />
          <div className="text-white/30 text-sm font-light tracking-wider">Loading</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <BubbleWorld>
        {bubbles.map((bubble) => {
          const lastActivity = getLastActivity(bubble);
          const size = calculateSize(lastActivity);
          return (
            <Bubble
              key={bubble.id}
              id={bubble.id}
              size={size}
              initialX={bubble.initialX}
              initialY={bubble.initialY}
              name={bubble.name}
              lastActivity={lastActivity}
              image={bubble.image}
              category={bubble.category}
              onOpenModal={handleOpenModal}
              onActivity={logActivity}
            />
          );
        })}
      </BubbleWorld>

      {/* Empty state */}
      {bubbles.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="text-center px-8">
            <div className="animate-float mb-6 inline-block">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 0 40px rgba(99, 102, 241, 0.1)'
                }}
              >
                <svg className="w-8 h-8 text-indigo-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            <h3 className="text-white/50 text-lg font-medium tracking-wide mb-2">No bubbles yet</h3>
            <p className="text-white/25 text-sm font-light max-w-xs mx-auto leading-relaxed">
              Tap the + button to create your first activity bubble
            </p>
          </div>
        </div>
      )}

      <Menu onExport={handleExport} onImport={handleImport} />
      <AddBubbleButton onClick={addBubble} />

      {editingBubble && (
        <BubbleModal
          bubble={editingBubble}
          onSave={updateBubble}
          onClose={() => setEditingBubbleId(null)}
        />
      )}
    </>
  );
}

export default App;
