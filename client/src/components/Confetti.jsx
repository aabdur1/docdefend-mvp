import { useState, useEffect } from 'react';

const COLORS = [
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#14b8a6', // teal
];

const SHAPES = ['square', 'circle', 'triangle'];

function ConfettiPiece({ delay, left, color, shape, size }) {
  const [style] = useState(() => ({
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${2.5 + Math.random() * 1.5}s`,
  }));

  const shapeStyles = {
    square: { width: size, height: size, backgroundColor: color },
    circle: { width: size, height: size, backgroundColor: color, borderRadius: '50%' },
    triangle: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderLeft: `${size / 2}px solid transparent`,
      borderRight: `${size / 2}px solid transparent`,
      borderBottom: `${size}px solid ${color}`,
    },
  };

  return (
    <div
      className="confetti-piece"
      style={{
        ...style,
        ...shapeStyles[shape],
      }}
    />
  );
}

export default function Confetti({ active, duration = 3000 }) {
  const [pieces, setPieces] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (active) {
      // Generate confetti pieces
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        size: 8 + Math.random() * 8,
      }));
      setPieces(newPieces);
      setIsVisible(true);

      // Clean up after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </div>
  );
}
