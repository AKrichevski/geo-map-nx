import styled from 'styled-components';
import colors from '../../../consts/colors';


export const TooltipContainer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
`;

export const TooltipContent = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background-color: ${colors.semiTransparentBlack};
  color: ${colors.white};
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
  z-index: 1000;
  max-width: 250px;
  pointer-events: none;
  transform: translate(0, -100%);
`;

export const TooltipHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  border-bottom: 1px solid ${colors.semiTransparentWhite};
  padding-bottom: 5px;
`;

export const ColorIndicator = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  background-color: ${props => props.$color || colors.black};
  border: 1px solid ${colors.white};
  border-radius: 3px;
  margin-right: 8px;
`;

export const PolygonName = styled.span`
  font-weight: bold;
`;

export const AreaInfo = styled.div`
  font-size: 13px;
  margin-bottom: 3px;
`;

export const LayerInfo = styled.div`
  font-size: 13px;
  margin-bottom: 3px;
`;

export const CreatedInfo = styled.div`
  font-size: 12px;
  color: ${colors.disabledGray};
`;
