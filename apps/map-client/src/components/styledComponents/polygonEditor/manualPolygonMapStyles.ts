import styled from 'styled-components';

export const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export const MapCanvasOverlay = styled.canvas`
  position: absolute;
  inset: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
`;

export const MapDiv = styled.div`
  position: absolute;
  inset: 0;
`;

export const MouseCoordinatesDisplay = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1;
  font-family: monospace;
`;
