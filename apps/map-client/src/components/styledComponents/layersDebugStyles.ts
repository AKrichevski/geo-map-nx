import styled from 'styled-components';
import colors from '../../consts/colors';

export const DebugContainer = styled.div`
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.7);
  color: ${colors.white};
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 9999;
  max-width: 300px;
  max-height: 200px;
  overflow: auto;
`;

export const DebugList = styled.ul`
  margin: 5px 0;
  padding-left: 20px;
`;

export const DebugListItem = styled.li<{ $isSelected: boolean }>`
  color: ${props => props.$isSelected ? colors.goldenYellow : colors.white};
  font-weight: ${props => props.$isSelected ? 'bold' : 'normal'};
`;

export const NoLayersMessage = styled.div`
  color: ${colors.softRed};
`;
