import styled from "styled-components";
import colors from '../../consts/colors';

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid ${colors.borderGray};
`;

export const ModalTitle = styled.h3`
  margin: 0;
  color: ${colors.textBlack};
  font-size: 18px;
`;

export const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
`;

export const SaveButton = styled.button<{ $isCreating: boolean }>`
  background: ${props => props.$isCreating ? colors.disabledGray : colors.successGreen};
  color: ${colors.textWhite};
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: ${props => props.$isCreating ? 'not-allowed' : 'pointer'};
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
`;

export const CancelButton = styled.button<{ $isCreating: boolean }>`
  background: ${colors.dangerRed};
  color: ${colors.textWhite};
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  cursor: ${props => props.$isCreating ? 'not-allowed' : 'pointer'};
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  opacity: ${props => props.$isCreating ? 0.7 : 1};
`;

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
`;

export const InputLabel = styled.label`
  font-weight: bold;
  color: ${colors.textBlack};
  margin-bottom: 6px;
`;

export const LayerInput = styled.input<{ $hasError: boolean; $isCreating: boolean }>`
  width: 92%;
  padding: 10px 16px;
  border-radius: 6px;
  border: 2px solid ${props => props.$hasError ? colors.dangerRed : colors.borderGray};
  font-size: 14px;
  outline: none;
  transition: border 0.2s ease-in-out;
  background-color: ${props => props.$isCreating ? colors.softGray : colors.textWhite};

  &:focus {
    border: 2px solid ${colors.primaryBlue};
  }
`;

export const ErrorMessage = styled.div`
  color: ${colors.dangerRed};
  font-size: 14px;
  margin-top: 8px;
`;
