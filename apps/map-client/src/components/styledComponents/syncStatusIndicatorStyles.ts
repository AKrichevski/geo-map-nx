import styled from 'styled-components';
import colors from '../../consts/colors';

export const StatusContainer = styled.div<{ $isConnected: boolean; $isOnline: boolean }>`
  position: fixed;
  bottom: 50px;
  right: 10px;
  padding: 5px 10px;
  border-radius: 4px;
  background: ${props =>
  props.$isConnected
    ? (props.$isOnline ? colors.successGreen : colors.primaryBlue)
    : colors.dangerRed
};
  color: ${colors.white};
  font-size: 12px;
  font-weight: bold;
  z-index: 1000;
  cursor: pointer;
  transition: all 0.3s ease;
`;

export const DetailsContainer = styled.div`
  margin-top: 5px;
  font-size: 11px;
  font-weight: normal;
  padding: 5px;
  background: ${colors.lightTransparentBlack};
  border-radius: 3px;
`;

export const LastSyncTime = styled.div`
  font-size: 10px;
  margin-top: 3px;
`;
