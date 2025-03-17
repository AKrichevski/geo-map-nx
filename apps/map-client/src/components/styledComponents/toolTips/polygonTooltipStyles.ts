import styled from 'styled-components';
import { Tooltip } from 'react-tooltip';
import colors from '../../../consts/colors';

export const StyledTooltip = styled(Tooltip)`
  background-color: ${colors.semiTransparentBlack} !important;
  color: ${colors.white};
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
  z-index: 1000;
  max-width: 250px;
`;

export const TooltipHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  border-bottom: 1px solid rgba(255,255,255,0.3);
  padding-bottom: 5px;
`;

export const ColorIndicator = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  background-color: ${props => props.$color};
  border: 1px solid ${colors.white};
  border-radius: 3px;
  margin-right: 8px;
`;

export const NameSpan = styled.span`
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
