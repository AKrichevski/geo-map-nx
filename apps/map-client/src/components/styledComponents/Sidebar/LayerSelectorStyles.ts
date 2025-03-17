import styled from 'styled-components';
import colors from '../../../consts/colors';

export const LayerSelectorContainer = styled.div``;

export const LayerSelectorHeader = styled.h4`
  margin-bottom: 8px;
`;

export const LayerSelectorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const AddLayerButton = styled.button`
  background: ${colors.primaryBlue};
  color: ${colors.textWhite};
  padding: 6px 10px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

export const LayerSelect = styled.select`
  flex: 1;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid ${colors.borderGray};
`;

export const DeleteLayerButton = styled.button<{ $isDisabled: boolean }>`
  background: ${props => props.$isDisabled ? colors.disabledGray : colors.dangerRed};
  color: ${colors.textWhite};
  padding: 6px;
  border-radius: 4px;
  border: none;
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$isDisabled ? 0.6 : 1};
`;
