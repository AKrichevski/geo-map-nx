import colors from '../../consts/colors';
import styled from 'styled-components';

export const MapContainer = styled.div`
  position: absolute;
  inset: 0;
`;

export const ActiveUsersContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  background: ${colors.semiTransparentBlack};
  color: ${colors.textWhite};
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
`;

export const ActiveUsersTitle = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

export const JumpToPointContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 50px;
  z-index: 1;
`;

export const JumpInputContainer = styled.div`
  background: ${colors.backgroundGray};
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px ${colors.lightTransparentBlack};
  display: flex;
  gap: 8px;
`;

export const JumpInput = styled.input`
  width: 80px;
  padding: 4px;
  border-radius: 4px;
  border: 1px solid ${colors.borderGray};
`;

export const JumpButton = styled.button`
  background: ${colors.primaryBlue};
  color: ${colors.textWhite};
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
`;

export const CancelButton = styled.button`
  background: ${colors.dangerRed};
  color: ${colors.textWhite};
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
`;

export const JumpToPointButton = styled.button`
  background: ${colors.primaryBlue};
  color: ${colors.textWhite};
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const MouseCoordinatesDisplay = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: ${colors.semiTransparentBlack};
  color: ${colors.textWhite};
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1;
  font-family: monospace;
`;
