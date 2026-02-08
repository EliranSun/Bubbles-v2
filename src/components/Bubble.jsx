import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import Matter from 'matter-js';
import GeoPattern from 'geopattern';
import { formatDistanceToNow } from 'date-fns';
import { useBubbleWorld } from './BubbleWorld';
import { CATEGORIES } from './BubbleModal';

// Convert HSL to Hex color
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Format relative time using date-fns
function getRelativeTime(timestamp) {
  if (!timestamp) return null;
  return formatDistanceToNow(timestamp, { addSuffix: true });
}

export default function Bubble({
  id,
  size = 50,
  initialX,
  initialY,
  name,
  lastActivity,
  image,
  category,
  onOpenModal,
  onActivity
}) {
  const { registerBody, unregisterBody, getBodyPosition, scaleBody } = useBubbleWorld();
  const bodyRef = useRef(null);
  const tapStartRef = useRef(null);
  const labelTapRef = useRef(null);
  const prevSizeRef = useRef(size);
  const [isPressed, setIsPressed] = useState(false);

  // Generate geometric pattern once (used as fallback when no image)
  const patternUrl = useMemo(() => {
    const hue = Math.floor(Math.random() * 360);
    const hexColor = hslToHex(hue, 70, 60);
    const pattern = GeoPattern.generate(id || String(Math.random()), {
      baseColor: hexColor
    });
    return pattern.toDataUrl();
  }, [id]);

  useEffect(() => {
    // Create the physics body
    const body = Matter.Bodies.circle(initialX, initialY, size, {
      restitution: 0.9,
      friction: 0.01,
      frictionAir: 0.002,
      inertia: Infinity,
      label: id
    });

    // Give it a random initial velocity
    Matter.Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 6
    });

    bodyRef.current = body;
    prevSizeRef.current = size;
    registerBody(id, body);

    return () => {
      unregisterBody(id);
    };
  }, [id, initialX, initialY, registerBody, unregisterBody]);

  // Handle size changes (scale the physics body)
  useEffect(() => {
    if (bodyRef.current && prevSizeRef.current !== size) {
      const scaleFactor = size / prevSizeRef.current;
      scaleBody?.(id, scaleFactor);
      prevSizeRef.current = size;
    }
  }, [id, size, scaleBody]);

  // Tap detection for activity logging
  const handlePointerDown = useCallback((e) => {
    setIsPressed(true);
    tapStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  }, []);

  const handlePointerUp = useCallback((e) => {
    setIsPressed(false);
    if (!tapStartRef.current) return;

    const dx = e.clientX - tapStartRef.current.x;
    const dy = e.clientY - tapStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - tapStartRef.current.time;

    // It's a tap if moved less than 10px and took less than 300ms
    if (distance < 10 && duration < 300) {
      onActivity?.(id);
    }

    tapStartRef.current = null;
  }, [id, onActivity]);

  const handlePointerLeave = useCallback(() => {
    setIsPressed(false);
    tapStartRef.current = null;
  }, []);

  // Label tap detection using pointer events (works on mobile where
  // Matter.js preventDefault on touch events blocks click synthesis)
  const handleLabelPointerDown = useCallback((e) => {
    labelTapRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  }, []);

  const handleLabelPointerUp = useCallback((e) => {
    // Let onClick handle mouse interactions to avoid double-firing
    if (e.pointerType === 'mouse') return;
    if (!labelTapRef.current) return;

    const dx = e.clientX - labelTapRef.current.x;
    const dy = e.clientY - labelTapRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - labelTapRef.current.time;

    if (distance < 10 && duration < 500) {
      onOpenModal?.(id);
    }
    labelTapRef.current = null;
  }, [id, onOpenModal]);

  // Get current position from physics body
  const pos = getBodyPosition(id);
  if (!pos) return null;

  const diameter = size * 2;
  const relativeTime = getRelativeTime(lastActivity);

  return (
    <div
      className="absolute select-none"
      style={{
        left: pos.x - size,
        top: pos.y - size,
        width: diameter,
        height: diameter
      }}
    >
      {/* Label below bubble - clickable to open modal */}
      <button
        onClick={() => onOpenModal?.(id)}
        onPointerDown={handleLabelPointerDown}
        onPointerUp={handleLabelPointerUp}
        className="absolute left-1/2 text-center whitespace-nowrap pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity flex flex-col items-center gap-0.5 min-w-[40px] min-h-[40px] justify-center"
        style={{
          top: diameter + 4,
          transform: 'translateX(-50%)'
        }}
      >
        {name && (
          <div className="text-white font-medium text-sm drop-shadow-lg">
            {name}
          </div>
        )}
        {relativeTime && (
          <div className="text-white/60 text-xs drop-shadow-lg">
            {relativeTime}
          </div>
        )}
        {/* Info icon - always visible as tap target */}
        {!name && !relativeTime && (
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </button>

      {/* Bubble - tappable for activity */}
      <div
        className="pointer-events-auto cursor-pointer transition-transform duration-150"
        style={{
          width: diameter,
          height: diameter,
          transform: isPressed ? 'scale(0.95)' : 'scale(1)',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 -2px 10px rgba(0, 0, 0, 0.1)',
          border: category && CATEGORIES[category] ? `4px solid ${CATEGORIES[category]}` : 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {/* Background - either uploaded image or geometric pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: image ? `url(${image})` : patternUrl,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Glossy overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 50% 30% at 30% 20%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 40%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Edge highlight */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.3), inset 0 0 3px rgba(255, 255, 255, 0.5)',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
}
