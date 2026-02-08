import { useEffect, useRef, createContext, useContext, useState, useCallback } from 'react';
import Matter from 'matter-js';

const BubbleWorldContext = createContext(null);

export function useBubbleWorld() {
  return useContext(BubbleWorldContext);
}

export default function BubbleWorld({ children }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const bodiesRef = useRef(new Map());
  const [tick, setTick] = useState(0);

  const registerBody = useCallback((id, body) => {
    if (engineRef.current) {
      Matter.Composite.add(engineRef.current.world, body);
      bodiesRef.current.set(id, body);
    }
  }, []);

  const unregisterBody = useCallback((id) => {
    const body = bodiesRef.current.get(id);
    if (body && engineRef.current) {
      Matter.Composite.remove(engineRef.current.world, body);
      bodiesRef.current.delete(id);
    }
  }, []);

  const getBodyPosition = useCallback((id) => {
    const body = bodiesRef.current.get(id);
    if (body) {
      return { x: body.position.x, y: body.position.y, angle: body.angle };
    }
    return null;
  }, []);

  const scaleBody = useCallback((id, scaleFactor) => {
    const body = bodiesRef.current.get(id);
    if (body) {
      Matter.Body.scale(body, scaleFactor, scaleFactor);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallThickness = 100;

    // Create engine with zero gravity
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 }
    });

    engineRef.current = engine;

    // Create boundary walls (invisible)
    const walls = [
      // Top
      Matter.Bodies.rectangle(width / 2, -wallThickness / 2, width + wallThickness * 2, wallThickness, { isStatic: true, label: 'wall' }),
      // Bottom
      Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width + wallThickness * 2, wallThickness, { isStatic: true, label: 'wall' }),
      // Left
      Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height + wallThickness * 2, { isStatic: true, label: 'wall' }),
      // Right
      Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height + wallThickness * 2, { isStatic: true, label: 'wall' })
    ];

    Matter.Composite.add(engine.world, walls);

    // Create mouse constraint for dragging (gentle stiffness for smooth movement)
    const mouse = Matter.Mouse.create(container);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.05,
        damping: 0.3,
        render: { visible: false }
      }
    });

    Matter.Composite.add(engine.world, mouseConstraint);

    // Run the physics loop with fixed timestep
    let animationFrameId;

    const update = () => {
      Matter.Engine.update(engine, 1000 / 60);
      setTick(t => t + 1);
      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    // Handle window resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      Matter.Body.setPosition(walls[0], { x: newWidth / 2, y: -wallThickness / 2 });
      Matter.Body.setPosition(walls[1], { x: newWidth / 2, y: newHeight + wallThickness / 2 });
      Matter.Body.setPosition(walls[2], { x: -wallThickness / 2, y: newHeight / 2 });
      Matter.Body.setPosition(walls[3], { x: newWidth + wallThickness / 2, y: newHeight / 2 });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      Matter.Engine.clear(engine);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{
        touchAction: 'none',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1629 25%, #111827 50%, #0d1321 75%, #0a0e1a 100%)'
      }}
    >
      {/* Ambient background orbs */}
      <div
        className="absolute rounded-full blur-[120px] opacity-20 animate-glow-pulse"
        style={{
          width: 400,
          height: 400,
          top: '10%',
          left: '15%',
          background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        className="absolute rounded-full blur-[120px] opacity-15"
        style={{
          width: 350,
          height: 350,
          bottom: '15%',
          right: '10%',
          background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'glow-pulse 3s ease-in-out infinite 1s'
        }}
      />
      <div
        className="absolute rounded-full blur-[100px] opacity-10"
        style={{
          width: 300,
          height: 300,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'glow-pulse 4s ease-in-out infinite 0.5s'
        }}
      />

      <BubbleWorldContext.Provider value={{ registerBody, unregisterBody, getBodyPosition, scaleBody, tick }}>
        {engineRef.current && children}
      </BubbleWorldContext.Provider>
    </div>
  );
}
