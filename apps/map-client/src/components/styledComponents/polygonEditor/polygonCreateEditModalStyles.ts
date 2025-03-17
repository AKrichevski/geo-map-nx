import styled from 'styled-components';
import colors from '../../../consts/colors';

export const ModalContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: 500px;
  background-color: ${colors.white};
  color: black;
`;

export const MapSection = styled.div`
  flex: 1;
  position: relative;
`;

export const SidebarSection = styled.div`
  width: 320px;
  border-left: 1px solid ${colors.borderGray};
  background: #f7f7f7;
  padding: 8px;
  overflow-y: auto;
`;

export const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.1);
  color: ${colors.red};
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 10px;
`;

export const CoordinatesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export const GeoJsonToggleButton = styled.button`
  background: ${colors.primaryBlue};
  color: ${colors.textWhite};
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
`;

export const GeoJsonDisplay = styled.div`
  background: #1e1e1e;
  color: ${colors.white};
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow-x: auto;
`;

export const NoPointsMessage = styled.div`
  margin-top: 12px;
  padding: 8px;
  background: #f8f8f8;
  border-radius: 4px;
  font-size: 13px;
  color: ${colors.darkGray};
  text-align: center;
`;

export const ModalHeader = styled.div`
  background: #eee;
  padding: 8px;
  cursor: move;
  display: flex;
  justify-content: space-between;
`;

export const ModalHeaderActions = styled.div`
  display: flex;
  align-items: center;
`;

export const ModalHeaderInput = styled.input`
  margin-right: 8px;
`;

export const ModalHeaderButton = styled.button<{ $isDisabled?: boolean }>`
  margin-right: 8px;
  opacity: ${props => props.$isDisabled ? 0.5 : 1};
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
`;
