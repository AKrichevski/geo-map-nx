import styled from 'styled-components';
import colors from '../../consts/colors';

export const AreaContainer = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #e9f5ff;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
`;

export const AreaHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const AreaValue = styled.span`
  font-weight: bold;
  font-size: 16px;
  color: ${colors.primaryBlue};
`;

export const AreaInfoSection = styled.div`
  font-size: 12px;
  color: ${colors.darkGray};
  border-top: 1px dashed ${colors.borderGray};
  padding-top: 6px;
  margin-top: 4px;
`;

export const InfoParagraph = styled.p`
  margin: 0 0 4px 0;
`;

export const InfoIcon = styled.span`
  color: ${colors.primaryBlue};
`;
