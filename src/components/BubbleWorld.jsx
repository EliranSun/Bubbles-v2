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

    // Create mouse constraint for dragging
    const mouse = Matter.Mouse.create(container);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
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
      className="fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800"
      style={{ touchAction: 'none' }}
    >
      <BubbleWorldContext.Provider value={{ registerBody, unregisterBody, getBodyPosition, scaleBody, tick }}>
        {engineRef.current && children}
      </BubbleWorldContext.Provider>
    </div>
  );
}
