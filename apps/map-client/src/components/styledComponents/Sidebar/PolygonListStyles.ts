import styled from 'styled-components';
import colors from '../../../consts/colors';

export const PolygonListContainer = styled.div``;

export const PolygonListHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

export const PolygonListTitle = styled.h4`
  margin: 0;
  flex: 1;
`;

export const AddPolygonButton = styled.button`
  background: ${colors.primaryBlue};
  color: ${colors.textWhite};
  padding: 6px 10px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

export const PolygonListContent = styled.div`
  max-height: 300px;
  overflow-y: auto;
  padding-right: 6px;
`;

export const EmptyLayerMessage = styled.div`
  padding: 10px;
  background: ${colors.lightGray};
  border-radius: 4px;
  text-align: center;
  color: ${colors.darkGray};
  font-size: 14px;
`;

export const PolygonItemContainer = styled.div<{ $isEditing: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px;
  background: ${props => props.$isEditing
  ? 'rgba(255, 165, 0, 0.2)'
  : colors.lightGray};
  border-radius: 6px;
  margin-bottom: 6px;
  border: ${props => props.$isEditing
  ? '1px solid orange'
  : 'none'};
`;

export const PolygonInfoContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 160px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
`;

export const PolygonColorIndicator = styled.span<{ $color: string }>`
  width: 16px;
  height: 16px;
  background-color: ${props => props.$color};
  border-radius: 4px;
  border: 1px solid black;
  margin-right: 6px;
`;

export const PolygonDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const PolygonName = styled.strong``;

export const PolygonArea = styled.span<{ $isSmall: boolean }>`
  font-size: 12px;
  color: #555;
  font-weight: ${props => props.$isSmall ? 'normal' : 'normal'};
`;

export const PolygonEditingStatus = styled.span`
  font-size: 12px;
  color: orange;
  font-style: italic;
`;

export const PolygonActionsContainer = styled.div`
  display: flex;
  gap: 6px;
`;

export const ActionButton = styled.button<{ $isDisabled?: boolean }>`
  background: ${props => props.$isDisabled
  ? colors.disabledGray
  : props.color || colors.primaryBlue};
  color: ${colors.textWhite};
  padding: 4px;
  border-radius: 4px;
  border: none;
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
`;
