import styled, { keyframes } from 'styled-components';
import colors from '../../../consts/colors';

export const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const LoadingContainer = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  background: ${colors.softGray};
`;

export const LoadingCard = styled.div`
  padding: 20px;
  background: ${colors.white};
  border-radius: 8px;
  box-shadow: 0 2px 10px ${colors.lightTransparentBlack};
  text-align: center;
`;

export const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid ${colors.lightSilver};
  border-top: 5px solid ${colors.skyBlue};
  border-radius: 50%;
  margin: 20px auto;
  animation: ${spinAnimation} 1s linear infinite;
`;
