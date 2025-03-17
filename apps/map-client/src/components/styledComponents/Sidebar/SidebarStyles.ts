import styled from 'styled-components';
import colors from '../../../consts/colors';

export const SidebarWrapper = styled.div`
  position: relative;
`;

export const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 0;
  left: ${props => props.$isOpen ? 0 : '-340px'};
  width: 320px;
  height: 100vh;
  background: ${colors.backgroundGray};
  padding: 12px;
  border-radius: 8px 8px 8px 0;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease-in-out;
  overflow-y: auto;
  z-index: 10;
`;

export const SidebarSeparator = styled.hr`
  margin: 10px 0;
  border: none;
  border-top: 1px solid ${colors.borderGray};
`;
