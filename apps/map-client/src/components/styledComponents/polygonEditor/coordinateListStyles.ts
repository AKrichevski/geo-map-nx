import styled from 'styled-components';
import React from 'react';
import colors from '../../../consts/colors';

export const ListContainer = styled.div`
  width: 100%;
  overflow-y: auto;
`;

export const DroppableContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const DraggableItem = styled.div<{ style?: React.CSSProperties }>`
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: ${colors.white};
  border: 1px solid ${colors.disabledGray};
  border-radius: 4px;
  ${props => props.style ? Object.entries(props.style).map(([key, value]) => `${key}: ${value};`).join(' ') : ''}
`;

export const IndexLabel = styled.div`
  margin-right: 8px;
  color: ${colors.darkGray};
`;

export const CoordinateText = styled.div`
  flex: 1;
`;

export const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: ${colors.red};
  cursor: pointer;
`;
