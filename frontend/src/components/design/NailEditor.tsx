import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface NailZone {
  id: string;
  name: string;
  points: { x: number; y: number }[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: { x: number; y: number };
}

interface NailDetectionResult {
  success: boolean;
  nails: NailZone[];
  imageSize: { width: number; height: number };
  message?: string;
}

interface NailEditorProps {
  image: string;
  detectionResult: NailDetectionResult | null;
  nailColors: Record<string, string>;
  nailPatterns: Record<string, string>;
  selectedNail: string | null;
  onNailSelect: (nailId: string | null) => void;
  onColorApply: (nailId: string, color: string) => void;
  onPatternApply: (nailId: string, pattern: string) => void;
}

const NailEditor: React.FC<NailEditorProps> = ({
  image,
  detectionResult,
  nailColors,
  nailPatterns,
  selectedNail,
  onNailSelect,
  onColorApply,
  onPatternApply,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageObj(img);
      
      // Calculate canvas size to fit the container while maintaining aspect ratio
      const maxWidth = 800;
      const maxHeight = 600;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
      
      setCanvasSize({
        width: img.width * scale,
        height: img.height * scale
      });
    };
    img.src = image;
  }, [image]);

  // Render canvas
  useEffect(() => {
    if (!canvasRef.current || !imageObj) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the original image
    ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

    // If we have detection results, draw nail overlays
    if (detectionResult?.success && detectionResult.nails.length > 0) {
      const scaleX = canvas.width / detectionResult.imageSize.width;
      const scaleY = canvas.height / detectionResult.imageSize.height;

      detectionResult.nails.forEach((nail) => {
        // Scale the nail points to canvas size
        const scaledPoints = nail.points.map(p => ({
          x: p.x * scaleX,
          y: p.y * scaleY
        }));

        // Create nail path
        ctx.beginPath();
        ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
        scaledPoints.forEach((point, index) => {
          if (index > 0) {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();

        // Save current context state
        ctx.save();

        // Clip to nail shape
        ctx.clip();

        // Apply color if set
        if (nailColors[nail.id]) {
          ctx.fillStyle = nailColors[nail.id];
          ctx.fill();
        }

        // Apply pattern if set
        if (nailPatterns[nail.id]) {
          applyPattern(ctx, nail, nailPatterns[nail.id], scaleX, scaleY);
        }

        // Restore context
        ctx.restore();

        // Draw selection outline if selected
        if (selectedNail === nail.id) {
          ctx.strokeStyle = '#FF69B4';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
          scaledPoints.forEach((point, index) => {
            if (index > 0) {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.closePath();
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw nail outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
        scaledPoints.forEach((point, index) => {
          if (index > 0) {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();
        ctx.stroke();
      });
    }
  }, [imageObj, detectionResult, nailColors, nailPatterns, selectedNail, canvasSize]);

  const applyPattern = (
    ctx: CanvasRenderingContext2D,
    nail: NailZone,
    pattern: string,
    scaleX: number,
    scaleY: number
  ) => {
    const centerX = nail.center.x * scaleX;
    const centerY = nail.center.y * scaleY;
    const width = nail.boundingBox.width * scaleX;
    const height = nail.boundingBox.height * scaleY;

    ctx.save();
    
    switch (pattern) {
      case 'dots': {
        ctx.fillStyle = 'white';
        const dotSize = 3;
        const spacing = 10;
        for (let x = -width/2; x < width/2; x += spacing) {
          for (let y = -height/2; y < height/2; y += spacing) {
            ctx.beginPath();
            ctx.arc(centerX + x, centerY + y, dotSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
        
      case 'stripes': {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        const stripeSpacing = 8;
        for (let i = -width; i < width; i += stripeSpacing) {
          ctx.beginPath();
          ctx.moveTo(centerX + i - height/2, centerY - height/2);
          ctx.lineTo(centerX + i + height/2, centerY + height/2);
          ctx.stroke();
        }
        break;
      }
        
      case 'glitter': {
        const glitterCount = 20;
        for (let i = 0; i < glitterCount; i++) {
          const x = centerX + (Math.random() - 0.5) * width;
          const y = centerY + (Math.random() - 0.5) * height;
          const size = Math.random() * 3 + 1;
          
          ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 70%, 0.8)`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
        
      case 'gradient': {
        const gradient = ctx.createLinearGradient(
          centerX - width/2, centerY - height/2,
          centerX + width/2, centerY + height/2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - width/2, centerY - height/2, width, height);
        break;
      }
    }
    
    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!detectionResult || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const scaleX = canvas.width / detectionResult.imageSize.width;
    const scaleY = canvas.height / detectionResult.imageSize.height;

    // Check if click is inside any nail zone
    for (const nail of detectionResult.nails) {
      const scaledPoints = nail.points.map(p => ({
        x: p.x * scaleX,
        y: p.y * scaleY
      }));

      if (isPointInPolygon({ x, y }, scaledPoints)) {
        onNailSelect(nail.id);
        return;
      }
    }

    // If no nail was clicked, deselect
    onNailSelect(null);
  };

  const isPointInPolygon = (
    point: { x: number; y: number },
    polygon: { x: number; y: number }[]
  ): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  };

  return (
    <Card className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onClick={handleCanvasClick}
        className="cursor-pointer"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {!detectionResult && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
          <p>Click "Detect Nails" to start editing</p>
        </div>
      )}
    </Card>
  );
};

export default NailEditor;