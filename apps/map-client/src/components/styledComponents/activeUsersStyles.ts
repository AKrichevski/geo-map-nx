import styled from 'styled-components';
import colors from '../../consts/colors';

export const ActiveUsersContainer = styled.div`
  h4 {
    margin-bottom: 8px;
  }
`;

export const ActiveUsersListContainer = styled.div`
  max-height: 150px;
  overflow-y: auto;
  padding-right: 6px;
`;

export const NoUsersMessage = styled.div`
  padding: 10px;
  background: ${colors.lightGray};
  border-radius: 4px;
  text-align: center;
  color: ${colors.darkGray};
  font-size: 14px;
`;

export const UserItemContainer = styled.div<{ $hasActivity: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  background: ${colors.lightGray};
  border-radius: 6px;
  margin-bottom: 6px;
  border: ${props => props.$hasActivity ? '1px solid orange' : 'none'};
`;

export const UserInfoContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const UserDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Username = styled.span`
  font-weight: bold;
`;

export const UserActivityStatus = styled.span`
  font-size: 12px;
  color: orange;
  font-style: italic;
`;

export const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 5px;
`;

export const ActionButton = styled.button<{ $isActive?: boolean }>`
  background: ${props => props.$isActive ? colors.successGreen : colors.primaryBlue};
  color: ${colors.textWhite};
  padding: 4px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
`;
