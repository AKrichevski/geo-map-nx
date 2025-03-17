import styled from "styled-components";
import colors from '../../consts/colors';

export const ConnectionAlertContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(220, 53, 69, 0.9);
  color: ${colors.white};
  padding: 10px;
  text-align: center;
  z-index: 1000;
`;

export const DismissButton = styled.button`
  margin-left: 10px;
  padding: 3px 8px;
  background-color: ${colors.white};
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;
