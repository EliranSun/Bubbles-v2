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
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
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
              onOpenModal={handleOpenModal}
              onActivity={logActivity}
            />
          );
        })}
      </BubbleWorld>

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
