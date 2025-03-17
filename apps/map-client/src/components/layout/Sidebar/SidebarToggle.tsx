import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import styled from 'styled-components';
import colors from '../../../consts/colors';

export const ToggleButton = styled.button<{ $isOpen: boolean }>`
  position: absolute;
  top: 20px;
  left: ${props => props.$isOpen ? 330 : 10}px;
  background: ${colors.primaryBlue};
  color: ${colors.white};
  padding: 10px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: left 0.3s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export interface SidebarToggleProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({
                                                              isOpen,
                                                              setIsOpen
                                                            }) => {
  return (
    <ToggleButton
      onClick={() => setIsOpen(!isOpen)}
      title="Toggle Sidebar"
      $isOpen={isOpen}
    >
      {isOpen ? <FiChevronLeft size={24} /> : <FiChevronRight size={24} />}
    </ToggleButton>
  );
};

export default SidebarToggle;
