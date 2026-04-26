// src/components/DrawingLayer.tsx
import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

interface Point {
  time: number;
  price: number;
}

interface Trendline {
  id: string;
  start: Point;
  end: Point;
}

interface DrawingLayerProps {
  chartRef: React.RefObject<any>;
  mode: 'NAV' | 'DRAW';
  setMode: React.Dispatch<React.SetStateAction<'NAV' | 'DRAW'>>;
}

export interface DrawingLayerRef {
  clearAll: () => void;
}

export const DrawingLayer = forwardRef<DrawingLayerRef, DrawingLayerProps>((props, ref) => {
  const { chartRef, mode, setMode } = props;

  const [drawings, setDrawings] = useState<Trendline[]>([]);
  const [activeDrawing, setActiveDrawing] = useState<Partial<Trendline> | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<SVGSVGElement>(null);

  // Expose clearAll to parent (Terminal)
  useImperativeHandle(ref, () => ({
    clearAll: () => {
      setDrawings([]);
      setActiveDrawing(null);
      setIsDragging(false);
    },
  }));

  const getCoordinates = useCallback((e: React.MouseEvent | MouseEvent): Point | null => {
    if (!containerRef.current || !chartRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = chartRef.current.coordinateToTime?.(x);
    const price = chartRef.current.coordinateToPrice?.(y);

    if (time === null || time === undefined || price === null || price === undefined) {
      return null;
    }

    // Convert Time object to number if necessary
    const timeNum = typeof time === 'number' ? time : (time as any).timestamp || (time as any).time || Math.floor(Date.now() / 1000);

    return {
      time: timeNum,
      price: Number(price)
    };
  }, [chartRef]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode !== 'DRAW') return;

    const point = getCoordinates(e);
    if (!point) return;

    setIsDragging(true);
    setActiveDrawing({
      id: 'draw_' + Date.now().toString(36),
      start: point,
      end: point
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mode !== 'DRAW' || !isDragging || !activeDrawing) return;

    const point = getCoordinates(e);
    if (!point) return;

    setActiveDrawing(prev => prev ? { ...prev, end: point } : null);
  };

  const handleMouseUp = () => {
    if (!isDragging || !activeDrawing?.start || !activeDrawing?.end) {
      setIsDragging(false);
      setActiveDrawing(null);
      return;
    }

    setDrawings(prev => [...prev, activeDrawing as Trendline]);
    setActiveDrawing(null);
    setIsDragging(false);
    setMode('NAV'); // Auto exit draw mode
  };

  // Render a single trendline
  const renderTrendline = (line: Trendline, isTemporary: boolean = false) => {
    if (!chartRef.current) return null;

    const x1 = chartRef.current.timeToCoordinate?.(line.start.time);
    const y1 = chartRef.current.priceToCoordinate?.(line.start.price);
    const x2 = chartRef.current.timeToCoordinate?.(line.end.time);
    const y2 = chartRef.current.priceToCoordinate?.(line.end.price);

    if (x1 == null || y1 == null || x2 == null || y2 == null) return null;

    return (
      <line
        key={line.id}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#ffce00"
        strokeWidth="2"
        strokeOpacity={isTemporary ? 0.6 : 1}
        pointerEvents="none"
      />
    );
  };

  // Global events to handle mouse release outside the SVG
  useEffect(() => {
    if (!isDragging) return;
    const up = () => handleMouseUp();
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [isDragging, activeDrawing]);

  return (
    <svg
      ref={containerRef}
      className={`absolute inset-0 w-full h-full z-[40] ${mode === 'DRAW' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      style={{ touchAction: 'none' }}
    >
      {drawings.map(line => renderTrendline(line))}
      {activeDrawing && activeDrawing.start && activeDrawing.end && renderTrendline(activeDrawing as Trendline, true)}
    </svg>
  );
});

DrawingLayer.displayName = 'DrawingLayer';