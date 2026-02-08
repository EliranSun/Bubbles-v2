import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import Matter from 'matter-js';
import GeoPattern from 'geopattern';
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

// Format relative time (e.g., "5 minutes", "3 days", "2 weeks")
function getRelativeTime(timestamp) {
  if (!timestamp) return null;

  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'}`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

// Get a softer glow color from category
function getCategoryGlow(category) {
  if (!category || !CATEGORIES[category]) return 'rgba(99, 102, 241, 0.3)';
  const hex = CATEGORIES[category];
  // Parse hex to rgb
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.35)`;
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
      restitution: 0.3,
      friction: 0.1,
      frictionAir: 0.04,
      inertia: Infinity,
      label: id
    });

    // Give it a gentle random initial velocity
    Matter.Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
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
  const glowColor = getCategoryGlow(category);
  const borderColor = category && CATEGORIES[category] ? CATEGORIES[category] : null;

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
        className="absolute left-1/2 text-center whitespace-nowrap z-10
        pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity
        flex flex-col items-center min-w-[40px] min-h-[20px] justify-center"
        style={{
          top: diameter / 2 + 12,
          transform: 'translateX(-50%)'
        }}
      >
        {name && (
          <div className="text-white/90 font-medium text-sm leading-tight tracking-wide"
            style={{
              textShadow: '0 1px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)'
            }}
          >
            {name}
          </div>
        )}
        {relativeTime && (
          <div className="text-white/40 text-[10px] mt-0.5 font-light tracking-wider"
            style={{
              textShadow: '0 1px 4px rgba(0,0,0,0.8)'
            }}
          >
            {relativeTime}
          </div>
        )}
        {/* Info icon - always visible as tap target */}
        {!name && !relativeTime && (
          <div className="w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </button>

      {/* Bubble - tappable for activity */}
      <div
        className="pointer-events-auto cursor-pointer transition-transform duration-200 ease-out"
        style={{
          width: diameter,
          height: diameter,
          transform: isPressed ? 'scale(0.92)' : 'scale(1)',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: borderColor
            ? `0 4px 30px ${glowColor}, 0 0 60px ${glowColor}, inset 0 -2px 10px rgba(0, 0, 0, 0.2)`
            : '0 4px 30px rgba(0, 0, 0, 0.4), 0 0 60px rgba(99, 102, 241, 0.1), inset 0 -2px 10px rgba(0, 0, 0, 0.2)',
          border: borderColor ? `3px solid ${borderColor}40` : '2px solid rgba(255, 255, 255, 0.08)'
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

        {/* Glossy overlay - refined */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 35% 25%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.15) 40%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Edge highlight - subtle rim light */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: 'inset 0 1px 15px rgba(255, 255, 255, 0.15), inset 0 -1px 15px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
}
