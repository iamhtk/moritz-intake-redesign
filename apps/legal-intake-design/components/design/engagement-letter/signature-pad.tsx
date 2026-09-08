'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/design/design-system/button';

type SignaturePadProps = {
  onChange: (hasSignature: boolean) => void;
};

export function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
    onChange(false);
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const context = canvas.getContext('2d');
      if (!context) return;
      context.scale(ratio, ratio);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = 2;
      context.strokeStyle = '#18181b';
      setHasSignature(false);
      onChange(false);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [onChange]);

  const pointFor = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFor(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    drawingRef.current = true;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const point = pointFor(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    if (!hasSignature) {
      setHasSignature(true);
      onChange(true);
    }
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  return (
    <div className="space-y-2">
      <div className="border-field bg-background relative overflow-hidden rounded-xl border">
        <canvas
          ref={canvasRef}
          className="h-36 w-full cursor-crosshair touch-none"
          aria-label="Draw your signature"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        {!hasSignature ? (
          <span className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
            Draw your signature here
          </span>
        ) : null}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!hasSignature}
          onClick={clear}
        >
          Clear signature
        </Button>
      </div>
    </div>
  );
}
