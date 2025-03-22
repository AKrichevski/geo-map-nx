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
    min-width: 320px;
    max-width: 400px;
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

export const LoadingProgress = styled.div`
  margin-top: 16px;
  font-size: 14px;
  color: ${colors.darkGray};
  background: ${colors.lightGray};
  padding: 8px;
  border-radius: 4px;
`;

export const ErrorMessage = styled.div`
  margin: 16px 0;
  padding: 10px;
  background: ${colors.softRed}33;
  border-left: 4px solid ${colors.dangerRed};
  text-align: left;
  border-radius: 4px;
  
  p {
    margin: 8px 0;
    font-size: 14px;
  }
`;

export const RetryButton = styled.button`
  background: ${colors.primaryBlue};
  color: ${colors.white};
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: ${colors.hoverBlue};
  }
`;

export const StatusText = styled.p`
  font-size: 13px;
  color: ${colors.primaryBlue};
  margin-top: 10px;
`;
