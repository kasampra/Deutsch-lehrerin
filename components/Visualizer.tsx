import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
  level: number; // 0 to 1
  color: string;
  label: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive, level, color, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let currentRadius = 50;
    const targetRadius = 50 + (level * 100); // Scale effect

    const draw = () => {
      // Smooth interpolation
      currentRadius += (targetRadius - currentRadius) * 0.2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (isActive) {
        // Outer Glow
        const gradient = ctx.createRadialGradient(centerX, centerY, currentRadius * 0.5, centerX, centerY, currentRadius);
        gradient.addColorStop(0, `${color}40`); // 25% opacity
        gradient.addColorStop(1, `${color}00`); // 0% opacity
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Inner Core
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40 + (level * 10), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        // Resting state
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.fillStyle = '#E5E7EB'; // Gray-200
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [isActive, level, color]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
      </div>
      <span className="mt-2 text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
  );
};

export default Visualizer;
