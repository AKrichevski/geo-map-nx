import React, { useRef, useEffect, useState } from 'react';

interface CanvasOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
                                                              canvasRef,
                                                            }) => {
  const [hoveredPolygon, setHoveredPolygon] = useState<any>(null);
  const tooltipId = useRef(`polygon-tooltip-${Date.now()}`);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      let foundPolygon = null;

      if (foundPolygon !== hoveredPolygon) {
        setHoveredPolygon(foundPolygon);

        if (foundPolygon) {
          canvas.setAttribute('data-tooltip-id', tooltipId.current);
          canvas.setAttribute('data-tooltip-html', 'true');
        } else {
          canvas.removeAttribute('data-tooltip-id');
          canvas.removeAttribute('data-tooltip-html');
        }
      }
    };

    const handleMouseLeave = () => {
      setHoveredPolygon(null);
      canvas.removeAttribute('data-tooltip-id');
      canvas.removeAttribute('data-tooltip-html');
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [canvasRef, hoveredPolygon]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          width: "100%",
          height: "100%",
        }}
        data-tooltip-id={hoveredPolygon ? tooltipId.current : undefined}
      />
    </>
  );
};
